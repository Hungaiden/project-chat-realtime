const homeRoute = require("./home.route");
const chatRoute = require("./chat.route");
const userRoute = require("./user.route");

const userMiddleware = require("../../middlewares/client/user.middleware");

module.exports = (app) => {
  app.use(userMiddleware.infoUser);

  app.use("/", homeRoute);

  // app.use(userMiddleware.requireAuth);

  app.use(
    "/chat",
    userMiddleware.requireAuth,
    chatRoute);

  app.use("/user", userRoute); 
}