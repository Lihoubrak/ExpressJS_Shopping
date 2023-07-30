const Product = require("./Product");
const Cart = require("./Cart");
const ProductVariant = require("./ProductVariant");
const User = require("./User");
const Order = require("./Order");
const OrderProduct = require("./OrderProduct");


const Relationship = () => {
  Product.hasMany(ProductVariant);
  ProductVariant.belongsTo(Product);
  User.belongsToMany(ProductVariant, { through: Cart });
  ProductVariant.belongsToMany(User, { through: Cart });
  ProductVariant.hasMany(Cart);
  Cart.belongsTo(ProductVariant);
  User.hasMany(Cart);
  Cart.belongsTo(User);
  User.hasMany(Order);
  Order.belongsTo(User);
  Order.belongsToMany(ProductVariant, { through: OrderProduct });
  ProductVariant.belongsToMany(Order, { through: OrderProduct });
  ProductVariant.hasMany(OrderProduct);
  OrderProduct.belongsTo(ProductVariant);
};

module.exports = Relationship;
