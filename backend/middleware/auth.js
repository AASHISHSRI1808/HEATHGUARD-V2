const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if admin
    if (decoded.role === 'admin') {
      req.user = { id: 'admin', role: 'admin', email: process.env.ADMIN_EMAIL, name: 'Administrator' };
      return next();
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

const doctorOnly = (req, res, next) => {
  if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Doctor access required' });
  }
  next();
};

module.exports = { protect, adminOnly, doctorOnly };
