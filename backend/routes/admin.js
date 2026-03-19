const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Prediction = require('../models/Prediction');
const Appointment = require('../models/Appointment');
const { protect, adminOnly } = require('../middleware/auth');
const emailService = require('../services/emailService');

// All admin routes protected
router.use(protect, adminOnly);

// @GET /api/admin/dashboard - Dashboard Stats
router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers, totalDoctors, pendingDoctors, activeDoctors, totalPredictions, totalAppointments] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments(),
      Doctor.countDocuments({ status: 'PENDING' }),
      Doctor.countDocuments({ status: 'ACTIVE' }),
      Prediction.countDocuments(),
      Appointment.countDocuments()
    ]);

    res.json({ success: true, stats: { totalUsers, totalDoctors, pendingDoctors, activeDoctors, totalPredictions, totalAppointments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/doctors - All doctors with filters
router.get('/doctors', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const doctors = await Doctor.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/admin/doctors/:id/approve - Approve doctor
router.put('/doctors/:id/approve', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id, 
      { status: 'ACTIVE', approvedAt: new Date() }, 
      { new: true }
    );
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    // Send approval email
    try {
      await emailService.sendDoctorApprovalEmail(doctor.email, doctor.name, 'approved');
    } catch (emailErr) {
      console.error('Email error:', emailErr);
    }

    res.json({ success: true, message: 'Doctor approved successfully', doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/admin/doctors/:id/reject - Reject doctor
router.put('/doctors/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id, 
      { status: 'REJECTED' }, 
      { new: true }
    );
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    try {
      await emailService.sendDoctorApprovalEmail(doctor.email, doctor.name, 'rejected', reason);
    } catch (emailErr) {
      console.error('Email error:', emailErr);
    }

    res.json({ success: true, message: 'Doctor rejected', doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/users - All patients
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'patient' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/predictions - All predictions
router.get('/predictions', async (req, res) => {
  try {
    const predictions = await Prediction.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, predictions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
