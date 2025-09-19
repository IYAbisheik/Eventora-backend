const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: { type: String }, 
  email: { type: String, required: true, unique: true },
  password: { type: String },
  firstname: { type: String },
  lastname: { type: String },
  username: { type: String, unique: true, sparse: true },
  phoneNumber: { type: String },
  birthDate: { type: Date },
  gender: { type: String, enum: ["male", "female", "other"] },
  photo: { type: String }, 
});

module.exports = mongoose.model("User", userSchema);
