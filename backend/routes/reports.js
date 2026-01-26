const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/reports
// @desc    Submit a "Report Full" report
// @access  Private (Requires Login)
router.post('/', authMiddleware, async (req, res) => {
  const { parking_id, report_reason, report_timing, report_duration } = req.body;
  const user_email = req.user.email; // Extracted from decoded JWT by authMiddleware

  // Basic validation
  if (!parking_id || !report_reason || !report_timing || !report_duration) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const newReport = new Report({
      parking_id,
      user_email,
      report_reason,
      report_timing,
      report_duration
    });

    await newReport.save();

    // 4. Update the reportCount in the Parking model
    const Parking = require('../models/Parking');
    await Parking.findByIdAndUpdate(parking_id, { $inc: { reportCount: 1 } });

    res.status(201).json({ 
      success: true, 
      message: 'Report submitted successfully. Thank you for your contribution!',
      data: newReport
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ error: 'Failed to submit report', details: error.message });
  }
});

// @route   GET /api/reports
// @desc    Get user's report history
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find({ user_email: req.user.email })
      .populate('parking_id', 'name')
      .sort({ createdAt: -1 });

    // Format reports to match frontend expectations
    const formattedReports = reports.map(report => ({
      id: report._id,
      parkingArea: report.parking_id ? report.parking_id.name : 'Unknown Area',
      reason: report.report_reason,
      time: report.report_timing,
      duration: report.report_duration,
      reportedBy: report.user_email,
      timestamp: report.createdAt
    }));

    res.json(formattedReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete a specific report
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user_email: req.user.email });
    
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Update the reportCount in the Parking model (decrement)
    const Parking = require('../models/Parking');
    await Parking.findByIdAndUpdate(report.parking_id, { $inc: { reportCount: -1 } });

    await Report.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: 'Report deleted successfully',
      deletedCount: 1 
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/reports
// @desc    Delete all user's reports
// @access  Private
router.delete('/', authMiddleware, async (req, res) => {
  try {
    // Get all user's reports to update parking counts
    const userReports = await Report.find({ user_email: req.user.email });
    
    // Update the reportCount in the Parking model for all affected parking areas
    const Parking = require('../models/Parking');
    for (const report of userReports) {
      await Parking.findByIdAndUpdate(report.parking_id, { $inc: { reportCount: -1 } });
    }

    // Delete all user's reports
    const result = await Report.deleteMany({ user_email: req.user.email });
    
    res.json({ 
      success: true, 
      message: 'All your reports deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting all reports:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
