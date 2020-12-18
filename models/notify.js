const mongoose = require("mongoose");

const notifySchema = new mongoose.Schema({
    from: String,
    to: String,
    noidung: String,
    status: Number,
    skID: String
});

module.exports = mongoose.model("notify", notifySchema);