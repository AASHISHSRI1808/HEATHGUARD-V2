const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  predictionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prediction' },
  appointmentDate: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'], 
    default: 'Pending' 
  },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Refunded'], default: 'Pending' },
  paymentId: { type: String },
  orderId: { type: String },
  amount: { type: Number },
  notes: { type: String },
  patientReport: {
    fileName:    { type: String },
    fileType:    { type: String },  // 'image/jpeg', 'image/png', 'application/pdf'
    fileData:    { type: String },  // base64 encoded
    uploadedAt:  { type: Date },
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
