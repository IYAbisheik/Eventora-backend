const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstname: { type: String },
  lastname: { type: String },
  username: { type: String, unique: true },
  phoneNumber: { type: String },
  birthDate: { type: Date },
  gender: { type: String, enum: ["male", "female", "other"] },
});

module.exports = mongoose.model("User", userSchema);
