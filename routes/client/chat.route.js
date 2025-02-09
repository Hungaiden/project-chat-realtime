const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/chat.controller");

const middleware = require("../../middlewares/client/chat.middleware");

router.get("/:roomChatId",  controller.index);

module.exports = router;