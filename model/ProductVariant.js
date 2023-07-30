const { DataTypes } = require("sequelize");
const sequelize = require("./ConnectDB");

const ProductVariant = sequelize.define("ProductVariant", {
  size: {
    type : DataTypes.STRING
  },
  color: {
    type : DataTypes.STRING
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity : {
    type : DataTypes.INTEGER
  }
});

module.exports = ProductVariant;
