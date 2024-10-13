const express = require("express");
const {
  register,
  login,
  forgot,
  reset,
  googleLogin,
  googleRegister,
} = require("../Controllers/Auth");
const { checkUser } = require("../Middlewares/Auth");

const router = express.Router();

router.post("/", checkUser);
router.post("/register", register);
router.post("/login", login);
router.post("/forgot", forgot);
router.post("/googleLogin", googleLogin);
router.post("/googleRegister", googleRegister);
router.post("/reset/:token", reset);

module.exports = router;
