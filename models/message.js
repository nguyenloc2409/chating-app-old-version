const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    from: String,
    to: String,
    time: {type: Date, default: Date.now()},
    content: String
});

module.exports = mongoose.model("message", messageSchema);