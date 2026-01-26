import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  parking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parking',
    required: true,
  },
  user_email: {
    type: String,
    required: true,
  },
  report_reason: {
    type: String,
    required: true,
  },
  report_timing: {
    type: String,
    required: true,
  },
  report_duration: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Report || mongoose.model('Report', reportSchema);
