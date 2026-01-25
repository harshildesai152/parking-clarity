/**
 * Calculates the parking status based on current time, operating hours, and area category.
 * 
 * Rules:
 * 1. Likely Available: Current time falls within operatingHours.
 * 2. Limited / Busy: Outside operatingHours AND category NOT hospital/office.
 * 3. Avoid / Closed: Outside operatingHours AND category IS hospital/office.
 * 
 * @param {Object} area - The parking area object from API
 * @param {Date} currentTime - The current (or simulated) time
 * @returns {String} - 'available' | 'limited' | 'avoid'
 */
export const calculateStatus = (area, currentTime) => {
  if (!area.operatingHours) return 'available'; // Fallback if no hours info

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayName = dayNames[currentTime.getDay()];
  const dayHours = area.operatingHours[currentDayName];

  if (!dayHours || !Array.isArray(dayHours) || dayHours.length === 0) {
    return determineStatusByRules(area, false);
  }

  const currentHHMM = currentTime.getHours().toString().padStart(2, '0') + ':' + 
                      currentTime.getMinutes().toString().padStart(2, '0');

  const isOpenNow = dayHours.some(slot => {
    if (!slot.isOpen) return false;
    return currentHHMM >= slot.open && currentHHMM <= slot.close;
  });

  return determineStatusByRules(area, isOpenNow);
};

const determineStatusByRules = (area, isOpenNow) => {
  const category = (area.category || '').toLowerCase();
  const isHospitalOrOffice = category.includes('hospital') || category.includes('office');

  if (isOpenNow) {
    return 'available';
  } else {
    return isHospitalOrOffice ? 'avoid' : 'limited';
  }
};
