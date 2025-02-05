const User = require("../../models/user.model");
const md5 = require("md5");
const generateHelper = require("../../helpers/generate.helper");

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
  req.flash("success", "Đăng nhập thành công!");

  res.redirect("/chat");
};

module.exports.logout = async (req, res) => {
  res.clearCookie("tokenUser");
  req.flash("success", "Đã đăng xuất!");

  res.redirect("/chat");
};

module.exports.notFriend = async (req, res) => {
  const userIdA = res.locals.user.id;

  _io.once("connection", (socket) => {
    // Khi A gửi yêu cầu cho B
    socket.on("CLIENT_ADD_FRIEND", async(userIdB) => {
      // Thêm id của A vào acceptFriends của B
      const existAinB = await User.findOne({
        _id: userIdB,
        acceptFriends: userIdA
      });

      if(!existAinB) {
        await User.updateOne({
          _id: userIdB 
        }, {
          $push: { acceptFriends: userIdA}
        });
      }

      // Thêm id của B vào requestFriends của A
      const existBInA = await User.findOne({
        _id: userIdA,
        requestFriends: userIdB
      });
      if(!existBInA) {
        await User.updateOne({
          _id: userIdA
        }, {
          $push: { requestFriends: userIdB }
        });
      }
    })
  })

  const users = await User.find({
    $and:[
      {_id: { $ne: userIdA }},
      {_id: { $nin : res.locals.user.requestFriends}},// $nin: not in
      {_id : { $nin : res.locals.user.acceptFriends }}
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
  const userIdA = res.locals.user.id;
  
  _io.once("connection", (socket) => {
    // Khi A huỷ yêu cầu kết bạn  B
    socket.on("CLIENT_CANCEL_FRIEND", async (userIdB) => {
      // Xóa id của A trong acceptFriends của B
      const existAInB = await User.findOne({
        _id: userIdB,
        acceptFriends: userIdA
      });
      if(existAInB) {
        await User.updateOne({
          _id: userIdB
        }, {
          $pull: { acceptFriends: userIdA }
        });
      }
      // Xóa id của B trong requestFriends của A
      const existBInA = await User.findOne({
        _id: userIdA,
        requestFriends: userIdB
      });
      if(existBInA) {
        await User.updateOne({
          _id: userIdA
        }, {
          $pull: { requestFriends: userIdB }
        });
      }
    })
  })
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
  const userIdA = res.locals.user.id;
  
  _io.once("connection", (socket) => {
    // Khi A từ chối kết bạn của B
    socket.on("CLIENT_REFUSE_FRIEND", async (userIdB) => {
      // Xóa id của B trong acceptFriends của A
      const existBInA = await User.findOne({
        _id: userIdA,
        acceptFriends: userIdB
      });
      if(existBInA) {
        await User.updateOne({
          _id: userIdA
        }, {
          $pull: { acceptFriends: userIdB }
        });
      }
      // Xóa id của A trong requestFriends của B
      const existAInB = await User.findOne({
        _id: userIdB,
        requestFriends: userIdA
      });
      if(existAInB) {
        await User.updateOne({
          _id: userIdB
        }, {
          $pull: { requestFriends: userIdA }
        });
      }
    })
  })
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