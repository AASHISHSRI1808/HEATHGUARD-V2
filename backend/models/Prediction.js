const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const predictionSchema = new mongoose.Schema({
  reportId: { type: String, default: () => `HG-${uuidv4().slice(0,8).toUpperCase()}` },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true },
  patientAge: { type: Number },
  patientGender: { type: String },
  diseaseType: { 
    type: String, 
    enum: ['Heart', 'Liver', 'Parkinson'], 
    required: true 
  },
  inputParameters: { type: mongoose.Schema.Types.Mixed, required: true },
  result: { 
    prediction: { type: String }, // 'Positive' or 'Negative'
    probability: { type: Number },
    riskLevel: { type: String, enum: ['Low', 'Moderate', 'High', 'Very High'] }
  },
  recommendations: [{ type: String }],
  pdfPath: { type: String },
  emailSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prediction', predictionSchema);
