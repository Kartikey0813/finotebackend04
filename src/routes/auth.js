const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const dbConnect = require('../../lib/mongodb');
const User = require('../../models/User');

// ---------------- SIGNUP ----------------
router.post('/signup', async (req, res) => {
  try {
    await dbConnect();

    const { name, email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).send('Missing email or password');
    }

    // check if user already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).send('User already exists');

    // hash password
    const hash = await bcrypt.hash(password, 10);

    // create new user with UUID as _id
    const newUser = new User({
      _id: crypto.randomUUID(),
      name,
      email,
      password: hash,
      role,
    });

    await newUser.save();

    // create JWT
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: newUser._id, email: newUser.email, name: newUser.name }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

// ---------------- LOGIN ----------------
router.post('/login', async (req, res) => {
  try {
    await dbConnect();

    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send('Missing credentials');

    const user = await User.findOne({ email });
    if (!user) return res.status(401).send('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).send('Invalid credentials');

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;