const express = require("express");
const { update, get } = require("../Controllers/User");

const router = express.Router();

router.post("/update", update);
router.post("/get", get);

module.exports = router;
