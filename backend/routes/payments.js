const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const { protect } = require('../middleware/auth');

// ── POST /api/payments/create-order ──────────────────────────────────────────
// Returns a mock Razorpay-shaped order so the frontend mock checkout works
// without needing real Razorpay API keys.
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount, appointmentId } = req.body;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const orderId  = 'order_' + crypto.randomBytes(10).toString('hex');
    const receipt  = `receipt_${appointmentId || Date.now()}`;

    res.json({
      success: true,
      order: {
        id:       orderId,
        amount:   Math.round(Number(amount) * 100), // paise
        currency: 'INR',
        receipt,
      },
      key: 'rzp_test_mock_healthguard', // public-facing mock key shown in UI
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create order', error: err.message });
  }
});

// ── POST /api/payments/verify ─────────────────────────────────────────────────
// Accepts the mock payment payload and confirms it (always succeeds in mock mode).
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Missing payment fields' });
    }
    res.json({
      success:   true,
      message:   'Mock payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId:   razorpay_order_id,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification error', error: err.message });
  }
});

module.exports = router;
