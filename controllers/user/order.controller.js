import asyncHandler from "../../utils/asyncHandler.js";
import PDFDocument from "pdfkit"
import Order from "../../models/order.model.js";
import Variant from "../../models/variant.model.js"

export const getOrders = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  const {search} =req.query;

  let filter={user:userId};

  if(search&&search.trim()!==""){
    filter.orderId ={
      $regex:search.trim(),
      $options:"i"
    }
  }
  const orders = await Order.find(filter)
    .populate("items.product", "name")
    .populate("items.variant", "color images")
    .sort({createdAt:-1});

  res.render("user/orders", { orders ,searchQuery:search||""})
})


export const getOrdersSucces = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  const { orderId } = req.params;

  const order = await Order.findOne({
    _id: orderId,
    user: userId
  })
    .populate({
      path: "items.product",
      select: "name  isActive"
    })
    .populate({
      path: "items.variant",
      select: "color images"
    })
    .sort({ createdAt: -1 });

  if (!order) {
    return res.redirect("/cart")
  }
  res.render("user/order-success", { order })
})

export const getOrderDetailsPage = asyncHandler(async (req, res) => {

  const { orderId } = req.params;
  const userId = req.session.user.id;

  const order = await Order.findOne({
    _id: orderId,
    user: userId
  })
    .populate("items.product")
    .populate("items.variant");

  if (!order) {
    return res.redirect("/cart")
  }
  res.render("user/orderDetails", { order });
})


export const cancelOrderItem = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.session.user.id;
  const { itemId } = req.body;

  const order = await Order.findOne({ _id: orderId, user: userId });

  const item = order.items.id(itemId);

  if (!item || item.itemStatus !== "ACTIVE") {
    return res.status(400).json({
      success: false,
      message: "Invalid item"
    })
  }
  item.itemStatus = "CANCELLED";

  await Variant.findByIdAndUpdate(item.variant, {
    $inc: { stock: item.quantity }
  })

  const allCancelled = order.items.every(i => i.itemStatus === "CANCELLED");

  if (allCancelled) {
    order.orderStatus = "CANCELLED"
  }

  await order.save()

  res.json({
    success: true,
    message: "Order cancelled successfully"
  })

})

export const cancellFullOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const userId = req.session.user.id;

  const order = await Order.findOne({ _id: orderId, user: userId });

  for (const item of order.items) {
    if (item.itemStatus === "ACTIVE") {
      item.itemStatus = "CANCELLED";

      await Variant.findByIdAndUpdate(item.variant, {
        $inc: { stock: item.quantity }
      })
    }
  }

  order.orderStatus = "CANCELLED";

  await order.save();

  res.json({ success: true })


})

export const returnRequest = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { itemId, reason } = req.body;
  const userId = req.session.user.id;

  if (!reason || reason.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: "Reason is required"
    })
  }

  const order = await Order.findOne({ _id: orderId, user: userId });

  if (!order) {
    return res.status(400).json({
      success: false,
      message: "Order not found"
    })
  }
  if (order.orderStatus !== "DELIVERED") {
    return res.status(400).json({
      success: false,
      message: "Return allowed only after delivery"
    })
  }

  const now = Date.now();

  if (itemId) {
    const item = order.items.id(itemId);


    if (!item) {
      return res.status(400).json({
        success: false,
        message: "Invalid order item"
      })
    }
    if (item.itemStatus !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Item is already cancelled or returned"
      })
    }

    item.itemStatus = "RETURN_REQUESTED";
    item.returnReason = reason;
    item.returnRequestedAt = now;
  } else {

    const activeItems = order.items.filter(
      item => item.itemStatus === "ACTIVE"
    )
    if (activeItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items eligible for return"
      })
    }

    order.items.forEach(item => {
      if (item.itemStatus === "ACTIVE") {
        item.itemStatus = "RETURN_REQUESTED";
        item.returnReason = reason;
        item.returnRequestedAt = now;
      }
    })
  }
  if (order.items.every(item => item.itemStatus === "RETURN_REQUESTED")) {
    order.orderStatus = "RETURN_REQUESTED";
    order.returnRequestedAt = now;
  }



  await order.save()

  res.json({
    success: true,
    message: itemId ? "Return requested for selectedItem" : "Return requested for entire order"
  })
})

