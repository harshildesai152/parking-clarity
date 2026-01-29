import mongoose from 'mongoose';

const parkingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  category: {
    type: String,
    enum: ['hospital', 'office', 'transport', 'shopping', 'shopping-mall', 'market'],
    required: true
  },
  vehicleTypes: [{
    type: String,
    enum: ['car', 'motorcycle', 'bicycle', 'truck', 'ev']
  }],
  parkingType: {
    type: String,
    enum: ['free', 'paid', 'street', 'covered', 'valet'],
    required: true
  },
  parkingTypeInfo: {
    type: String,
    enum: ['Free', 'Paid', 'Street', 'Covered', 'Valet'],
    required: true
  },
  minDuration: {
    type: Number,
    default: 0
  },
  capacity: {
    car: {
      total: { type: Number, required: true },
      available: { type: Number, required: true }
    },
    motorcycle: {
      total: { type: Number, required: true },
      available: { type: Number, required: true }
    },
    truck: {
      total: { type: Number, required: true },
      available: { type: Number, required: true }
    }
  },
  pricing: {
    hourly: Number,
    daily: Number,
    weekly: Number
  },
  operatingHours: {
    monday: [
      { open: String, close: String, isOpen: { type: Boolean, default: true } }
    ],
    tuesday: [
      { open: String, close: String, isOpen: { type: Boolean, default: true } }
    ],
    wednesday: [
      { open: String, close: String, isOpen: { type: Boolean, default: true } }
    ],
    thursday: [
      { open: String, close: String, isOpen: { type: Boolean, default: true } }
    ],
    friday: [
      { open: String, close: String, isOpen: { type: Boolean, default: true } }
    ],
    saturday: [
      { open: String, close: String, isOpen: { type: Boolean, default: true } }
    ],
    sunday: [
      { open: String, close: String, isOpen: { type: Boolean, default: true } }
    ]
  },
  amenities: [String],
  reportCount: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: String,
    rating: Number,
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Parking || mongoose.model('Parking', parkingSchema);
