const mongoose = require("mongoose");

const addfriendSchema = new mongoose.Schema({
    AccountSelf: String,
    AccountFriend: String,
    IDfriend: {type: mongoose.Schema.Types.ObjectId},
    HoTen: String
});

module.exports = mongoose.model("addfriend", addfriendSchema);