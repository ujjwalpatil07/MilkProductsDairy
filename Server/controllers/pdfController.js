import PDFDocument from "pdfkit";
import Order from "../models/OrderSchema.js";

export const generateOrderBillPDF = async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId)
    .populate({
      path: "address",
      select: "name phone addressType streetAddress city state pincode",
    })
    .populate({
      path: "productsData.productId",
      select: "name",
    });

  if (!order) return res.status(404).json({ message: "Order not found" });

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Order_${orderId}_Receipt.pdf`
  );

  doc.pipe(res);

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#333333")
    .text("Madhur Dairy & Daily Needs", { align: "center" })
    .moveDown(0.3);

  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("gray")
    .text("Shed no. A-31, Datri Mala, Ambad,", { align: "center" })
    .text("MIDC Ambad, Nashik, Maharashtra 422010", { align: "center" })
    .text("+91 92091 43657 | contact@madhurdairy.com", { align: "center" })
    .moveDown(1);

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("black")
    .text("Order Details", { underline: true })
    .moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(12)
    .text(`Order ID: ${order._id}`)
    .text(`Status: ${order.status}`)
    .text(`Payment Mode: ${order.paymentMode}`);

  if (order.paymentMode === "Online" && order.razorpay?.paymentId) {
    doc
      .fontSize(11)
      .fillColor("gray")
      .text(`Razorpay Payment ID: ${order.razorpay.paymentId}`)
      .text(`Razorpay Order ID: ${order.razorpay.orderId}`);
  }

  doc
    .fillColor("black")
    .fontSize(12)
    .text(`Date: ${new Date(order.createdAt).toLocaleString()}`)
    .moveDown(1);

  const addr = order.address;

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("Delivery Address", { underline: true })
    .moveDown(0.3);

  doc
    .font("Helvetica")
    .fontSize(12)
    .text(`${addr.name} (${addr.addressType})`)
    .text(`Phone: ${addr.phone}`)
    .text(`${addr.streetAddress}, ${addr.city}, ${addr.state} - ${addr.pincode}`)
    .moveDown(1);

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("Ordered Items", { underline: true })
    .moveDown(0.5);

  const tableTop = doc.y;
  const itemX = 50;
  const qtyX = 270;
  const priceX = 340;
  const subtotalX = 440;

  doc
    .fontSize(12)
    .text("Product", itemX, tableTop)
    .text("Qty", qtyX, tableTop, { width: 40, align: "right" })
    .text("Price", priceX, tableTop, { width: 60, align: "right" })
    .text("Subtotal", subtotalX, tableTop, { width: 80, align: "right" });

  doc
    .moveTo(itemX, doc.y + 2)
    .lineTo(550, doc.y + 2)
    .stroke();

  let y = doc.y + 6;
  let grandTotal = 0;

  order.productsData.forEach((item) => {
    const p = item.productId;
    const quantity = item.productQuantity;
    const price = item.productPrice;
    const subtotal = price * quantity;
    grandTotal += subtotal;

    doc
      .font("Helvetica")
      .fontSize(11)
      .text(p.name, itemX, y)
      .text(quantity.toString(), qtyX, y, { width: 40, align: "right" })
      .text(`₹${price.toFixed(2)}`, priceX, y, { width: 60, align: "right" })
      .text(`₹${subtotal.toFixed(2)}`, subtotalX, y, { width: 80, align: "right" });

    y += 20;
  });

  doc
    .moveTo(itemX, y)
    .lineTo(550, y)
    .stroke();

  y += 5;
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(`Total Amount: ₹${grandTotal.toFixed(2)}`, subtotalX, y, {
      width: 80,
      align: "right",
    });

  doc
    .moveDown(3)
    .font("Helvetica-Oblique")
    .fontSize(10)
    .fillColor("gray")
    .text("Thank you for shopping with Madhur Dairy & Daily Needs.", {
      align: "center",
    })
    .text("We look forward to serving you again!", { align: "center" });

  doc.end();
};
