const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Prediction = require('../models/Prediction');
const { protect, doctorOnly } = require('../middleware/auth');

// @GET /api/doctors - Get approved doctors (public, with filters)
router.get('/', async (req, res) => {
  try {
    const { specialization, city, search } = req.query;
    const filter = { status: 'ACTIVE' };
    if (specialization) filter.specialization = specialization;
    if (city) filter.city = new RegExp(city, 'i');
    if (search) filter.$or = [
      { name: new RegExp(search, 'i') },
      { hospitalName: new RegExp(search, 'i') }
    ];

    const doctors = await Doctor.find(filter).sort({ rating: -1 });
    res.json({ success: true, doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/doctors/:id - Get single doctor
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/doctors/dashboard/appointments - Doctor's appointments
router.get('/dashboard/appointments', protect, doctorOnly, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate('patientId', 'name email mobile age gender')
      .populate('predictionId')
      .sort({ appointmentDate: -1 });

    res.json({ success: true, appointments, doctorProfile: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/doctors/dashboard/stats - Doctor stats
router.get('/dashboard/stats', protect, doctorOnly, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const [total, confirmed, pending, completed] = await Promise.all([
      Appointment.countDocuments({ doctorId: doctor._id }),
      Appointment.countDocuments({ doctorId: doctor._id, status: 'Confirmed' }),
      Appointment.countDocuments({ doctorId: doctor._id, status: 'Pending' }),
      Appointment.countDocuments({ doctorId: doctor._id, status: 'Completed' })
    ]);
    res.json({ success: true, stats: { total, confirmed, pending, completed } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/doctors/appointments/:id/status - Update appointment status
router.put('/appointments/:id/status', protect, doctorOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
