const mongoose = require("mongoose");

const connectSchema = new mongoose.Schema({
    skID: String,
    IDusername: {type:mongoose.Schema.Types.ObjectId},
    connectMoment: {type:Date, default:Date.now()}
});

module.exports = mongoose.model("connect", connectSchema);