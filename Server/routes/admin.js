const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const auth = require('../middleware/auth');

// Email setup (configure this with your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// OTP cache with expiration
const otpCache = new Map();
const OTP_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes

// Admin login
router.post('/login', async (req, res) => {
  const { password } = req.body;
  let { username } = req.body;
  username = username.toLowerCase();

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: 'Username Not Found' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect Password' });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 3600000, // 1 hour in milliseconds
    });

    res.json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Create admin with OTP verification
router.post('/create', async (req, res) => {
  const { password, otp } = req.body;
  let { username } = req.body;
  username = username.toLowerCase();

  try {
    if (otp) {
      // OTP verification step
      if (otpCache.has(username)) {
        const { storedOtp, createdAt } = otpCache.get(username);

        if (Date.now() - createdAt > OTP_EXPIRATION_TIME) {
          otpCache.delete(username);
          return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        if (storedOtp === otp) {
          const existingAdmin = await Admin.findOne({ username });
          if (existingAdmin) {
            return res.status(400).json({ message: 'Username already exists' });
          }

          const hashedPassword = await bcrypt.hash(password, 10);
          const admin = new Admin({ username, password: hashedPassword });
          await admin.save();
          otpCache.delete(username);
          return res.status(201).json({ message: 'Admin created successfully' });
        } else {
          return res.status(400).json({ message: 'Invalid OTP' });
        }
      } else {
        return res.status(400).json({ message: 'No OTP found for this username' });
      }
    } else {
      // Generate and send OTP
      const newOtp = crypto.randomInt(100000, 999999).toString();
      otpCache.set(username, { storedOtp: newOtp, createdAt: Date.now() });

      const mailOptions = {
        from: process.env.MAIL_USER,
        to: process.env.MAIL_USER,
        subject: 'New Admin Creation Request',
        text: `A new admin with username ${username} is requesting to be added. Please use the OTP: ${newOtp} to verify the request.`,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'OTP sent to the Owner. Please verify with the OTP.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Delete admin (protected route)
router.delete('/delete/:id', auth, async (req, res) => {
  const adminId = req.params.id;

  try {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    await Admin.findByIdAndDelete(adminId);
    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Logout route to clear the cookie
router.post('/logout', (req, res) => {
  // Clear the cookie
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    path: '/', // Ensure the path matches the one used when setting the cookie
    domain: process.env.COOKIE_DOMAIN || undefined, // Use the domain if set, otherwise let it default
  });

  // Send response
  res.status(200).json({ message: 'Logged out successfully' });
});
// Protected route example
router.get('/protected', auth, (req, res) => {
  res.json({ message: 'This is a protected route', adminId: req.admin });
});

// Verify token route
router.get('/verify', (req, res) => {
  const token = req.cookies.authToken; // Extract token from cookies

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    res.status(200).json({ message: 'Token is valid' });
  });
});

module.exports = router;