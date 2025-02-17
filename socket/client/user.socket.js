const User = require("../../models/user.model");
const RoomChat = require("../../models/room-chat.model");

module.exports = (req, res) => {
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
      
      // Trả về cho B số lượng user cần chấp nhận
      const userB = await User.findOne({
        _id: userIdB,
        deleted: false,
        status: "active"
      });
      
      _io.emit("SERVER_RETURN_LENGTH_ACCEPT_FRIENDS", {
        userIdB: userIdB,
        length: userB.acceptFriends.length
      })

      // Trả về cho B thông tin của A
      _io.emit("SERVER_RETURN_INFO_ACCEPT_FRIENDS", {
        userIdA: userIdA,
        fullNameA: res.locals.user.fullName,
        avatarA: "", //res.locals.user.avatar
        userIdB: userIdB,
      })
    })


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
        // Trả về cho B số lượng user cần chấp nhận
        const userB = await User.findOne({
          _id: userIdB,
          deleted: false,
          status: "active"
        });
        _io.emit("SERVER_RETURN_LENGTH_ACCEPT_FRIENDS", {
          userIdB: userIdB,
          length: userB.acceptFriends.length
        })

        _io.emit("SERVER_RETURN_USER_ID_CANCEL_FRIEND",  {
          userIdA: userIdA,
          userIdB: userIdB
        })
    })

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

    // Khi A đồng ý kết bạn của B
    socket.on("CLIENT_ACCEPTED_FRIEND", async (userIdB) => {
      // Thêm {userId, roomChatId} của B vào friendsList của A
      // Xóa id của B trong acceptFriends của A
      const existBInA = await User.findOne({
        _id: userIdA,
        acceptFriends: userIdB
      });
      const existAInB = await User.findOne({
        _id: userIdB,
        requestFriends: userIdA
      });

      if(existBInA && existAInB) {
        // Tạo phòng chat chung cho A và B
        const roomChat = new RoomChat({
          typeRoom: "friend",
          users: [
            {
              userId: userIdA,
              role: "superAdmin"
            },
            {
              userId: userIdB,
              role: "superAdmin"
            }
          ]
        });
        await roomChat.save(); 
      
        await User.updateOne({
          _id: userIdA
        }, {
          $pull: { acceptFriends: userIdB },
          $push: {
            friendsList: {
              userId: userIdB,
              roomChatId: roomChat.id
            }
          }
        });

      // Thêm {userId, roomChatId} của A vào friendsList của B
      // Xóa id của A trong requestFriends của B   
        await User.updateOne({
          _id: userIdB
        }, {
          $pull: { requestFriends: userIdA },
          $push: {
            friendsList: {
              userId: userIdA,
              roomChatId: roomChat.id
            }
          }
        });
      }
    })

  // Khi A xoá B khỏi danh sách bạn bè
    socket.on("CLIENT_DELETE_FRIEND", async (userIdB) => {
      // Xóa id của A trong friendsList của B
      const existAInB = await User.findOne({
        _id: userIdB,
        friendsList: {
          $elemMatch: { userId: userIdA } // Tìm object có userId tương ứng
        }
      });
      
      if(existAInB) {
        await User.updateOne({
          _id: userIdB
        }, {
          $pull: { friendsList: { userId: userIdA } }
        });
      }
      // Xóa id của B trong friendsList của A
      const existBInA = await User.findOne({
        _id: userIdA,
        friendsList: {
          $elemMatch: { userId: userIdB } // Tìm object có userId tương ứng
        }
      });
      if(existBInA) {
        await User.updateOne({
          _id: userIdA
        }, {
          $pull: { friendsList: { userId: userIdB } }
        });
      }
  })
  })
}