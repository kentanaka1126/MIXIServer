const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const PORT = process.env.PORT || 5000;
dotenv.config();
// Import passport configuration

require("./config/passport"); // Import passport configuration
const app = express();

app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: [`http://localhost:3000`],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
// Google auth routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:3000/login",
  }),
  require("./Controllers/Auth.js").googleLogin
);

const authRoutes = require("./Routes/Auth.js");
const userRoutes = require("./Routes/User.js");
const stripeRoutes = require("./Routes/Payment.js");

app.get("/", (req, res) => {
  res.send("Troubleshooting...");
});

app.listen(PORT, () =>
  console.log(`Server running at port http://localhost:${PORT}/`)
);

mongoose
  .connect(process.env.CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(`Connected to database successfully.`))
  .catch((error) => console.log(error.message));


app.use(cookieParser());
app.use(express.json());
app.use("/", authRoutes);
app.use("/user", userRoutes);
app.use("/stripe", stripeRoutes);
