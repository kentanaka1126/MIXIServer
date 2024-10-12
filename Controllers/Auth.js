const UserModel = require("../Models/UserModel.js");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const maxAge = 3 * 24 * 60 * 60;

const createToken = (id) => {
  return jwt.sign({ id }, "test", {
    expiresIn: maxAge,
  });
};

const handleErrors = (error) => {
  let errors = {
    email: "",
    password: "",
  };

  if (error.message === "Incorrect Email") {
    errors.email = "This email is not registered";
  }
  if (error.message === "Incorrect Password") {
    errors.password = "This password is incorrect";
  }
  if (error.message === "Already Registered") {
    errors.password = "Email is already registered.";
  }
  if (error.code === 11000) {
    errors.email = "Email is already registered.";
    return errors;
  }

  if (error.message.includes("Users validation failed")) {
    Object.values(error.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

module.exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      email == process.env.ADMIN_EMAIL
    ) {
      throw new Error("Already Registered");
    }

    const user = await UserModel.create({
      email,
      password,
    });

    const token = createToken(user._id);
    res.cookie("jwt", token, {
      withCredentials: true,
      httpOnly: false,
      maxAge: maxAge * 1000,
    });

    res.status(200).json({ user: user, token: token, created: true });
  } catch (error) {
    console.log(error);
    const errors = handleErrors(error);
    res.json({ errors, created: false });
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (email == process.env.ADMIN_EMAIL) {
      if (password == process.env.ADMIN_PASSWORD) {
        const token = createToken(email);
        res.cookie("jwt", token, {
          withCredentials: true,
          httpOnly: false,
          maxAge: maxAge * 1000,
        });

        res.status(202).json({ user: "admin", token: token });
        next();
      } else throw new Error("Incorrect Password");
    } else {
      const user = await UserModel.login(email, password);
      const token = createToken(user._id);
      res.cookie("jwt", token, {
        withCredentials: true,
        httpOnly: false,
        maxAge: maxAge * 1000,
      });

      res.status(200).json({ user: user, token: token, created: true });
    }
  } catch (error) {
    console.log(error);
    const errors = handleErrors(error);
    res.status(500).json({ errors, created: false });
  }
};

module.exports.googleLogin = async (req, res) => {
  try {
    const response = await require("axios").get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${req.body.token.access_token}`,
        },
      }
    );
    const email = response.data.email;
    console.log(email);
    if (email == process.env.ADMIN_EMAIL) {
      res.status(202).json({ user: "admin", token: createToken(email) });
    } else {
      UserModel.find({ email: email })
        .then(async (data) => {
          res
            .status(200)
            .json({ user: data[0], token: createToken(data[0].email) });
        })
        .catch(async (errors) => {
          console.log(errors);

          try {
            const user = await UserModel.create({
              email,
              password: "MIXIPASS",
            });

            const token = createToken(user._id);
            res.cookie("jwt", token, {
              withCredentials: true,
              httpOnly: false,
              maxAge: maxAge * 1000,
            });

            res.status(200).json({ user: user, token: token, created: true });
          } catch (error) {
            console.log(error);
            const errors = handleErrors(error);
            res.json({ errors, created: false });
          }
        });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: error.message });
  }
};

module.exports.forgot = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL, // Add your email here
        pass: process.env.ADMIN_PASSWORD, // Add your email password here
      },
    });

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: req.body.email,
      subject: "Reset Password",
      html: `<h1>Reset Your Password</h1>
    <p>Click on the following link to reset your password:</p>
    <a href="http://localhost:3000/reset/${token}">http://localhost:3000/reset/${token}</a>
    <p>The link will expire in 10 minutes.</p>
    <p>If you didn't request a password reset, please ignore this email.</p>`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return res.status(500).send({ message: err.message });
      }
      res.status(200).send({ message: "Email sent" });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.reset = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await UserModel.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
