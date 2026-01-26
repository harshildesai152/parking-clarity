const dbConnect = require('./db');
const Parking = require('./models/Parking');

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  if (method === 'GET') {
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
        const categories = category.split(',').map(cat => cat.trim().toLowerCase());
        query.category = { $in: categories };
      }

      // Filter by vehicle type
      if (vehicleType) {
        const vehicleTypes = vehicleType.split(',').map(type => type.trim());
        query.vehicleTypes = { $in: vehicleTypes };
      }

      // Filter by parking type
      if (parkingType) {
        const parkingTypes = parkingType.split(',').map(type => type.trim());
        query.parkingType = { $in: parkingTypes };
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

        const latRange = searchRadius / 111320; 
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

        if (query.$or) {
          query.$or = query.$or.map(condition => ({
            $and: [condition, locationCondition]
          }));
        } else {
          query = { ...query, ...locationCondition };
        }
      }

      parkingQuery = parkingQuery.limit(parseInt(limit));
      const parkingSpots = await parkingQuery.exec();

      let result = parkingSpots.map(spot => {
        const spotObj = spot.toObject();
        return {
          ...spotObj,
          reports: {
            count: spotObj.reportCount || 0,
            lastUpdated: spotObj.updatedAt
          }
        };
      });

      if (lat && lng) {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        result = result.map(spot => {
          const distance = calculateDistance(userLat, userLng, spot.location.lat, spot.location.lng);
          spot.distance = Math.round(distance);
          return spot;
        });
        result.sort((a, b) => a.distance - b.distance);
      }

      if (SIMULATE_TIME || SIMULATE_DAY) {
        result = simulateAvailability(result, SIMULATE_TIME, SIMULATE_DAY);
      }

      return res.status(200).json({
        data: result,
        count: result.length,
        query: req.query
      });

    } catch (error) {
      console.error('Error fetching parking spots:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; 
}

function simulateAvailability(parkingSpots, simulateTime, simulateDay) {
  if (!simulateTime && !simulateDay) return parkingSpots;

  return parkingSpots.filter(spot => {
    if (simulateDay && simulateTime) {
      return isOpenAtTime(spot, simulateDay, simulateTime);
    } else if (simulateDay) {
      return isOpenOnDay(spot, simulateDay);
    }
    return true;
  }).map(spot => {
    const modifiedSpot = { ...spot };
    if (simulateTime) {
      const hour = parseInt(simulateTime.split(':')[0]);
      const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);
      if (isPeakHour) {
        if (modifiedSpot.capacity.car) modifiedSpot.capacity.car.available = Math.max(0, Math.floor(modifiedSpot.capacity.car.available * 0.3));
        if (modifiedSpot.capacity.motorcycle) modifiedSpot.capacity.motorcycle.available = Math.max(0, Math.floor(modifiedSpot.capacity.motorcycle.available * 0.3));
        if (modifiedSpot.capacity.truck) modifiedSpot.capacity.truck.available = Math.max(0, Math.floor(modifiedSpot.capacity.truck.available * 0.3));
      } else if (hour >= 22 || hour <= 6) {
        if (modifiedSpot.capacity.car) modifiedSpot.capacity.car.available = Math.min(modifiedSpot.capacity.car.total, Math.floor(modifiedSpot.capacity.car.available * 1.5));
        if (modifiedSpot.capacity.motorcycle) modifiedSpot.capacity.motorcycle.available = Math.min(modifiedSpot.capacity.motorcycle.total, Math.floor(modifiedSpot.capacity.motorcycle.available * 1.5));
        if (modifiedSpot.capacity.truck) modifiedSpot.capacity.truck.available = Math.min(modifiedSpot.capacity.truck.total, Math.floor(modifiedSpot.capacity.truck.available * 1.5));
      }
    }
    if (simulateDay) {
      const day = simulateDay.toLowerCase();
      const isWeekend = day === 'saturday' || day === 'sunday';
      if (isWeekend) {
        if (modifiedSpot.capacity.car) modifiedSpot.capacity.car.available = Math.max(0, Math.floor(modifiedSpot.capacity.car.available * 0.5));
        if (modifiedSpot.capacity.motorcycle) modifiedSpot.capacity.motorcycle.available = Math.max(0, Math.floor(modifiedSpot.capacity.motorcycle.available * 0.5));
        if (modifiedSpot.capacity.truck) modifiedSpot.capacity.truck.available = Math.max(0, Math.floor(modifiedSpot.capacity.truck.available * 0.5));
      }
    }
    return modifiedSpot;
  });
}

function isOpenAtTime(spot, day, time) {
  const dayKey = day.toLowerCase();
  const operatingHours = spot.operatingHours;
  if (!operatingHours || !operatingHours[dayKey] || operatingHours[dayKey].length === 0) return false;
  const [targetHour, targetMinute] = time.split(':').map(Number);
  const targetTimeInMinutes = targetHour * 60 + targetMinute;
  return operatingHours[dayKey].some(slot => {
    if (!slot.isOpen || !slot.open || !slot.close) return false;
    const [openHour, openMinute] = slot.open.split(':').map(Number);
    const [closeHour, closeMinute] = slot.close.split(':').map(Number);
    const openInMins = openHour * 60 + openMinute;
    const closeInMins = closeHour * 60 + closeMinute;
    if (closeInMins < openInMins) return targetTimeInMinutes >= openInMins || targetTimeInMinutes <= closeInMins;
    return targetTimeInMinutes >= openInMins && targetTimeInMinutes <= closeInMins;
  });
}

function isOpenOnDay(spot, day) {
  const dayKey = day.toLowerCase();
  const operatingHours = spot.operatingHours;
  if (!operatingHours || !operatingHours[dayKey] || operatingHours[dayKey].length === 0) return false;
  return operatingHours[dayKey].some(slot => slot.isOpen);
}
