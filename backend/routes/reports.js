const express = require('express');
const router = express.Router();
const Prediction = require('../models/Prediction');
const { protect } = require('../middleware/auth');

// @GET /api/reports - Get all reports for user
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const reports = await Prediction.find({ userId })
      .select('reportId diseaseType result createdAt patientName')
      .sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/reports/:reportId - Get specific report
router.get('/:reportId', protect, async (req, res) => {
  try {
    const report = await Prediction.findOne({ reportId: req.params.reportId });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
