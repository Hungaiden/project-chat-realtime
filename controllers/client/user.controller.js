const User = require("../../models/user.model");
const md5 = require("md5");
const generateHelper = require("../../helpers/generate.helper");

const userSocket = require("../../socket/client/user.socket");
module.exports.register = async (req, res) => {
  res.render("client/pages/user/register", {
    pageTitle: "Đăng ký tài khoản",
  });
};

module.exports.registerPost = async (req, res) => {
  const user = req.body;
  console.log(user);

  const existUser = await User.findOne({
    email: user.email,
    deleted: false
  });

  if(existUser) {
    req.flash("error", "Email đã tồn tại trong hệ thống!");
    res.redirect("back");
    return;
  }
  
  const dataUser = {
    fullName: user.fullName,
    email: user.email,
    password: md5(user.password),
    token: generateHelper.generateRandomString(30),
    status: "active"
  };
  
  const newUser = new User(dataUser);
  await newUser.save();
  res.cookie("tokenUser", newUser.token);
  req.flash("success", "Đăng ký tài khoản thành công!");
  res.redirect("/chat");
};

module.exports.login = async (req, res) => {
  res.render("client/pages/user/login", {
    pageTitle: "Đăng nhập tài khoản",
  });
};
module.exports.loginPost = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const existUser = await User.findOne({
    email: email,
    deleted: false
  });
  if(!existUser) {
    req.flash("error", "Email không tồn tại trong hệ thống!");
    res.redirect("back");
    return;
  }

  if(md5(password) != existUser.password) {
    req.flash("error", "Sai mật khẩu!");
    res.redirect("back");
    return;
  }

  if(existUser.status != "active") {
    req.flash("error", "Tài khoản đang bị khóa!");
    res.redirect("back");
    return;
  }

  res.cookie("tokenUser", existUser.token);

  await User.updateOne({
    email:email 
  }, {
    statusOnline:"online"
  });

  _io.once("connection", (socket) => {
    _io.emit("SERVER_RETURN_STATUS_ONLINE_USER", {
      userId: existUser.id,
      statusOnline: "online"
    })
  });

  req.flash("success", "Đăng nhập thành công!");

  res.redirect("/chat");
};

module.exports.logout = async (req, res) => {
  await User.updateOne({
    token: req.cookies.tokenUser
  }, {
    statusOnline:"offline"
  });

  _io.once("connection", (socket) => {
    _io.emit("SERVER_RETURN_STATUS_ONLINE_USER", {
      userId: res.locals.user.id,
      statusOnline: "offline"
    })
  })
  res.clearCookie("tokenUser");
  req.flash("success", "Đã đăng xuất!");

  res.redirect("/chat");
};

module.exports.notFriend = async (req, res) => {
  const userIdA = res.locals.user.id;
  
  userSocket(req, res);
  
  const friendsList = res.locals.user.friendsList;
  const friendsListId = friendsList.map(item => item.userId);

  const users = await User.find({
    $and:[
      {_id: { $ne: userIdA }},
      {_id: { $nin : res.locals.user.requestFriends}},// $nin: not in
      {_id : { $nin : res.locals.user.acceptFriends }},
      { _id: { $nin: friendsListId }}
    ],
    deleted: false,
    status:"active"
  }).select("id, fullName avatar");

  
  res.render("client/pages/user/not-friend", {
    pageTitle: "Danh sách người dùng",
    users: users
  });
};

module.exports.request = async (req, res) => {
  userSocket(req, res);
  
  const users = await User.find({
    _id: { $in: res.locals.user.requestFriends },
    deleted: false,
    status: "active"
  }).select("id fullName avatar");


  res.render("client/pages/user/request", {
    pageTitle: "Lời mời đã gửi",
    users: users
  });
}

module.exports.accept = async (req, res) => {
  userSocket(req, res);

  const users = await User.find({
    _id: { $in: res.locals.user.acceptFriends },
    deleted: false,
    status: "active"
  }).select("id fullName avatar");


  res.render("client/pages/user/accept", {
    pageTitle: "Lời mời đã nhận",
    users: users
  });
}

module.exports.friends = async (req, res) => {
  const userIdA = res.locals.user.id;
  
  const friendsList = res.locals.user.friendsList;
  const friendsListId = friendsList.map(item => item.userId);

  const users = await User.find({
    _id: { $in: friendsListId },
    deleted: false,
    status: "active"
  }).select("id fullName avatar statusOnline");


  res.render("client/pages/user/friends", {
    pageTitle: "Danh sách bạn bè",
    users: users
  });
}