const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const parkingRoutes = require('./routes/parking');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');

dotenv.config();

console.log("Environment Variables Loaded:", Object.keys(process.env).filter(key => key.includes('EMAIL') || key.includes('MONGODB') || key.includes('JWT')));

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:5174', // Adjust to your frontend URL
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.json({ message: 'Parking Clarity Backend API is running' });
});

app.use('/api/parking', parkingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
