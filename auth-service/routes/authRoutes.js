const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ message: "name must be at least 2 characters" });
    }

    if (typeof email !== "string" || !emailRegex.test(email)) {
      return res.status(400).json({ message: "valid email is required" });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "user already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });
    console.log(`[AUTH] User registered: ${normalizedEmail}`);
    return res.status(201).json({ message: "user registered successfully", userId: user._id });
  } catch (error) {
    console.error(`[AUTH] Register error: ${error.message}`);
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    if (typeof email !== "string" || !emailRegex.test(email)) {
      return res.status(400).json({ message: "valid email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "invalid email or password" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "server auth configuration is missing" });
    }

    const token = jwt.sign(
      {
        sub: String(user._id),
        email: user.email,
        name: user.name,
      },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
    );

    console.log(`[AUTH] User logged in: ${normalizedEmail}`);
    return res.status(200).json({
      token,
      user: sanitizeUser(user),
      message: "login successful",
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
