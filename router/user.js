const User = require("../model/User");
const router = require("express").Router();
const CryptoJS = require("crypto-js");

//Update user
router.put("/:userId", async (req, res) => {
  if (req.body.password) {
    req.body.password = CryptoJS.AES.encrypt(
      req.body.password,
      process.env.PASS_SEC
    ).toString();
  }
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      res.status(401).json("User not found");
    }

    const userUpdate = await user.update(req.body);
    const { password, ...other } = userUpdate.toJSON();
    res.status(200).json(other);
  } catch (error) {
    res.status(500).json(error);
  }
});

//Delete user
router.delete("/:userId", async (req, res) => {
  try {
    const rowsDeleted = await User.destroy({
      where: {
        id: req.params.userId,
      },
    });

    if (rowsDeleted === 0) {
      return res.status(404).json("User not found");
    }
    res.status(200).json("User has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET a single account by ID
router.get("/find/:userId", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...other } = user.toJSON();
    res.status(200).json(other);
  } catch (error) {
    res.status(500).json(error);
  }
});
//Get All User
router.get("/", async (req, res) => {
  const query = req.query.new;
  try {
    const user = query
      ? await User.findAll({
          order: [["id", "DESC"]],
          limit: 5,
        })
      : await User.findAll();
    const other = user.map((user) => {
      const { password, ...otherProps } = user.toJSON();
      return otherProps;
    });
    res.status(200).json(other);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
