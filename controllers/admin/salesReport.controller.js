import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import Order from '../../models/order.model.js';
import asyncHandler from '../../utils/asyncHandler.js';
import getDateRange from '../../helpers/reportFilter.js';

export const exportSalesPDF = async (req, res) => {
  const { range = 'daily', startDate, endDate } = req.query;
  const { from, to } = getDateRange(range, startDate, endDate);

  const orders = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: from, $lte: to },
        paymentStatus: 'PAID',
        orderStatus: { $in: ['DELIVERED', 'RETURNED'] },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        orderId: 1,
        createdAt: 1,
        subtotal: 1,
        discount: 1,
        totalAmount: 1,
        orderStatus: 1,
        'user.name': 1,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=sales-report.pdf'
  );

  doc.pipe(res);

  // ---------------- HEADER ----------------
  doc.fontSize(18).font('Helvetica-Bold').text('Sales Report', {
    align: 'center',
  });

  doc
    .moveDown(0.5)
    .fontSize(10)
    .font('Helvetica')
    .text(`Period: ${from.toDateString()} - ${to.toDateString()}`, {
      align: 'center',
    });

  doc.moveDown(1.5);

  const colX = {
    date: 40,
    order: 100,
    customer: 170,
    status: 260,
    gross: 320,
    discount: 390,
    net: 460,
  };

  const drawTableHeader = (yPos) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Date', colX.date, yPos)
      .text('Order ID', colX.order, yPos)
      .text('Customer', colX.customer, yPos)
      .text('Status', colX.status, yPos)
      .text('Gross', colX.gross, yPos, { width: 60, align: 'right' })
      .text('Discount', colX.discount, yPos, { width: 60, align: 'right' })
      .text('Net', colX.net, yPos, { width: 60, align: 'right' });

    doc
      .moveTo(40, yPos + 15)
      .lineTo(550, yPos + 15)
      .stroke();
  };

  let y = doc.y;
  drawTableHeader(y);
  y += 25;

  let totalGross = 0;
  let totalDiscount = 0;
  let totalReturns = 0;
  let finalNetRevenue = 0;

  doc.font('Helvetica').fontSize(9);

  orders.forEach((order, index) => {
    if (y > 750) {
      doc.addPage();
      y = 50;
      drawTableHeader(y);
      y += 25;
    }

    totalGross += order.subtotal;
    totalDiscount += order.discount;

    let netAmount = order.totalAmount;
    let returnAmount = 0;

    if (order.orderStatus === 'RETURNED') {
      returnAmount = order.totalAmount;
      totalReturns += returnAmount;
      netAmount = 0;
    } else {
      finalNetRevenue += netAmount;
    }

    if (index % 2 === 0) {
      doc
        .rect(40, y - 2, 510, 16)
        .fill('#f5f5f5')
        .fillColor('black');
    }

    doc
      .text(
        new Date(order.createdAt).toLocaleDateString(),
        colX.date,
        y
      )
      .text(order.orderId, colX.order, y)
      .text(order.user.name, colX.customer, y, { width: 80 })
      .text(order.orderStatus, colX.status, y)
      .text(`₹${order.subtotal.toLocaleString()}`, colX.gross, y, {
        width: 60,
        align: 'right',
      })
      .text(`₹${order.discount.toLocaleString()}`, colX.discount, y, {
        width: 60,
        align: 'right',
      })
      .text(`₹${netAmount.toLocaleString()}`, colX.net, y, {
        width: 60,
        align: 'right',
      });

    y += 18;
  });

  // ---------------- SUMMARY ----------------
  doc.moveDown(2);

  doc.font('Helvetica-Bold').fontSize(12).text('Summary', 40);

  doc.moveDown(0.5);

  doc.fontSize(10).font('Helvetica');

  doc.text(`Total Orders: ${orders.length}`, 40);
  doc.text(`Gross Sales: ₹${totalGross.toLocaleString()}`, 40);
  doc.text(`Total Discount: ₹${totalDiscount.toLocaleString()}`, 40);
  doc.text(`Total Returns: ₹${totalReturns.toLocaleString()}`, 40);
  doc.text(
    `Final Net Revenue: ₹${finalNetRevenue.toLocaleString()}`,
    40
  );

  doc.moveDown(1);

  doc
    .fontSize(8)
    .text(
      `Generated on: ${new Date().toLocaleString()}`,
      40,
      800,
      { align: 'center' }
    );

  doc.end();
};

export const exportSalesExcel = asyncHandler(async (req, res) => {
  const { range = 'daily', startDate, endDate } = req.query;

  const { from, to } = getDateRange(range, startDate, endDate);

  const orders = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: from, $lte: to },
        paymentStatus: 'PAID',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        orderId: 1,
        createdAt: 1,
        subtotal: 1,
        discount: 1,
        totalAmount: 1,
        'user.name': 1,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sales Report');

  sheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Order ID', key: 'orderId', width: 15 },
    { header: 'Customer', key: 'customer', width: 20 },
    { header: 'Gross Amount', key: 'subtotal', width: 15 },
    // { header: "Discount", key: "discount", width: 15 },
    { header: 'Net Total', key: 'total', width: 15 },
  ];

  orders.forEach((order) => {
    sheet.addRow({
      date: new Date(order.createdAt).toLocaleDateString(),
      orderId: order.orderId,
      customer: order.user.name,
      subtotal: order.subtotal,
      // discount:order.discount,
      total: order.totalAmount,
    });
  });

  sheet.getRow(1).font = { bold: true };

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});
