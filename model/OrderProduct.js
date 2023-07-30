const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectDB");

const OrderProduct = sequelize.define("OrderProduct", {
  quantity: {
    type: DataTypes.INTEGER,
  },
});

module.exports = OrderProduct;
