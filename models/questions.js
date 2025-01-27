const mongoose = require("mongoose");

const answerSchema = mongoose.Schema({
    date: Date,
    author: String,
    pictures: [String],
    content: String,
    hasLiked: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
})

const questionSchema = mongoose.Schema({
	author: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
	date: Date,
	title: String,
	pictures: [String],
	message: String,
    answers: [answerSchema],
});

const Question = mongoose.model("questions", questionSchema);
const Answer = mongoose.model("answers", answerSchema);

module.exports = { Question, Answer };
