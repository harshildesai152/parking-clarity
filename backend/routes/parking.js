const express = require('express');
const router = express.Router();
const Parking = require('../models/Parking');

// GET /api/parking - Master API with query parameters
router.get('/', async (req, res) => {
  try {
    const {
      id,
      search,
      lat,
      lng,
      radius = 1000,
      category,
      vehicleType,
      parkingType,
      minDuration,
      available,
      limit = 20,
      SIMULATE_TIME,
      SIMULATE_DAY
    } = req.query;

    // If id is provided, return single record
    if (id) {
      const parking = await Parking.findById(id);
      if (!parking) {
        return res.status(404).json({ message: 'Parking spot not found' });
      }
      return res.json(parking);
    }

    // Build query
    let query = {};
    
    // Base condition: include active documents and documents without isActive field
    let baseConditions = [
      { isActive: true },
      { isActive: { $exists: false } }
    ];

    // Search by name or description
    if (search) {
      baseConditions = baseConditions.map(condition => ({
        $and: [
          condition,
          {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
            ]
          }
        ]
      }));
      query.$or = baseConditions;
    } else {
      query.$or = baseConditions;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by vehicle type
    if (vehicleType) {
      query.vehicleTypes = vehicleType;
    }

    // Filter by parking type
    if (parkingType) {
      query.parkingType = parkingType;
    }

    // Filter by minimum duration
    if (minDuration) {
      query.minDuration = { $lte: parseInt(minDuration) };
    }

    // Filter by availability
    if (available !== undefined) {
      if (available === 'true') {
        const availabilityCondition = {
          $or: [
            { 'capacity.car.available': { $gt: 0 } },
            { 'capacity.motorcycle.available': { $gt: 0 } },
            { 'capacity.truck.available': { $gt: 0 } }
          ]
        };
        
        // Combine with base conditions
        if (query.$or) {
          query.$or = query.$or.map(condition => ({
            $and: [condition, availabilityCondition]
          }));
        } else {
          query = availabilityCondition;
        }
      } else {
        const availabilityCondition = {
          $and: [
            { 'capacity.car.available': 0 },
            { 'capacity.motorcycle.available': 0 },
            { 'capacity.truck.available': 0 }
          ]
        };
        
        // Combine with base conditions
        if (query.$or) {
          query.$or = query.$or.map(condition => ({
            $and: [condition, availabilityCondition]
          }));
        } else {
          query = availabilityCondition;
        }
      }
    }

    // Start with base query
    let parkingQuery = Parking.find(query);

    // Location-based query if lat/lng provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const searchRadius = parseFloat(radius);

      // Simple distance calculation using bounding box
      const latRange = searchRadius / 111320; // Approximate meters per degree latitude
      const lngRange = searchRadius / (111320 * Math.cos(userLat * Math.PI / 180));

      const locationCondition = {
        'location.lat': {
          $gte: userLat - latRange,
          $lte: userLat + latRange
        },
        'location.lng': {
          $gte: userLng - lngRange,
          $lte: userLng + lngRange
        }
      };

      // Combine with existing query
      if (query.$or) {
        query.$or = query.$or.map(condition => ({
          $and: [condition, locationCondition]
        }));
      } else {
        query = { ...query, ...locationCondition };
      }
    }

    // Apply limit and sort
    parkingQuery = parkingQuery.limit(parseInt(limit));

    // Execute query
    const parkingSpots = await parkingQuery.exec();

    // Add distance calculation if coordinates provided
    let result = parkingSpots;
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      
      result = parkingSpots.map(spot => {
        const spotObj = spot.toObject();
        const distance = calculateDistance(
          userLat, userLng,
          spot.location.lat, spot.location.lng
        );
        spotObj.distance = Math.round(distance);
        return spotObj;
      });

      // Sort by distance
      result.sort((a, b) => a.distance - b.distance);
    }

    // Simulate time/day effects if provided
    if (SIMULATE_TIME || SIMULATE_DAY) {
      result = simulateAvailability(result, SIMULATE_TIME, SIMULATE_DAY);
    }

    res.json({
      data: result,
      count: result.length,
      query: req.query
    });

  } catch (error) {
    console.error('Error fetching parking spots:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance * 1000; // Convert to meters
}

// Helper function to simulate availability based on time/day
function simulateAvailability(parkingSpots, simulateTime, simulateDay) {
  return parkingSpots.map(spot => {
    const modifiedSpot = { ...spot };
    
    // Simulate time-based availability
    if (simulateTime) {
      const hour = parseInt(simulateTime.split(':')[0]);
      const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);
      
      if (isPeakHour) {
        // Reduce availability during peak hours
        modifiedSpot.capacity.available = Math.max(0, Math.floor(spot.capacity.available * 0.3));
      } else if (hour >= 22 || hour <= 6) {
        // Increase availability during night hours
        modifiedSpot.capacity.available = Math.min(spot.capacity.total, Math.floor(spot.capacity.available * 1.5));
      }
    }
    
    // Simulate day-based availability
    if (simulateDay) {
      const day = simulateDay.toLowerCase();
      const isWeekend = day === 'saturday' || day === 'sunday';
      
      if (isWeekend) {
        // Reduce availability on weekends
        modifiedSpot.capacity.available = Math.max(0, Math.floor(spot.capacity.available * 0.5));
      }
    }
    
    return modifiedSpot;
  });
}

module.exports = router;
