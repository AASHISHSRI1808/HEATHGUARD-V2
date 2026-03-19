const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { protect } = require('../middleware/auth');
const emailService = require('../services/emailService');

// @GET /api/appointments/booked-slots?doctorId=&date= — Public: get booked slots for a doctor on a date
router.get('/booked-slots', protect, async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) return res.status(400).json({ success: false, message: 'doctorId and date are required' });

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const booked = await Appointment.find({
      doctorId,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ['Pending', 'Confirmed'] }
    }).select('timeSlot');

    const bookedSlots = booked.map(a => a.timeSlot);
    res.json({ success: true, bookedSlots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/appointments - Book appointment
router.post('/', protect, async (req, res) => {
  try {
    const { doctorId, predictionId, appointmentDate, timeSlot, notes, patientReport } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    // ── Date validation: must be between tomorrow and 30 days from today ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + 1);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);

    const chosenDate = new Date(appointmentDate);
    chosenDate.setHours(0, 0, 0, 0);

    if (chosenDate < minDate) {
      return res.status(400).json({ success: false, message: 'Appointment must be scheduled for a future date (from tomorrow onwards).' });
    }
    if (chosenDate > maxDate) {
      return res.status(400).json({ success: false, message: 'Appointments can only be booked up to 30 days in advance.' });
    }

    // ── Slot conflict check: block already-booked slots ──
    const dayStart = new Date(appointmentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(appointmentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await Appointment.findOne({
      doctorId,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      timeSlot,
      status: { $in: ['Pending', 'Confirmed'] }
    });

    if (existing) {
      return res.status(409).json({ success: false, message: `The ${timeSlot} slot on this date is already booked. Please choose a different time.` });
    }

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      predictionId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      notes,
      patientReport: patientReport || undefined,
      amount: doctor.consultationFee,
      status: 'Pending',
      paymentStatus: 'Pending'
    });

    await appointment.populate(['patientId', 'doctorId']);
    res.status(201).json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/appointments - Get user appointments
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'patient' 
      ? { patientId: req.user._id }
      : {};
    
    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name email mobile')
      .populate('doctorId')
      .populate('predictionId')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/appointments/:id - Single appointment
router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email mobile age gender')
      .populate('doctorId')
      .populate('predictionId');
    
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/appointments/:id/confirm - Confirm after payment
router.post('/:id/confirm', protect, async (req, res) => {
  try {
    const { paymentId, orderId } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'Confirmed', paymentStatus: 'Paid', paymentId, orderId },
      { new: true }
    ).populate(['patientId', 'doctorId', 'predictionId']);

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    // Send confirmation email
    try {
      await emailService.sendAppointmentConfirmation(appointment);
    } catch (emailErr) {
      console.error('Email error:', emailErr);
    }

    res.json({ success: true, message: 'Appointment confirmed!', appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/appointments/:id/cancel
router.delete('/:id/cancel', protect, async (req, res) => {
  try {
    await Appointment.findByIdAndUpdate(req.params.id, { status: 'Cancelled' });
    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
