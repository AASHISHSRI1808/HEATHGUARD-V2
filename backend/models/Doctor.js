const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  mciNumber: { type: String, required: true, unique: true },
  specialization: { 
    type: String, 
    required: true,
    enum: ['Cardiologist', 'Hepatologist', 'Neurologist', 'General Physician', 'Other']
  },
  experience: { type: Number, required: true },
  hospitalName: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  consultationFee: { type: Number, default: 500 },
  availableSlots: [{
    day: String,
    startTime: String,
    endTime: String
  }],
  status: { 
    type: String, 
    enum: ['PENDING', 'ACTIVE', 'REJECTED'], 
    default: 'PENDING' 
  },
  rating: { type: Number, default: 4.5 },
  profileImage: { type: String },
  about: { type: String },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date }
});

module.exports = mongoose.model('Doctor', doctorSchema);
