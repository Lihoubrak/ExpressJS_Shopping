require("dotenv").config();
const express = require("express");
const Order = require("../model/Order");
const Cart = require("../model/Cart");
const OrderProduct = require("../model/OrderProduct");
const { verifyToken } = require("./verifyToken");
const router = express.Router();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPESECRETKEY);

// Handle POST request for creating a checkout session
// router.post("/checkout", async (req, res) => {
//   const line_items = req.body.cartItem.map((item) => {
//     return {
//       price_data: {
//         currency: "usd",
//         product_data: {
//           name: item.title,
//           images: [item.image],
//         },
//         unit_amount: item.price * 100,
//       },
//       quantity: item.quantity,
//     };
//   });

//   const userId = req.body.cartItem[0].userId;

//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ["card"],
//     shipping_address_collection: {
//       allowed_countries: ["VN"],
//     },
//     phone_number_collection: {
//       enabled: true,
//     },
//     metadata: { UserID: userId },
//     line_items,
//     mode: "payment",
//     success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `http://localhost:5173/cart`,
//   });

//   // res.redirect(303, session.url);
//   res.send({ url: session.url });
// });

// // Stripe webhoook

// router.post("/webhook", async (req, res) => {
//   let data;
//   let eventType;

//   // Check if webhook signing is configured.
//   let webhookSecret;
//   //webhookSecret = process.env.STRIPE_WEB_HOOK;

//   if (webhookSecret) {
//     // Retrieve the event by verifying the signature using the raw body and secret.
//     let event;
//     let signature = req.headers["stripe-signature"];

//     try {
//       event = stripe.webhooks.constructEvent(
//         req.body,
//         signature,
//         webhookSecret
//       );
//     } catch (err) {
//       console.log(`⚠️  Webhook signature verification failed:  ${err}`);
//       return res.sendStatus(400);
//     }
//     // Extract the object from the event.
//     data = event.data.object;
//     eventType = event.type;
//   } else {
//     // Webhook signing is recommended, but if the secret is not configured in `config.js`,
//     // retrieve the event data directly from the request body.
//     data = req.body.data.object;
//     eventType = req.body.type;
//   }

//   // Handle the checkout.session.completed event
//   if (eventType === "checkout.session.completed") {
//     try {
//       // Lấy thông tin về các mục trong giỏ hàng từ bảng "Cart" dựa trên userId
//       const cartItems = await Cart.findAll({
//         where: { userId: data.metadata.UserID },
//       });
//       // Tạo đơn hàng và các mục đơn hàng tương ứng trong bảng "Order" và "OrderItem"
//       const order = await Order.create({
//         UserId: data.metadata.UserID,
//         status: data.status,
//         email: data.customer_details.email,
//         address: `${data.shipping_details.address.line1} ${data.shipping_details.address.line2} ${data.shipping_details.address.state} ${data.shipping_details.address.city} ${data.shipping_details.address.country} ${data.shipping_details.address.postal_code}`,
//         phone: data.customer_details.phone,
//         payment: data.payment_method_types[0],
//       });

//       for (const cartItem of cartItems) {
//         await OrderProduct.create({
//           OrderId: order.id,
//           ProductVariantId: cartItem.ProductVariantId,
//           quantity: cartItem.quantity,
//         });
//       }
//       // Xóa các mục trong giỏ hàng sau khi tạo đơn hàng thành công (tuỳ chọn)
//       await Cart.destroy({ where: { userId: data.metadata.UserID } });
//       return res
//         .status(201)
//         .json({ message: "Đơn hàng đã được tạo thành công." });
//     } catch (error) {
//       console.error("Lỗi khi tạo đơn hàng:", error);
//       return res.status(500).json({ error: "Đã xảy ra lỗi khi tạo đơn hàng." });
//     }
//   }
//   res.status(200).end();
// });
router.post("/payments", verifyToken, async (req, res) => {
  const userid = req.user.id;
  const { paymentMethodId, userInfo, product } = req.body;
  // Calculate total price from product
  const totalPrice = product.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  try {
    // Create a PaymentIntent with the Stripe payment method
    const paymentIntent = await stripe.paymentIntents.create({
      payment_method: paymentMethodId,
      amount: totalPrice * 100,
      currency: "usd",
      description: "Example payment",
      // confirm: true,
    });

    // Save order details to the database
    const order = await Order.create({
      UserId: userid, // Assuming you have a userId in the userInfo object
      status: "Pending", // You can set the initial status here
      email: userInfo.email,
      address: `${userInfo.address} ${userInfo.city} ${userInfo.country}`,
      phone: userInfo.phone,
      payment: "Cash on Card", // Or whatever payment method you want to use
    });

    for (const cartItem of product) {
      await OrderProduct.create({
        OrderId: order.id,
        ProductVariantId: cartItem.productVariantId,
        quantity: cartItem.quantity,
      });
    }
    await Cart.destroy({ where: { userId: userid } });
    // Return the client secret of the payment intent to the frontend
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ error: "Error processing payment" });
  }
});
module.exports = router;
