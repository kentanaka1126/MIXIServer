const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is Required."],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is required."],
  },
  resetToken: {
    type: String,
    default:null
  },
  resetTokenExpiry: {
    type: Date,
    default:null
  },
  subscription: {
    type: Number,
    default: 0,
  },
  nRequest: {
    type: Number,
    default: 0,
    required: [true, "Requests number is required."],
  },
  state: {
    type: Number,
    default: 1,
  },
});

userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw Error("Incorrect Password");
  }
  throw Error("Incorrect Email");
};

module.exports = mongoose.model("users-db", userSchema);
