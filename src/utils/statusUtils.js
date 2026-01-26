/**
 * Calculates the parking status based on current time, operating hours, and area category.
 * 
 * Status Rules:
 * 1. Likely Available: If the current time falls within the area's operatingHours.
 * 2. Limited / Busy: If the current time does NOT fall within operatingHours AND the area category is NOT hospital or office.
 * 3. Avoid / Closed: If the area category is hospital or office AND the current time is outside operatingHours.
 * 
 * @param {Object} area - The parking area object from API
 * @param {Date} currentTime - The current (or simulated) time
 * @returns {String} - 'available' | 'limited' | 'avoid'
 */
export const calculateStatus = (area, currentTime) => {
  // If no operating hours provided, assume available
  if (!area.operatingHours) return 'available';

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayName = dayNames[currentTime.getDay()];
  const dayHours = area.operatingHours[currentDayName];

  // Check if current time is within operating hours
  let isWithinOperatingHours = false;
  
  if (dayHours && Array.isArray(dayHours) && dayHours.length > 0) {
    const currentHHMM = currentTime.getHours().toString().padStart(2, '0') + ':' + 
                        currentTime.getMinutes().toString().padStart(2, '0');

    isWithinOperatingHours = dayHours.some(slot => {
      if (!slot.isOpen) return false;
      return currentHHMM >= slot.open && currentHHMM <= slot.close;
    });
  }

  // Get category and check if it's hospital or office
  const category = (area.category || '').toLowerCase();
  const isHospitalOrOffice = category.includes('hospital') || category.includes('office');

  // Apply status rules
  if (isWithinOperatingHours) {
    // Rule 1: Within operating hours = Likely Available
    return 'available';
  } else {
    // Outside operating hours
    if (isHospitalOrOffice) {
      // Rule 3: Hospital/Office + outside hours = Avoid / Closed
      return 'avoid';
    } else {
      // Rule 2: Other categories + outside hours = Limited / Busy
      return 'limited';
    }
  }
};
