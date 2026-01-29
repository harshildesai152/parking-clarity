/**
 * Fetch route between two points using OSRM routing service
 * @param {Array} start - [latitude, longitude] of start point
 * @param {Array} end - [latitude, longitude] of end point
 * @returns {Promise<Object>} - Object containing route coordinates and info
 */
export const fetchRoute = async (start, end) => {
  if (!start || !end || !Array.isArray(start) || !Array.isArray(end) || start.length < 2 || end.length < 2) {
    console.warn('Invalid coordinates provided to fetchRoute', { start, end });
    return null;
  }

  try {
    // OSRM API - Free OpenStreetMap routing service
    // OSRM expects [lng, lat] order
    const routeUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;
    
    const response = await fetch(routeUrl);
    if (!response.ok) {
      throw new Error('Route calculation failed');
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
      
      return {
        coordinates,
        distance: route.distance, // meters
        duration: route.duration, // seconds
        summary: route.legs && route.legs[0] ? route.legs[0].summary : ''
      };
    } else {
      throw new Error('No route found');
    }
  } catch (error) {
    console.error('Error fetching route:', error);
    // Fallback to straight line if routing fails
    return {
      coordinates: [start, end],
      distance: null,
      duration: null,
      error: error.message
    };
  }
};
