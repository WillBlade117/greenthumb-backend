const mongoose = require("mongoose");

const trackingSchema = mongoose.Schema({
    date: Date,
    tasks: [String],
})

const plantSchema = mongoose.Schema({
    date: Date,
	user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
	name: String,
	description: String,
	pictures: [String],
	tracking: [trackingSchema],
});

const Tracking = mongoose.model("trackings", trackingSchema);
const Plant = mongoose.model("plants", plantSchema);

module.exports = { Plant, Tracking };