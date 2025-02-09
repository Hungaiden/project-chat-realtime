const User = require("../../models/user.model");
const RoomChat = require("../../models/room-chat.model");

module.exports.isAccess = async (req, res, next) => {
    try {
        const roomChatId = req.params.roomChatId;
        const userId = res.locals.user.id;
      
        const existRoomChat = await RoomChat.findOne({
          _id: roomChatId
        });
      
        if(!existRoomChat) {
          res.redirect("/");
          return;
        }
      
        const existUserInRoom = existRoomChat.users.find(item => item.userId == userId);
        if(!existUserInRoom) {
          res.redirect("/");
          return;
        }
        next();
      
    }
    catch (error){
        res.redirect("/");
    }

}

