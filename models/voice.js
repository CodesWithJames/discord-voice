const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  userID: { type: String },
  guildID: { type: String },
	joinTime: { type: Number, default: 0 },
  voiceTime: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: new Date() }
});

module.exports = mongoose.model('Messages', MessageSchema);