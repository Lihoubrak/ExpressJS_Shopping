const sequelize = require("./ConnectDB");
const { DataTypes } = require("sequelize");
const Cart = sequelize.define("Cart", {
  quantity: {
    type: DataTypes.INTEGER,
  },
});

module.exports = Cart;
