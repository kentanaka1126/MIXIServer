const express = require("express");
const { makePayment } = require("../Controllers/Payment");

const router = express.Router();

router.post("/pay", makePayment);

module.exports = router;