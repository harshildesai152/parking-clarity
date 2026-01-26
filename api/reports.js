import dbConnect from './db.js';
import Report from './models/Report.js';
import Parking from './models/Parking.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const { method } = req;
  await dbConnect();

  let user = null;
  const token = req.cookies?.auth_token || req.body?.token;
  if (token) {
    try {
      user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (error) {
      console.error('Auth Verify Error:', error.message);
    }
  }

  const requireAuth = () => {
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return false;
    }
    return true;
  };

  switch (method) {
    case 'GET':
      if (!requireAuth()) return;
      try {
        const reports = await Report.find({ user_email: user.email })
          .populate('parking_id', 'name')
          .sort({ createdAt: -1 });

        const formattedReports = reports.map(report => ({
          id: report._id,
          parkingArea: report.parking_id ? report.parking_id.name : 'Unknown Area',
          reason: report.report_reason,
          time: report.report_timing,
          duration: report.report_duration,
          reportedBy: report.user_email,
          timestamp: report.createdAt
        }));

        return res.status(200).json(formattedReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        return res.status(500).json({ error: 'Failed to fetch reports' });
      }

    case 'POST':
      if (!requireAuth()) return;
      const { parking_id, report_reason, report_timing, report_duration } = req.body;
      if (!parking_id || !report_reason || !report_timing || !report_duration) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      try {
        const newReport = new Report({
          parking_id,
          user_email: user.email,
          report_reason,
          report_timing,
          report_duration
        });
        await newReport.save();
        await Parking.findByIdAndUpdate(parking_id, { $inc: { reportCount: 1 } });
        return res.status(201).json({ success: true, data: newReport });
      } catch (error) {
        console.error('Error submitting report:', error);
        return res.status(500).json({ error: 'Failed to submit report', details: error.message });
      }

    case 'DELETE':
      if (!requireAuth()) return;
      const { id } = req.query;
      try {
        if (id) {
          const report = await Report.findOne({ _id: id, user_email: user.email });
          if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
          await Parking.findByIdAndUpdate(report.parking_id, { $inc: { reportCount: -1 } });
          await Report.findByIdAndDelete(id);
          return res.status(200).json({ success: true, message: 'Report deleted' });
        } else {
          const userReports = await Report.find({ user_email: user.email });
          for (const report of userReports) {
            await Parking.findByIdAndUpdate(report.parking_id, { $inc: { reportCount: -1 } });
          }
          const result = await Report.deleteMany({ user_email: user.email });
          return res.status(200).json({ success: true, deletedCount: result.deletedCount });
        }
      } catch (error) {
        console.error('Error deleting report(s):', error);
        return res.status(500).json({ error: error.message });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
