const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { config } = require("../config/env");
const User = require("../model/UserModel");
const { FundsModel } = require("../model/FundsModel");
const dbReady = require("../middleware/dbReady");
const { HttpError } = require("../utils/httpError");

const router = express.Router();
router.use(dbReady);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Compared against when the user doesn't exist, so "unknown email" and "wrong password" take the
// same time and return the same message (no account enumeration).
const DUMMY_HASH = bcrypt.hashSync("tradely-timing-equaliser", 10);

const str = (v) => (typeof v === "string" ? v : "");

router.post("/signup", async (req, res) => {
  const username = str(req.body?.username).trim();
  const email = str(req.body?.email).trim().toLowerCase();
  const password = str(req.body?.password);

  if (!username || username.length > 50) throw new HttpError(400, "Username is required (max 50 characters)");
  if (!EMAIL.test(email) || email.length > 254) throw new HttpError(400, "Please enter a valid email address");
  if (password.length < 8 || password.length > 72) throw new HttpError(400, "Password must be 8-72 characters");

  if (await User.findOne({ email })) throw new HttpError(409, "User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  let newUser;
  try {
    newUser = await User.create({ username, email, password: hashedPassword });
  } catch (err) {
    if (err && err.code === 11000) throw new HttpError(409, "User already exists");
    throw err;
  }

  // default funds for a new user (same amounts as before)
  await FundsModel.create({
    userId: newUser._id,
    availableMargin: 100000,
    usedMargin: 0,
    availableCash: 100000,
    openingBalance: 100000,
    payin: 0,
  });

  res.status(201).json({ message: "Signup successful" });
});

router.post("/login", async (req, res) => {
  const email = str(req.body?.email).trim().toLowerCase();
  const password = str(req.body?.password);
  if (!email || !password) throw new HttpError(400, "Email and password are required");

  // `email` is guaranteed to be a string here, so operators like {"$gt": ""} can't be injected
  const user = await User.findOne({ email });
  const ok = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, "Invalid email or password");

  const token = jwt.sign({ id: user._id.toString(), email: user.email }, config.jwtSecret, {
    algorithm: "HS256",
    expiresIn: config.jwtExpiresIn,
  });

  res.json({
    message: "Login successful",
    token,
    user: { id: user._id, username: user.username, email: user.email },
  });
});

module.exports = router;
