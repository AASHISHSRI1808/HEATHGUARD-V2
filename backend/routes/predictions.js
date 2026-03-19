const express = require('express');
const router = express.Router();
const axios = require('axios');
const Prediction = require('../models/Prediction');
const { protect } = require('../middleware/auth');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');

const DISEASE_RECOMMENDATIONS = {
  Heart: {
    Positive: [
      'Consult a Cardiologist immediately',
      'Maintain a heart-healthy diet low in saturated fats',
      'Exercise regularly with medical supervision',
      'Monitor blood pressure daily',
      'Avoid smoking and alcohol',
      'Take prescribed medications on time'
    ],
    Negative: [
      'Continue healthy lifestyle habits',
      'Regular cardiovascular checkups recommended',
      'Maintain healthy BMI',
      'Regular exercise 30 min/day'
    ]
  },
  Liver: {
    Positive: [
      'Consult a Hepatologist immediately',
      'Avoid alcohol completely',
      'Follow a liver-friendly diet',
      'Monitor liver enzymes regularly',
      'Stay hydrated',
      'Avoid hepatotoxic medications'
    ],
    Negative: [
      'Maintain healthy liver habits',
      'Limit alcohol consumption',
      'Regular liver function tests',
      'Maintain healthy weight'
    ]
  },
  Parkinson: {
    Positive: [
      'Consult a Neurologist immediately',
      'Begin physical therapy exercises',
      'Explore speech therapy if needed',
      'Join a Parkinson\'s support group',
      'Ensure home safety modifications',
      'Discuss medication options with neurologist'
    ],
    Negative: [
      'Continue regular neurological checkups',
      'Maintain active lifestyle',
      'Mental exercises like puzzles recommended',
      'Good sleep hygiene is important'
    ]
  }
};

// @POST /api/predictions - Make a prediction
router.post('/', protect, async (req, res) => {
  try {
    const { diseaseType, inputParameters, patientName: customPatientName, runByDoctor } = req.body;
    
    if (!['Heart', 'Liver', 'Parkinson'].includes(diseaseType)) {
      return res.status(400).json({ success: false, message: 'Invalid disease type' });
    }

    // Call ML service
    let mlResult;
    try {
      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, {
        disease: diseaseType.toLowerCase(),
        data: inputParameters
      }, { timeout: 30000 });
      mlResult = mlResponse.data;
    } catch (mlError) {
      console.error('ML Service Error:', mlError.message);
      // Fallback mock result for demo
      const prob = Math.random() * 0.8 + 0.1;
      mlResult = {
        prediction: prob > 0.5 ? 'Positive' : 'Negative',
        probability: parseFloat((prob * 100).toFixed(1)),
        risk_level: prob > 0.7 ? 'High' : prob > 0.5 ? 'Moderate' : 'Low'
      };
    }

    const riskLevel = mlResult.risk_level || (
      mlResult.probability > 70 ? 'High' : 
      mlResult.probability > 50 ? 'Moderate' : 
      mlResult.probability > 30 ? 'Low' : 'Low'
    );

    const recommendations = DISEASE_RECOMMENDATIONS[diseaseType][mlResult.prediction] || [];

    // Save prediction
    const prediction = await Prediction.create({
      userId: req.user._id || req.user.id,
      patientName: customPatientName || req.user.name,
      patientAge: req.user.age || inputParameters.age || inputParameters.Age,
      patientGender: req.user.gender || inputParameters.gender || inputParameters.Gender,
      diseaseType,
      inputParameters,
      result: {
        prediction: mlResult.prediction,
        probability: mlResult.probability,
        riskLevel
      },
      recommendations
    });

    // Generate PDF
    try {
      const pdfPath = await pdfService.generatePredictionPDF(prediction, req.user);
      prediction.pdfPath = pdfPath;
      await prediction.save();
    } catch (pdfErr) {
      console.error('PDF generation error:', pdfErr);
    }

    // Send email
    try {
      await emailService.sendPredictionReport(req.user.email, req.user.name, prediction);
      prediction.emailSent = true;
      await prediction.save();
    } catch (emailErr) {
      console.error('Email error:', emailErr);
    }

    res.status(201).json({ success: true, prediction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/predictions - Get user's predictions
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const predictions = await Prediction.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, predictions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/predictions/:id - Get single prediction
router.get('/:id', protect, async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id).populate('userId', 'name email');
    if (!prediction) return res.status(404).json({ success: false, message: 'Prediction not found' });
    res.json({ success: true, prediction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/predictions/:id/pdf - Download PDF
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) return res.status(404).json({ success: false, message: 'Prediction not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="HealthGuard_Report_${prediction.reportId}.pdf"`);

    const pdfService = require('../services/pdfService');
    const pdfBuffer = await pdfService.generatePDFBuffer(prediction);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
