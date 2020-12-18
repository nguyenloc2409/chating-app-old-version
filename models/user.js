const mongoose = require('mongoose');
var DateOnly = require('mongoose-dateonly')(mongoose);

const userSchema = new mongoose.Schema({
    userAccount : String,
    userFullname : String,
    userPassword : String,
    userEmail : String,
    userBirth : DateOnly,
    userNumber : String,
    userFriends : [{type: mongoose.Schema.Types.ObjectId}],
    userMessage : [{type: mongoose.Schema.Types.ObjectId}],
    userNotify : [{type: mongoose.Schema.Types.ObjectId}],
    CreateOn : Date
});

module.exports = mongoose.model("user", userSchema);