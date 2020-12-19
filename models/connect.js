const mongoose = require("mongoose");

const connectSchema = new mongoose.Schema({
    skID: String,
    IDusername: String,
    connectMoment: {type:Date, default:Date.now()}
});

module.exports = mongoose.model("connect", connectSchema);