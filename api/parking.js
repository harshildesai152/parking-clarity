import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Helper functions from your original backend
function isOpenAtTime(spot, day, time) {
  const dayKey = day.toLowerCase();
  const operatingHours = spot.operatingHours;
  
  if (!operatingHours || !operatingHours[dayKey] || operatingHours[dayKey].length === 0) {
    return false;
  }

  const currentTimeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
  
  return operatingHours[dayKey].some(slot => {
    if (!slot.isOpen) return false;
    
    const openMinutes = parseInt(slot.open.split(':')[0]) * 60 + parseInt(slot.open.split(':')[1]);
    const closeMinutes = parseInt(slot.close.split(':')[0]) * 60 + parseInt(slot.close.split(':')[1]);
    
    if (closeMinutes > openMinutes) {
      return currentTimeMinutes >= openMinutes && currentTimeMinutes <= closeMinutes;
    } else {
      return currentTimeMinutes >= openMinutes || currentTimeMinutes <= closeMinutes;
    }
  });
}

function isOpenOnDay(spot, day) {
  const dayKey = day.toLowerCase();
  const operatingHours = spot.operatingHours;
  
  if (!operatingHours || !operatingHours[dayKey] || operatingHours[dayKey].length === 0) {
    return false;
  }
  
  return operatingHours[dayKey].some(slot => slot.isOpen);
}

function simulateAvailability(parkingSpots, simulateTime, simulateDay) {
  if (!simulateTime && !simulateDay) {
    return parkingSpots;
  }

  return parkingSpots.filter(spot => {
    if (simulateDay && simulateTime) {
      return isOpenAtTime(spot, simulateDay, simulateTime);
    } else if (simulateDay) {
      return isOpenOnDay(spot, simulateDay);
    }
    return true;
  }).map(spot => {
    const capacity = spot.capacity || { total: 0, available: 0 };
    const total = capacity.total || 0;
    let available = capacity.available || 0;

    if (simulateTime && simulateDay) {
      const dayKey = simulateDay.toLowerCase();
      const operatingHours = spot.operatingHours?.[dayKey];
      
      if (operatingHours && operatingHours.length > 0) {
        const currentTimeMinutes = parseInt(simulateTime.split(':')[0]) * 60 + parseInt(simulateTime.split(':')[1]);
        const isPeakHour = currentTimeMinutes >= 8 * 60 && currentTimeMinutes <= 18 * 60;
        const isWeekend = ['saturday', 'sunday'].includes(simulateDay.toLowerCase());
        
        if (isPeakHour && !isWeekend) {
          available = Math.max(0, Math.floor(total * 0.2));
        } else if (!isPeakHour && !isWeekend) {
          available = Math.max(0, Math.floor(total * 0.6));
        } else {
          available = Math.max(0, Math.floor(total * 0.8));
        }
      }
    }

    return {
      ...spot,
      capacity: {
        total,
        available
      }
    };
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Distance in meters
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await client.connect();
    const database = client.db('parking-clarity');
    const collection = database.collection('parkings');
    
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const query = Object.fromEntries(searchParams);
    
    let parkingSpots = await collection.find({}).toArray();
    
    // Convert MongoDB documents to plain objects
    parkingSpots = parkingSpots.map(spot => {
      const obj = spot.toObject ? spot.toObject() : spot;
      return {
        ...obj,
        _id: obj._id ? obj._id.toString() : obj._id
      };
    });
    
    // Apply simulation filters
    const simulateTime = query.SIMULATE_TIME;
    const simulateDay = query.SIMULATE_DAY;
    
    if (simulateTime || simulateDay) {
      parkingSpots = simulateAvailability(parkingSpots, simulateTime, simulateDay);
    }
    
    // Apply other filters
    if (query.search) {
      parkingSpots = parkingSpots.filter(spot => 
        spot.name.toLowerCase().includes(query.search.toLowerCase()) ||
        (spot.category && spot.category.toLowerCase().includes(query.search.toLowerCase()))
      );
    }
    
    if (query.category) {
      const categories = query.category.split(',');
      parkingSpots = parkingSpots.filter(spot => 
        categories.includes(spot.category)
      );
    }
    
    if (query.vehicleType) {
      const vehicleTypes = query.vehicleType.split(',');
      parkingSpots = parkingSpots.filter(spot => 
        spot.vehicleTypes && spot.vehicleTypes.some(v => vehicleTypes.includes(v))
      );
    }
    
    if (query.parkingType) {
      const parkingTypes = query.parkingType.split(',');
      parkingSpots = parkingSpots.filter(spot => 
        parkingTypes.includes(spot.parkingType)
      );
    }
    
    if (query.minDuration) {
      const minDuration = parseInt(query.minDuration);
      parkingSpots = parkingSpots.filter(spot => 
        !spot.maxDuration || spot.maxDuration >= minDuration
      );
    }
    
    if (query.available) {
      const isAvailable = query.available === 'true';
      parkingSpots = parkingSpots.filter(spot => {
        const available = spot.capacity?.available || 0;
        return isAvailable ? available > 0 : available === 0;
      });
    }
    
    if (query.lat && query.lng && query.radius) {
      const lat = parseFloat(query.lat);
      const lng = parseFloat(query.lng);
      const radius = parseFloat(query.radius);
      
      parkingSpots = parkingSpots.map(spot => {
        if (spot.coordinates && spot.coordinates.length === 2) {
          const distance = calculateDistance(lat, lng, spot.coordinates[0], spot.coordinates[1]);
          return { ...spot, distance };
        }
        return spot;
      }).filter(spot => spot.distance <= radius);
    }
    
    res.status(200).json({
      success: true,
      data: parkingSpots
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  } finally {
    await client.close();
  }
}
