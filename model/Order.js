const sequelize = require("./ConnectDB");
const { DataTypes } = require("sequelize");
const Order = sequelize.define("Order", {
  email: {
    type: DataTypes.STRING,
    require: true,
  },
  address: {
    type: DataTypes.STRING,
    require: true,
  },
  phone: {
    type: DataTypes.STRING,
    require: true,
  },
  payment: {
    type: DataTypes.STRING,
    require: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "Pending",
  },
});

module.exports = Order;
