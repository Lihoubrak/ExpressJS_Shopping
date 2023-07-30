const { DataTypes, Sequelize } = require("sequelize");
const sequelize = new Sequelize("project_2", "root", "root12345", {
  host: "localhost",
  dialect: "mysql",
});
sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database: ", error);
  });

module.exports = sequelize;
