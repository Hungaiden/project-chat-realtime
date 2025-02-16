const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/user.controller");
const userMiddleware = require("../../middlewares/client/user.middleware");

const multer  = require('multer');
const upload = multer();

const uploadCloud = require("../../middlewares/client/uploadCloud.middleware");
router.get("/register", controller.register);

router.post("/register", controller.registerPost);

router.get("/logout", controller.logout);

router.get("/login", controller.login);

router.post("/login", controller.loginPost);

router.get(
    "/not-friend",
    userMiddleware.requireAuth,
    controller.notFriend
)

router.get(
    "/request",
    userMiddleware.requireAuth,
    controller.request
);

router.get(
    "/accept",
    userMiddleware.requireAuth,
    controller.accept
);

router.get(
    "/friends",
    userMiddleware.requireAuth,
    controller.friends
);

router.get(
    "/rooms/create",
    userMiddleware.requireAuth,
    controller.createRoom
);

router.get(
    "/rooms",
    userMiddleware.requireAuth,
    controller.rooms
);

router.post(
    "/rooms/create",
    userMiddleware.requireAuth,
    controller.createPostRoom
);

router.get(
    "/profile", 
    userMiddleware.requireAuth,
    controller.profile
);

router.get(
    "/profile/edit", 
    userMiddleware.requireAuth,
    controller.editProfile
);

router.patch(
    "/profile/edit", 
    userMiddleware.requireAuth,
    upload.single('avatar'),
    uploadCloud.uploadSingle,
    controller.editProfilePatch
);
module.exports = router;