const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const prisma = require('../prisma');

const router = express.Router();

function signTokens(userId, role) {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { token, refreshToken };
}

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    body('role').optional().isIn(['patient', 'doctor', 'admin']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name, role = 'patient' } = req.body;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role,
          patientProfile: role === 'patient' ? { create: { name } } : undefined,
        },
      });

      const { token, refreshToken } = signTokens(user.id, user.role);

      res.status(201).json({
        token,
        refreshToken,
        user: { id: user.id, email: user.email, role: user.role, name },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { patientProfile: true, doctorProfile: true },
      });

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { token, refreshToken } = signTokens(user.id, user.role);
      const profile = user.patientProfile || user.doctorProfile;

      res.json({
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: profile?.name || email,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    res.json({ token });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

module.exports = router;