export const downloadInvoice = async (req, res) => {
  const safe = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;

  const { orderId } = req.params;
  const userId = req.session.user.id;

  const order = await Order.findOne({ _id: orderId, user: userId })
    .populate("items.product");

  if (!order) return res.redirect("/orders");

  const doc = new PDFDocument({ size: "A4", margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${order._id}.pdf`);

  doc.pipe(res);

  // LAYOUT CONSTANTS

  const left = 50;
  const right = 545;
  let y = 50;

  // HEADER

  doc.font("Helvetica-Bold").fontSize(24).text("LUXE TIME", left, y);

  doc.font("Helvetica").fontSize(10).fillColor("#555")
    .text("Premium Watch Store", left, y + 28);

  doc.font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#000")
    .text("INVOICE", right - 120, y + 5);

  y += 80;



  doc.font("Helvetica")
    .fontSize(10)
    .fillColor("#333");

  doc.text(`Invoice No:`, left, y);
  doc.text(order._id.toString(), left + 90, y);

  doc.text(`Invoice Date:`, left, y + 15);
  doc.text(
    new Date(order.createdAt).toLocaleDateString("en-IN"),
    left + 90,
    y + 15
  );

  doc.text(`Payment Method:`, left, y + 30);
  doc.text(order.paymentMethod, left + 90, y + 30);

  y += 70;


  const a = order.shippingAddress || {};

  doc.font("Helvetica-Bold")
    .fontSize(11)
    .text("BILL TO", left, y);

  y += 16;

  doc.font("Helvetica")
    .fontSize(10)
    .text(a.fullName || "-", left, y)
    .text(a.streetAddress || "-", left, y + 14)
    .text(`${a.city || "-"}, ${a.state || "-"} - ${a.pincode || "-"}`, left, y + 28)
    .text(`Phone: ${a.phone || "-"}`, left, y + 42);

  y += 85;


  doc.moveTo(left, y).lineTo(right, y).stroke();
  y += 12;

  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("Product", left, y);
  doc.text("Qty", 300, y, { width: 40, align: "right" });
  doc.text("Unit Price", 360, y, { width: 80, align: "right" });
  doc.text("Amount", 460, y, { width: 80, align: "right" });

  y += 14;
  doc.moveTo(left, y).lineTo(right, y).stroke();
  y += 10;


  doc.font("Helvetica").fontSize(10);

  order.items.forEach(item => {
    const qty = safe(item.quantity);
    const price = safe(item.price);
    const total = qty * price;

    doc.text(item.product?.name || "-", left, y, { width: 230 });
    doc.text(qty.toString(), 300, y, { width: 40, align: "right" });
    doc.text(`₹${price}`, 360, y, { width: 80, align: "right" });
    doc.text(`₹${total}`, 460, y, { width: 80, align: "right" });

    y += 22;
  });

  y += 10;
  doc.moveTo(left, y).lineTo(right, y).stroke();
  y += 20;

  const subtotal = safe(order.subtotal);
  const discount = safe(order.discount);
  const tax = safe(order.tax);
  const totalAmount = safe(order.totalAmount);

  doc.fontSize(10);

  doc.text("Subtotal", 360, y);
  doc.text(`₹${subtotal}`, 460, y, { width: 80, align: "right" });

  y += 14;
  doc.text("Discount", 360, y);
  doc.text(`- ₹${discount}`, 460, y, { width: 80, align: "right" });

  y += 14;
  doc.text("Tax", 360, y);
  doc.text(`₹${tax}`, 460, y, { width: 80, align: "right" });

  y += 18;
  doc.moveTo(360, y).lineTo(right, y).stroke();
  y += 10;

  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("Total", 360, y);
  doc.text(`₹${totalAmount}`, 460, y, { width: 80, align: "right" });

  y += 50;


  doc.font("Helvetica")
    .fontSize(9)
    .fillColor("#666")
    .text(
      "Thank you for shopping with LUXE TIME.\nThis is a computer-generated invoice and does not require a signature.",
      left,
      y,
      { width: right - left, align: "center" }
    );

  doc.end();
};


// orderController.js

export const getPaymentFailurePage =asyncHandler(async (req, res) => {
        const {orderId} =req.params ;
        
        const order = await Order.findById(orderId);

        if (!order) {
            return res.redirect('/cart'); 
        }

        res.render('user/order-failure', {
            title: 'Payment Failed | Luxe Time',
            order: order,
            user: req.session.user
        });
});


