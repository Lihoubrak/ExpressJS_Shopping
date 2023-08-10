const Cart = require("../model/Cart");
const Product = require("../model/Product");
const ProductVariant = require("../model/ProductVariant");
const User = require("../model/User");
const { verifyTokenAndAuthorization } = require("./verifyTokenAndAuthorization");
const router = require("express").Router();
router.post("/:productId", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user.id;
    const { quantity, size, color } = req.body;

    const productVariant = await ProductVariant.findOne({
      where: {
        ProductId: productId,
        size,
        color,
      },
    });

    if (!productVariant) {
      return res.status(404).json({ error: "Product Not Found" });
    }
    if (quantity > productVariant.quantity) {
      return res.status(400).json({
        message: "Not enough product to add to cart",
      });
    }
    let cart = await Cart.findOne({
      where: {
        ProductVariantId: productVariant.id,
        UserId: userId,
      },
    });

    if (cart) {
      if (
        quantity > productVariant.quantity ||
        cart.quantity + quantity > productVariant.quantity
      ) {
        return res.status(400).json({
          message: "Not enough product to add to cart",
        });
      }
      await cart.update({ quantity: cart.quantity + quantity });
    } else {
      cart = await Cart.create({
        quantity,
        UserId: userId,
        ProductVariantId: productVariant.id,
      });
    }

    res.status(200).json({
      message: "Successfully added item to cart",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/find", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const userId = req.user.id;
    const carts = await Cart.findAll({
      where: { UserId: userId },
      include: [
        { model: ProductVariant, include: { model: Product } },
        { model: User },
      ],
    });
    const cartData = carts.map((cart) => {
      return {
        quantity: cart.quantity,
        userId: cart.UserId,
        id: cart.ProductVariant.ProductId,
        title: cart.ProductVariant.Product.title,
        price: cart.ProductVariant.Product.price,
        size: cart.ProductVariant.size,
        color: cart.ProductVariant.color,
        image: cart.ProductVariant.image,
        productVariantId: cart.ProductVariantId,
        email: cart.User.email,
        username: cart.User.username,
        stockQuantity: cart.ProductVariant.quantity,
      };
    });
    res.status(200).json(cartData);
  } catch (error) {
    res.status(300).json({ message: error.message });
  }
});

router.put(
  "/:productVariantId",
  verifyTokenAndAuthorization,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const productVariantId = req.params.productVariantId; // Get the product variant ID from the request parameters
      const cartItem = await Cart.findOne({
        where: { ProductVariantId: productVariantId, UserId: userId },
      }); // Find the cart item by the product variant ID

      if (cartItem) {
        // If the cart item exists, update it
        const updatedCartItem = await cartItem.update({
          quantity: req.body.quantity,
        }); // Update the cart item quantity based on the request body

        res.status(200).json("Update Successfully"); // Send a success response with the updated cart item
      } else {
        // If the cart item does not exist, send an error response
        res.status(404).json({ message: "Cart item not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message }); // Handle any errors
    }
  }
);
router.delete(
  "/:productVariantId",
  verifyTokenAndAuthorization,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const productVariantId = req.params.productVariantId; // Get the product variant ID from the request parameters
      const cartItem = await Cart.findOne({
        where: { ProductVariantId: productVariantId, UserId: userId },
      }); // Find the cart item by the product variant ID

      if (cartItem) {
        // If the cart item exists, update it
        const updatedCartItem = await cartItem.destroy(); // Update the cart item quantity based on the request body
        res.status(200).json("Delete Successfully"); // Send a success response with the updated cart item
      } else {
        // If the cart item does not exist, send an error response
        res.status(404).json({ message: "Cart item not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message }); // Handle any errors
    }
  }
);

module.exports = router;
