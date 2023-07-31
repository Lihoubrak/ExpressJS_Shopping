const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.token;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.SCTOKEN, (err, user) => {
      if (err) {
        // Handle invalid token
        res.status(403).json("Token is not valid !");
      } else {
        // Token is valid, access payload data using decodedToken variable
        req.user = user;
        next();
      }
    });
  } else {
    res.status(401).json("Access denied, no token provided!");
  }
};

const verifyTokenAndAuthorization = (req, res, next) => {
  verifyToken(req, res, async () => {
    if (
      (req.user && parseInt(req.user.id) === parseInt(req.params.id)) ||
      req.user.isAdmin
    ) {
      next();
    } else {
      res.status(403).json("You are not allowed to do that!");
    }
  });
};
const verifyTokenAndAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user) {
      if (req.user.isAdmin) {
        next();
      } else {
        res.status(403).json("You are not allowed to do that!");
      }
    } else {
      res.status(401).json("Access denied, no token provided!");
    }
  });
};

module.exports = {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
};
