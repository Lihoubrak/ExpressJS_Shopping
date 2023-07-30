const router = require("express").Router();
const User = require("../model/User");
const CryptoJS = require("crypto-js");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
//REGISTER
router.post("/register", async (req, res) => {
  const { username, email, password, avatar } = req.body;
  try {
    // Check if user with the same email or username already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email: email }, { username: username }],
      },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with that email or username already exists" });
    }
    // Create a new user with hashed password
    const hashedPassword = CryptoJS.AES.encrypt(
      password,
      process.env.PW_RS
    ).toString();
    const newUser = await User.create({
      username,
      avatar,
      email,
      password: hashedPassword,
    });
    const userWithoutPassword = newUser.toJSON();
    delete userWithoutPassword.password;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    return res.status(500).json(error);
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ where: { username: req.body.username } });
    if (!user) {
      return res.status(401).json("Wrong username");
    }
    const hashedPassword = CryptoJS.AES.decrypt(
      user.password,
      process.env.PW_RS
    );
    const originalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);
    if (originalPassword !== req.body.password) {
      return res.status(401).json("Wrong password");
    }
    //jwt
    const token = jwt.sign(
      {
        id: user.id,
        isAdmin: user.isAdmin,
        username: user.username,
      },
      process.env.SC_TOKEN,
      { expiresIn: "3d" }
    );
    const { password, ...other } = user.toJSON();
    return res.status(200).json({ ...other, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json("Internal server error");
  }
});
module.exports = router;
