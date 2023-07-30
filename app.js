const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const sequelize = require("./model/ConnectDB");
const Relationship = require("./model/Relationship");
const authRouter = require("./router/auth");
const userRouter = require("./router/user");
const cartRouter = require("./router/cart");
const productRouter = require("./router/product");
const orderRouter = require("./router/order");
const stripeRouter = require("./router/stripe");
const path = require("path");
dotenv.config();
Relationship();
sequelize
  .sync()
  .then(() => {
    console.log("You was table created!");
  })
  .catch((err) => {
    console.error("Unable to create  table:", err);
  });

app.use(express.static(path.join(__dirname, "public/image")));
app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(express.json({ type: "application/json" }));
app.use("/api/products", productRouter);
app.use("/api/users", userRouter);
app.use("/api/auths", authRouter);
app.use("/api/carts", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/stripe", stripeRouter);
app.listen(process.env.PROT || 3000, () => {
  console.log("Server running on port 3001");
});
