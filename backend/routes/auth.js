const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { protect } = require('../middleware/auth');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// @POST /api/auth/register - Patient Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, mobile, age, gender, bloodGroup } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, mobile, age, gender, bloodGroup, role: 'patient' });
    const token = generateToken(user._id, user.role);

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful',
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/auth/login - Patient/Doctor Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Admin login (hardcoded)
    if (email === process.env.ADMIN_EMAIL) {
      if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const token = generateToken('admin', 'admin');
      return res.json({ 
        success: true, 
        token,
        user: { id: 'admin', name: 'Administrator', email: process.env.ADMIN_EMAIL, role: 'admin' }
      });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if doctor is approved
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (doctor && doctor.status !== 'ACTIVE') {
        return res.status(403).json({ 
          success: false, 
          message: doctor.status === 'PENDING' 
            ? 'Your account is pending admin approval' 
            : 'Your account has been rejected' 
        });
      }
    }

    const token = generateToken(user._id, user.role);
    res.json({ 
      success: true, 
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, mobile: user.mobile }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/auth/doctor-register - Doctor Registration
router.post('/doctor-register', async (req, res) => {
  try {
    const { name, email, password, mobile, mciNumber, specialization, experience, hospitalName, city, state, consultationFee, about } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

    const existingDoctor = await Doctor.findOne({ mciNumber });
    if (existingDoctor) return res.status(400).json({ success: false, message: 'MCI number already registered' });

    const user = await User.create({ name, email, password, mobile, role: 'doctor' });
    
    await Doctor.create({ 
      userId: user._id, name, email, mobile, mciNumber, specialization, 
      experience, hospitalName, city, state, consultationFee: consultationFee || 500, about, status: 'PENDING'
    });

    res.status(201).json({ success: true, message: 'Doctor registration submitted. Awaiting admin approval.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/auth/me - Get current user
router.get('/me', protect, async (req, res) => {
  try {
    let userData = req.user;
    if (req.user.role === 'doctor') {
      const doctorData = await Doctor.findOne({ userId: req.user._id });
      userData = { ...req.user.toObject(), doctorProfile: doctorData };
    }
    res.json({ success: true, user: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
