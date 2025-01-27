const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    username: String,
	email: String,
	password: String,
	token: String,
	date: Date,
	notifications: Boolean,
	experience: Number,
	level: Number,
    isAdmin: Boolean,
});

const User = mongoose.model("users", userSchema);

module.exports = User;