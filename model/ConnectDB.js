const { DataTypes, Sequelize } = require("sequelize");

// Load environment variables from .env file using dotenv package
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DBNAME,
  process.env.DBUSER,
  process.env.DBPASSWORD,
  {
    host: process.env.DB_HOST, // Use the environment variable for the database host or fallback to "localhost"
    dialect: process.env.DB_TYPE, // Use the environment variable for the database dialect or fallback to "mysql"
  }
);

async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database: ", error);
  }
}

testDatabaseConnection();

module.exports = sequelize;
