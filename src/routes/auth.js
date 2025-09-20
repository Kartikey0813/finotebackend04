const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!email || !password) return res.status(400).send('missing');
  const existing = await prisma.user.findUnique({ where: { email }});
  if (existing) return res.status(409).send('exists');
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, password: hash, role }});
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name }});
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email }});
  if (!user) return res.status(401).send('invalid');
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).send('invalid');
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  res.json({ token });
});

module.exports = router;
