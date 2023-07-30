const categoryIndex = require("../constant/categoryIndex");
const upload = require("../middleware/uploadImage");
const Product = require("../model/Product");
const ProductVariant = require("../model/ProductVariant");
const router = require("express").Router();

//Create Product
router.post(
  "/",
  upload.fields([{ name: "images", maxCount: 10 }]),
  async (req, res) => {
    try {
      const productData = JSON.parse(req.body.product);
      const variantData = JSON.parse(req.body.variants);
      const images = req.files["images"]; // Array of image files
      const localhost = "http://localhost:3000/";
      const newProduct = await Product.create({
        title: productData.title,
        desc: productData.desc,
        price: productData.price,
        category: productData.category,
        image: localhost + images[0].filename, // Assuming you want to save the first image of the product as the main image
      });

      for (let i = 0; i < variantData.length; i++) {
        await ProductVariant.create({
          size: variantData[i].size,
          color: variantData[i].color,
          quantity: variantData[i].stock,
          image: localhost + images[i].filename,
          ProductId: newProduct.id,
        });
      }

      res.status(200).json("Form data received successfully");
    } catch (error) {
      res.status(300).json(error);
    }
  }
);

//get Product by Category
router.get("/category/:categoryId", async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    let products;
    if (req.query.size || req.query.color) {
      products = await ProductVariant.findAll({
        where: {
          size: req.query.size,
          color: req.query.color,
        },
        include: {
          model: Product,
          where: { category: categoryId },
          attributes: ["category"],
        },
      });
    } else {
      products = await Product.findAll({
        where: { category: categoryId },
      });
    }
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//get one Product
router.get("/find/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;
    // const { ProductVariantId } = req.body;
    const product = await Product.findOne({
      where: { id: productId },
      include: [
        {
          model: ProductVariant,
          attributes: ["id", "size", "color", "quantity", "image"],
          // where: { id: ProductVariantId },
        },
      ],
    });

    res.status(200).json(product);
  } catch (error) {
    res.status(300).json({ message: error });
  }
});

router.put("/:productId", upload.single("image"), async (req, res) => {
  try {
    const productId = req.params.productId;
    const products = JSON.parse(req.body.ProductVariants);
    const localhost = "http://localhost:3000/";

    // Check which fields are present in the request
    const updatedFields = {};
    if (products.title) {
      updatedFields.title = products.title;
    }
    if (products.desc) {
      updatedFields.desc = products.desc;
    }
    if (products.price) {
      updatedFields.price = products.price;
    }
    if (products.category) {
      updatedFields.category = products.category;
    }
    if (req.file) {
      updatedFields.image = localhost + req.file.filename;
    }

    // Update the product based on productId with the provided fields
    await Product.update(updatedFields, { where: { id: productId } });

    // Update the product variant based on ProductId and variant id
    const variantFieldsToUpdate = {};
    if (products.size) {
      variantFieldsToUpdate.size = products.size;
    }
    if (products.color) {
      variantFieldsToUpdate.color = products.color;
    }
    if (products.quantity) {
      variantFieldsToUpdate.quantity = products.quantity;
    }
    if (req.file) {
      variantFieldsToUpdate.image = localhost + req.file.filename;
    }

    await ProductVariant.update(variantFieldsToUpdate, {
      where: { ProductId: productId, id: products.id },
    });

    return res.status(200).json("Update Successfully !!!");
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
});

router.delete("/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;
    const deleteProduct = await Product.destroy({ where: { id: productId } });
    if (deleteProduct === 0) {
      return res.status(301).json("Delete Unsuccessfully !!!");
    } else {
      res.status(200).json("Delete Successfully !!!");
    }
  } catch (error) {
    res.status(300).json({ message: error });
  }
});

router.get("/", async (req, res) => {
  try {
    const qNew = req.query.product;
    const qCategory = req.query.category;
    let allProduct;
    if (qNew) {
      allProduct = await Product.findAll({
        order: [["price", "DESC"]],
        limit: 8,
      });
    } else if (qCategory) {
      allProduct = await Product.findAll({
        where: { category: qCategory },
        order: [["price", "DESC"]],
        limit: 8,
      });
    } else {
      allProduct = await Product.findAll({
        include: {
          model: ProductVariant,
          attributes: ["image", "size", "color", "quantity"],
        },
      });
    }
    res.status(200).json(allProduct);
  } catch (error) {
    res.status(300).json({ message: error });
  }
});
module.exports = router;
