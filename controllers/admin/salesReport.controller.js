import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import Order from "../../models/order.model.js";
import asyncHandler from "../../utils/asyncHandler.js";
import getDateRange from "../../helpers/reportFilter.js"



export const exportSalesPDF = async (req, res) => {
  const { range = "daily", startDate, endDate } = req.query;
  const { from, to } = getDateRange(range, startDate, endDate);

  const orders = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: from, $lte: to },
        paymentStatus: "PAID",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        orderId: 1,
        createdAt: 1,
        subtotal: 1,
        discount: 1,
        totalAmount: 1,
        "user.name": 1,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  const doc = new PDFDocument({ margin: 40, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=sales-report.pdf"
  );

  doc.pipe(res);

  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("Sales Report", { align: "center" });

  doc
    .moveDown(0.5)
    .fontSize(10)
    .font("Helvetica")
    .text(
      `Period: ${from.toDateString()} - ${to.toDateString()}`,
      { align: "center" }
    );

  doc.moveDown(1.5);

  const tableTop = doc.y;
  const colX = {
    date: 40,
    order: 100,
    customer: 180,
    gross: 300,
    discount: 380,
    net: 460,
  };

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Date", colX.date, tableTop)
    .text("Order ID", colX.order, tableTop)
    .text("Customer", colX.customer, tableTop)
    .text("Gross", colX.gross, tableTop, { width: 60, align: "right" })
    .text("Discount", colX.discount, tableTop, { width: 60, align: "right" })
    .text("Net", colX.net, tableTop, { width: 60, align: "right" });

  doc
    .moveTo(40, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke();

  let y = tableTop + 25;
  let totalGross = 0;
  let totalDiscount = 0;
  let totalNet = 0;

  doc.font("Helvetica").fontSize(9);

  orders.forEach((order, index) => {
    if (y > 750) {
      doc.addPage();
      y = 50;
    }

    totalGross += order.subtotal;
    totalDiscount += order.discount;
    totalNet += order.totalAmount;

    if (index % 2 === 0) {
      doc
        .rect(40, y - 2, 510, 16)
        .fill("#f5f5f5")
        .fillColor("black");
    }

    doc
      .text(new Date(order.createdAt).toLocaleDateString(), colX.date, y)
      .text(order.orderId, colX.order, y)
      .text(order.user.name, colX.customer, y, { width: 110 })
      .text(`₹${order.subtotal.toLocaleString()}`, colX.gross, y, {
        width: 60,
        align: "right",
      })
      .text(`₹${order.discount.toLocaleString()}`, colX.discount, y, {
        width: 60,
        align: "right",
      })
      .text(`₹${order.totalAmount.toLocaleString()}`, colX.net, y, {
        width: 60,
        align: "right",
      });

    y += 18;
  });

  doc.moveDown(2);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Summary", 40);

  doc.moveDown(0.5);

  doc
    .fontSize(10)
    .text(`Total Orders: ${orders.length}`, 40)
    .text(`Gross Sales: ₹${totalGross.toLocaleString()}`, 40)
    .text(`Total Discount: ₹${totalDiscount.toLocaleString()}`, 40)
    .text(`Net Revenue: ₹${totalNet.toLocaleString()}`, 40);

  doc.end();
};




export const exportSalesExcel = asyncHandler(async(req,res)=>{
    const {range ="daily",startDate,endDate }=req.query;

    const {from,to} =getDateRange(range,startDate,endDate);

    const orders = await Order.aggregate([
        {
            $match:{
                createdAt:{$gte:from ,$lte:to},
                paymentStatus :"PAID",
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"user",
                foreignField:"_id",
                as:"user"
            },
            },
            {$unwind:"$user"},
            {
                $project:{
                    orderId:1,
                    createdAt:1,
                    subtotal:1,
                    discount:1,
                    totalAmount:1,
                    "user.name":1
                }
            },
            {$sort:{createdAt:-1}}
    ])

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");

    sheet.columns =[
        { header: "Date", key: "date", width: 15 },
    { header: "Order ID", key: "orderId", width: 15 },
    { header: "Customer", key: "customer", width: 20 },
    { header: "Gross Amount", key: "subtotal", width: 15 },
    // { header: "Discount", key: "discount", width: 15 },
    { header: "Net Total", key: "total", width: 15 },
    ]

    orders.forEach(order=>{
        sheet.addRow({
            date:new Date(order.createdAt).toLocaleDateString(),
            orderId:order.orderId,
            customer:order.user.name,
            subtotal:order.subtotal,
            // discount:order.discount,
            total:order.totalAmount
        })
    })

    sheet.getRow(1).font ={bold:true};

    res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=sales-report.xlsx"
  );
   await workbook.xlsx.write(res);
  res.end();
});
