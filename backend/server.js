const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const parkingRoutes = require('./routes/parking');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.json({ message: 'Parking Clarity Backend API is running' });
});

app.use('/api/parking', parkingRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
