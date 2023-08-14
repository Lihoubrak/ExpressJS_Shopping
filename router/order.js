const Cart = require("../model/Cart");
const OrderProduct = require("../model/OrderProduct");
const ProductVariant = require("../model/ProductVariant");
const User = require("../model/User");
const { verifyTokenAndAuthorization } = require("./verifyToken");
const sequelize = require("../model/ConnectDB");
const Product = require("../model/Product");
const Order = require("../model/Order");
const router = require("express").Router();

router.post("/", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const userid = req.user.id;
    const { userInfo } = req.body;
    const cartItems = await Cart.findAll({
      where: { UserId: userid },
    });

    const order = await Order.create({
      UserId: userid,
      email: userInfo.email,
      address: `${userInfo.address} ${userInfo.city} ${userInfo.country}`,
      phone: userInfo.phone,
      payment: "cash on delivery",
      status: "Pending", // Set initial status to Pending
    });

    for (const cartItem of cartItems) {
      await OrderProduct.create({
        OrderId: order.id,
        ProductVariantId: cartItem.ProductVariantId,
        quantity: cartItem.quantity,
      });
    }

    await Cart.destroy({ where: { UserId: userid } });

    return res
      .status(200)
      .json({ message: "Đơn hàng đã được tạo thành công." });
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    return res.status(500).json({ error: "Đã xảy ra lỗi khi tạo đơn hàng." });
  }
});

router.get("/", async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: User,
        },
        {
          model: ProductVariant,
          include: {
            model: Product,
          },
        },
      ],
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/OrderDetail/:OrderId", async (req, res) => {
  try {
    const orderId = req.params.OrderId;
    const orderDetail = await OrderProduct.findAll({
      where: { orderId },
      include: [
        {
          model: ProductVariant,
          include: [
            {
              model: Product,
              attributes: { exclude: ["image"] }, // Exclude the 'image' field
            },
          ],
        },
      ],
    });
    res.json(orderDetail);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});
router.delete("/:orderId", async (req, res) => {
  const { ProductVariantId } = req.body;
  const orderId = req.params.orderId;
  try {
    const order = await Order.findOne({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    await OrderProduct.destroy({
      where: {
        OrderId: orderId,
        ProductVariantId: ProductVariantId,
      },
    });
    const orderIDAll = await OrderProduct.findAll({
      where: { OrderId: orderId },
    });
    if (orderIDAll.length === 0) {
      await order.destroy();
    }
    return res
      .status(200)
      .json({ message: "Order product deleted successfully" });
  } catch (error) {
    console.error("Error deleting order product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:orderId", async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const order = await Order.findOne({ where: { id: orderId } });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const newStatus = req.body.status;
    const oldStatus = order.status;

    if (newStatus !== oldStatus) {
      if (newStatus === "Approved") {
        const orderProducts = await OrderProduct.findAll({
          where: { OrderId: order.id },
        });

        for (const orderProduct of orderProducts) {
          const productVariant = await ProductVariant.findByPk(
            orderProduct.ProductVariantId
          );

          if (productVariant) {
            const updatedQuantity =
              productVariant.quantity - orderProduct.quantity;
            await productVariant.update({ quantity: updatedQuantity });
          }
        }
      } else if (oldStatus === "Approved" && newStatus !== "Approved") {
        const orderProducts = await OrderProduct.findAll({
          where: { OrderId: order.id },
        });

        for (const orderProduct of orderProducts) {
          const productVariant = await ProductVariant.findByPk(
            orderProduct.ProductVariantId
          );

          if (productVariant) {
            const updatedQuantity =
              productVariant.quantity + orderProduct.quantity;
            await productVariant.update({ quantity: updatedQuantity });
          }
        }
      }
    }

    await order.update({ status: newStatus });

    return res
      .status(200)
      .json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/find/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const orders = await sequelize.query(
      `SELECT
        orders.id,
        products.title as product,
        productvariants.id as varianId,
        productvariants.image as img,
        users.username,
        orders.email as customer,
        orderproducts.createdAt as date,
        orders.payment as method,
        orders.status,
        SUM(orderproducts.quantity * products.price) AS amount
      FROM
        orderproducts
        INNER JOIN orders ON orders.id = orderproducts.OrderId
        INNER JOIN productvariants ON orderproducts.ProductVariantId = productvariants.id
        INNER JOIN products ON products.id = productvariants.ProductId
        INNER JOIN users ON users.id = orders.UserId
      WHERE
        users.id = :userId
      GROUP BY
        orders.id,
        products.title,
        productvariants.image,
        users.username,
        orders.email,
        orderproducts.createdAt,
        orders.payment,
        orders.status,
        productvariants.id`,
      {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (orders.length === 0) {
      return res
        .status(404)
        .json({ message: "No orders found for the given user ID" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching orders" });
  }
});

//get All Income
router.get("/income", async (req, res) => {
  const date = new Date();
  const previousMonth = new Date(date.setMonth(date.getMonth() - 2));

  try {
    const orderDetails = await sequelize.query(
      `SELECT
        SUM(orderproducts.quantity * products.price) AS Total,
        MONTH(orderproducts.createdAt) AS name
      FROM
        orderproducts
        INNER JOIN productvariants ON orderproducts.ProductVariantId = productvariants.id
        INNER JOIN products ON productvariants.ProductId = products.id
      WHERE
        orderproducts.createdAt >= :previousMonth
      GROUP BY
        MONTH(orderproducts.createdAt);`,
      {
        replacements: { previousMonth },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.status(200).json(orderDetails);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get All income each User
router.get("/income/:userId", async (req, res) => {
  const date = new Date();
  const previousMonth = new Date(date.setMonth(date.getMonth() - 2));
  const userId = req.params.userId;
  try {
    const OrderUser = await sequelize.query(
      `SELECT
      SUM(orderproducts.quantity * products.price) AS Total,
      MONTH(orderproducts.createdAt) AS name,
      users.username,
      users.email,
      users.avatar
    FROM
      orderproducts
      INNER JOIN productvariants ON orderproducts.ProductVariantId = productvariants.id
      INNER JOIN products ON productvariants.ProductId = products.id
      INNER JOIN orders ON orders.id = orderproducts.OrderId
      INNER JOIN users ON users.id = orders.UserId
    WHERE
      orderproducts.createdAt >= :previousMonth
      AND orders.UserId = :userId
    GROUP BY
      MONTH(orderproducts.createdAt), users.username;
    `,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: { previousMonth, userId },
      }
    );
    res.json(OrderUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
