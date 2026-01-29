import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { useFavorites } from '../contexts/FavoritesContext'
import { useReports } from '../contexts/ReportsContext'
import { useAuth } from '../contexts/AuthContext'
import { calculateStatus } from '../utils/statusUtils'
import { calculateDistance, formatDistance } from '../utils/distanceUtils'
import { useGeolocation } from '../hooks/useGeolocation'
import LoginModal from './LoginModal'



// Helper function to format time ago
const getTimeAgo = (lastUpdated) => {
  if (!lastUpdated) return 'Unknown';
  const diffInMins = Math.floor((Date.now() - new Date(lastUpdated)) / 60000);
  
  if (diffInMins < 60) {
    return `${diffInMins} min ago`;
  }
  
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};

const ParkingList = ({ 
  parkingData = [],
  isLoading = false,
  selectedArea, 
  setSelectedArea, 
  currentTime, 
  fullWidth = false, 
  onAreaSelect,
  selectedCategories = [],
  selectedVehicleTypes = [],
  selectedParkingTypes = [],
  parkingDuration = '',
  filterByAvailability = null,
  clearAllFilters,
  searchQuery = '',
  setSearchQuery,
  showAllData = false, // New prop to show all data without filters
  showOnlyReported = false, // New prop to show only reported spots
  searchRadius = 'all', // New prop for radius filter
  refreshData, // Added refresh callback
  navigate, // Added navigate prop
  activeLocation = null // New prop for active location from MapView
}) => {
  const { location: userGeolocation } = useGeolocation()
  // Normalize parking data to match UI expectations
  const normalizedParkingData = useMemo(() => {
    return parkingData
      .filter(area => {
        // Filter out areas with invalid or missing coordinates
        if (area.location && area.location.lat && area.location.lng) {
          return true;
        }
        if (area.coordinates && Array.isArray(area.coordinates) && area.coordinates.length === 2) {
          return true;
        }
        return false;
      })
      .map(area => ({
        ...area,
        id: area._id || area.id,
        coordinates: area.location ? [area.location.lat, area.location.lng] : area.coordinates,
        // Use Set to ensure unique vehicle types (e.g., if both 'bike' and 'motorcycle' exist)
        vehicleTypes: [...new Set((area.vehicleTypes || []).map(v => v === 'bike' ? 'motorcycle' : v))],
        status: calculateStatus(area, currentTime),
        // Ensure all required fields exist
        distance: area.distance || 0,
        // Keep operatingHours as object, don't convert to string
        operatingHours: area.operatingHours || {}
      }))
  }, [parkingData, currentTime])

  const [availabilityModal, setAvailabilityModal] = useState(null)
  const [reportModal, setReportModal] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [reportTime, setReportTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }))
  const [reportDuration, setReportDuration] = useState('')
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [pendingReportArea, setPendingReportArea] = useState(null)
  
  const { toggleFavorite, isFavorite } = useFavorites()
  const { addReport } = useReports()
  const { isAuthenticated, token, logout } = useAuth()
  const { location: userLocation, error: locationError, loading: locationLoading } = useGeolocation()

  // Calculate distances and apply radius filter using useMemo to avoid infinite re-render loop
  // This replaces the useEffect and useState(parkingWithDistance) combo
  const parkingWithDistance = useMemo(() => {
    let results = normalizedParkingData;
    
    // Use activeLocation from MapView if available, otherwise fall back to live geolocation or default location
    const currentLocation = activeLocation 
      ? { lat: activeLocation[0], lng: activeLocation[1] }
      : userGeolocation 
      ? { lat: userGeolocation.lat, lng: userGeolocation.lng }
      : { lat: 21.2000, lng: 72.8400 }; // Default: Surat city center
    
    if (currentLocation && normalizedParkingData.length > 0) {
      results = normalizedParkingData.map(area => {
        let areaLat, areaLng;
        if (area.coordinates && Array.isArray(area.coordinates) && area.coordinates.length === 2) {
          [areaLat, areaLng] = area.coordinates;
        } else if (area.location && area.location.lat && area.location.lng) {
          areaLat = area.location.lat;
          areaLng = area.location.lng;
        } else {
          return area;
        }

        const distance = calculateDistance(currentLocation.lat, currentLocation.lng, areaLat, areaLng);
        
        return {
          ...area,
          distance: distance
        };
      });

      // Apply radius filter if not 'all'
      if (searchRadius !== 'all' && currentLocation) {
        const radiusInKm = parseInt(searchRadius) / 1000;
        results = results.filter(area => area.distance <= radiusInKm);
      }

      // Sort by distance
      results = [...results].sort((a, b) => a.distance - b.distance);
    }
    
    return results;
  }, [activeLocation, userGeolocation, normalizedParkingData, searchRadius]);

  const handleCardClick = (parkingArea) => {
    if (fullWidth) {
      // In fullWidth mode, show availability details modal
      setAvailabilityModal(parkingArea)
    } else {
      // In sidebar mode, select for map
      setSelectedArea(parkingArea)
      // Close mobile menu if callback provided
      if (onAreaSelect) {
        onAreaSelect()
      }
    }
  }

  const openDetailsModal = (parkingArea) => {
    setAvailabilityModal(parkingArea)
  }

  const closeAvailabilityModal = () => {
    setAvailabilityModal(null)
  }

  const handleShowRoute = () => {
    if (availabilityModal) {
      setSelectedArea(availabilityModal)
      setAvailabilityModal(null)
    }
  }

  const handleMapClick = (parkingArea) => {
    // Set the selected area
    setSelectedArea(parkingArea)
    
    // Navigate to map view
    navigate('/')
    
    // Switch to map tab in mobile view by updating URL hash or state
    setTimeout(() => {
      // Try to find and click the map tab button
      const mapTabButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Map') || btn.getAttribute('data-tab') === 'map'
      )
      if (mapTabButton) {
        mapTabButton.click()
      }
    }, 100)
  }

  const openReportModal = (parkingArea) => {
    if (!isAuthenticated) {
      setPendingReportArea(parkingArea)
      setIsLoginModalOpen(true)
      return
    }
    setReportModal(parkingArea)
    setReportReason('')
    setReportTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }))
    setReportDuration('')
  }

  const closeReportModal = () => {
    setReportModal(null)
    setReportReason('')
    setReportTime('')
    setReportDuration('')
  }

  const handleSubmitReport = async () => {
    if (reportModal && reportReason.trim()) {
      try {
        const reportData = {
          parking_id: reportModal.id,
          report_reason: reportReason,
          report_timing: reportTime,
          report_duration: reportDuration,
          token: token // Use token from auth context as requested
        }

        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData),
        });

        if (response.ok) {
          const result = await response.json();
          // Add report to local context for immediate UI update
          addReport({
            parkingArea: reportModal.name,
            reason: reportReason,
            time: reportTime,
            duration: reportDuration,
            reportedBy: 'Me'
          });
          
          toast.success('Report submitted successfully! Thank you for helping the community.');
          closeReportModal();
          
          // Trigger re-fetch of parking data to show updated counts
          if (refreshData) refreshData();
        } else if (response.status === 401) {
          // Handle invalid token - remove token and redirect to login
          logout();
          toast.error('Session expired. Please login again.');
          closeReportModal();
          setIsLoginModalOpen(true);
        } else {
          const errorData = await response.json();
          toast.error(`Error: ${errorData.error || 'Failed to submit report'}`);
        }
      } catch (error) {
        console.error('Error submitting report:', error);
        toast.error('Network error. Please try again.');
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'limited':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'avoid':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'LIKELY AVAILABLE'
      case 'limited':
        return 'LIMITED / BUSY'
      case 'avoid':
        return 'AVOID RIGHT NOW'
      default:
        return 'UNKNOWN'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'limited':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'avoid':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
    }
  }

  // Filter parking data
  let filteredData = parkingWithDistance.filter(area => {
    // 1. Show only reported spots if requested (Highest priority filter)
    if (showOnlyReported && (!area.reports || area.reports.count === 0)) {
      return false
    }

    // If showAllData is true, we skip other filters
    if (showAllData) return true;

    // 2. Category filter
    const uiCategory = area.category ? area.category.charAt(0).toUpperCase() + area.category.slice(1) : ''
    if (selectedCategories.length > 0 && !selectedCategories.includes(uiCategory) && !selectedCategories.includes(area.category)) {
      return false
    }

    // Vehicle type filter
    if (selectedVehicleTypes.length > 0 && (!area.vehicleTypes || !selectedVehicleTypes.some(type => area.vehicleTypes.includes(type)))) {
      return false
    }

    // Parking type filter
    if (selectedParkingTypes.length > 0 && !selectedParkingTypes.includes(area.parkingType)) {
      return false
    }

    // Duration filter
    if (parkingDuration && area.maxDuration && parseInt(parkingDuration) > area.maxDuration) {
      return false
    }

    // Availability filter
    if (filterByAvailability) {
      const isAvailable = area.status === 'available'
      if (filterByAvailability === 'available' && !isAvailable) {
        return false
      }
      if (filterByAvailability === 'unavailable' && isAvailable) {
        return false
      }
    }

    return true
  })

  return (
    <>
      {/* Location Error Alert */}
      {locationError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-yellow-800">{locationError}</span>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading parking data...</span>
        </div>
      )}
      <div className={fullWidth ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'space-y-3'}>
        {filteredData.map((area) => (
          <div
            key={area.id}
            onClick={() => handleCardClick(area)}
            className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedArea?.id === area.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200'
            } ${fullWidth ? 'w-full' : ''}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{area.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">{area.category}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500">{formatDistance(area.distance)}</span>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getStatusColor(area.status)}`}>
                {getStatusIcon(area.status)}
                {getStatusText(area.status)}
              </div>
            </div>

            {area.description && (
              <p className="text-sm text-gray-600 mb-3">{area.description}</p>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600">Operating: {area.operatingHours && typeof area.operatingHours === 'object' ? 'Daily hours available' : 'N/A'}</span>
              </div>

              {area.capacity && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="text-gray-600">
                    Capacity: {area.capacity?.total || Object.values(area.capacity || {}).reduce((sum, val) => {
                      if (typeof val === 'number') return sum + val;
                      if (val && typeof val.total === 'number') return sum + val.total;
                      return sum;
                    }, 0)} spots
                    {area.vehicleTypes && area.vehicleTypes.length > 0 && (
                      <span className="text-xs ml-1">
                        ({area.vehicleTypes.map(type => {
                          const capacityInfo = area.capacity[type];
                          return capacityInfo && typeof capacityInfo === 'object' 
                            ? `${type}: ${capacityInfo.available ?? capacityInfo.total ?? 0}`
                            : type;
                        }).join(', ')})
                      </span>
                    )}
                  </span>
                </div>
              )}

              {area.rules && area.rules.length > 0 && (
                <div className="space-y-1">
                  {area.rules.map((rule, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">{rule}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Report Full Button */}
            {area.reports && area.reports.count > 0 && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-700 font-medium">
                    🚨 {area.reports.count} users reported parking is full
                  </span>
                  <span className="text-xs text-red-500">
                    {getTimeAgo(area.reports.lastUpdated)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(area);
                }}
                className={`flex-1 px-2 py-2 text-xs font-medium rounded-lg transition-colors min-h-[36px] flex items-center justify-center gap-1 ${
                  isFavorite(area.id)
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span className="text-sm">{isFavorite(area.id) ? '⭐' : '☆'}</span>
                {isFavorite(area.id) ? 'Favorited' : 'Favorite'}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openReportModal(area);
                }}
                className="flex-1 px-2 py-2 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors min-h-[36px] flex items-center justify-center gap-1"
              >
                <span className="text-sm">🚨</span>
                Report Full
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDetailsModal(area);
                }}
                className="flex-1 px-2 py-2 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors min-h-[36px] flex items-center justify-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Details
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMapClick(area);
                }}
                className="px-3 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors min-h-[36px] flex items-center justify-center"
                title="View on Map"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Availability Details Modal */}
      {availabilityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <AvailabilityDetailModal
              parkingArea={availabilityModal}
              onClose={closeAvailabilityModal}
            />
          </div>
        </div>
      )}

      {/* Report Full Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900">Report Parking Full</h2>
                <button
                  onClick={closeReportModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🚨</span>
                    <div>
                      <h3 className="font-semibold text-red-800">{reportModal.name}</h3>
                      <p className="text-sm text-red-600">Report this parking area as full</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Report Reason *
                    </label>
                    <textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Describe why you're reporting this parking as full..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      rows="3"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time Observed
                      </label>
                      <input
                        type="time"
                        value={reportTime}
                        onChange={(e) => setReportTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (optional)
                      </label>
                      <input
                        type="text"
                        value={reportDuration}
                        onChange={(e) => setReportDuration(e.target.value)}
                        placeholder="e.g., 30 min, 1 hour"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Why report?</p>
                        <p>Your reports help other users avoid full parking areas and save time. Reports are shared with the community in real-time.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSubmitReport}
                  disabled={!reportReason.trim()}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Submit Report
                </button>
                <button
                  onClick={closeReportModal}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal for Authentication */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => {
          setIsLoginModalOpen(false);
          setPendingReportArea(null);
        }} 
        onSuccess={() => {
          if (pendingReportArea) {
            setReportModal(pendingReportArea);
            setPendingReportArea(null);
          }
        }}
      />
    </>
  )
}

// Availability Detail Modal Component
const AvailabilityDetailModal = ({ parkingArea, onClose }) => {
  // Helper function to format time from 24-hour to 12-hour format
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get current day
  const getCurrentDay = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  const currentDay = getCurrentDay();

  const daysOfWeek = [
    { key: 'sunday', name: 'Sun', shortName: 'S' },
    { key: 'monday', name: 'Mon', shortName: 'M' },
    { key: 'tuesday', name: 'Tue', shortName: 'T' },
    { key: 'wednesday', name: 'Wed', shortName: 'W' },
    { key: 'thursday', name: 'Thu', shortName: 'T' },
    { key: 'friday', name: 'Fri', shortName: 'F' },
    { key: 'saturday', name: 'Sat', shortName: 'S' }
  ]

  // Calculate weekly statistics
  const weeklyStats = daysOfWeek.reduce((stats, day) => {
    const dayData = parkingArea.dayWiseAvailability?.[day.key] || { status: 'available', isFestival: false }
    if (dayData.status === 'parked') {
      stats.parkedDays++
      // Parse duration like "4h 15m" to minutes
      if (dayData.duration) {
        const durationMatch = dayData.duration.match(/(\d+)h\s*(\d+)m/)
        if (durationMatch) {
          const hours = parseInt(durationMatch[1])
          const minutes = parseInt(durationMatch[2])
          stats.totalParkingTime += (hours * 60) + minutes
        }
      }
    }
    if (dayData.isFestival) {
      stats.festivalDays++
    }
    return stats
  }, { parkedDays: 0, totalParkingTime: 0, festivalDays: 0 })

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'parked':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
      case 'not_parked':
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg'
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'parked':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'not_parked':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Availability Details</h2>
                  <p className="text-blue-100">{parkingArea.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-blue-100">
                <span>{parkingArea.category}</span>
                <span>•</span>
                <span>{formatDistance(parkingArea.distance)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-250px)]">
          {/* Parking Information */}
          <div className="bg-gray-50 p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Parking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Basic Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">{parkingArea.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium text-gray-900">{parkingArea.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-medium text-gray-900">{formatDistance(parkingArea.distance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Operating Hours:</span>
                    <span className="font-medium text-gray-900">{parkingArea.operatingHours && typeof parkingArea.operatingHours === 'object' ? 'View daily hours' : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Duration:</span>
                    <span className="font-medium text-gray-900">{parkingArea.maxDuration} minutes</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Capacity Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                  
                  </div>
                  <div className="flex justify-between bg-blue-50 p-2 rounded-md mt-1">
                    <span className="text-blue-800 font-semibold">Total Available:</span>
                    <span className="font-bold text-green-600">
                      {parkingArea.vehicleTypes?.reduce((sum, type) => {
                        const cap = parkingArea.capacity?.[type];
                        if (cap && typeof cap === 'object') {
                          return sum + (typeof cap.available === 'number' ? cap.available : 0);
                        }
                        return sum;
                      }, 0)} spots
                    </span>
                  </div>
                  {parkingArea.vehicleTypes?.map(vehicleType => {
                    const capacityInfo = parkingArea.capacity?.[vehicleType];
                    if (!capacityInfo || typeof capacityInfo !== 'object') return null;

                    const vehicleIcons = {
                      car: '🚗',
                      motorcycle: '🏍️',
                      bicycle: '🚲',
                      truck: '🚛',
                      ev: '⚡'
                    };

                    return (
                      <div key={vehicleType} className="flex justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          <span>{vehicleIcons[vehicleType] || '🚗'}</span>
                          {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}:
                        </span>
                        <span className="font-medium text-gray-900">{capacityInfo.available ?? 0} available <span className="text-gray-400 font-normal">/ {capacityInfo.total ?? 0} total</span></span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {parkingArea.description && (
              <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{parkingArea.description}</p>
              </div>
            )}

            {parkingArea.rules && parkingArea.rules.length > 0 && (
              <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Parking Rules</h4>
                <div className="space-y-2">
                  {parkingArea.rules.map((rule, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Weekly Statistics */}
          {/* <div className="bg-blue-50 p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Overview</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{weeklyStats.parkedDays}</div>
                <div className="text-sm text-gray-600">Days Parked</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-green-600">{formatDuration(weeklyStats.totalParkingTime)}</div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-orange-600">{weeklyStats.festivalDays}</div>
                <div className="text-sm text-gray-600">Festival Days</div>
              </div>
            </div>
          </div> */}

          {/* Day-wise Availability */}
          <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Daily Availability
              </h3>
              <div className="text-sm text-gray-500">
                {weeklyStats.festivalDays > 0 && (
                  <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                    🎉 {weeklyStats.festivalDays} Festival{weeklyStats.festivalDays > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid gap-4">
              {daysOfWeek.map((day, index) => {
                const dayData = parkingArea.dayWiseAvailability?.[day.key] || { status: 'available', isFestival: false }
                const isWeekend = day.key === 'saturday' || day.key === 'sunday';
                
                return (
                  <div key={day.key} className={`relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                    dayData.isFestival
                      ? 'bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 border-yellow-300 shadow-md'
                      : isWeekend
                      ? 'bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-purple-200'
                      : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                    {/* Decorative corner accent */}
                    <div className={`absolute top-0 left-0 w-20 h-20 ${
                      dayData.isFestival
                        ? 'bg-gradient-to-br from-yellow-200 to-orange-200'
                        : isWeekend
                        ? 'bg-gradient-to-br from-purple-200 to-pink-200'
                        : 'bg-gradient-to-br from-blue-100 to-cyan-100'
                    } opacity-30 rounded-full -translate-x-10 -translate-y-10`}></div>
                    
                    <div className="relative p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Enhanced Day indicator */}
                          <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg transform transition-transform ${
                            dayData.status === 'parked' ? 'bg-gradient-to-br from-green-500 to-green-600 scale-110' : 
                            isWeekend ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                            'bg-gradient-to-br from-blue-500 to-cyan-500'
                          }`}>
                            {day.shortName}
                            {dayData.isFestival && (
                              <span className="absolute -top-1 -right-1 text-xs">🎉</span>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-gray-900 text-lg">{day.name}</h4>
                              {day.key === currentDay && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md">
                                  Today
                                </span>
                              )}
                              {isWeekend && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                  Weekend
                                </span>
                              )}
                            </div>
                            
                            {/* Enhanced Operating Hours */}
                            <div className="mt-2">
                              {(() => {
                                const dayHours = parkingArea.operatingHours?.[day.key] || [];
                                
                                if (dayHours.length === 0) {
                                  return (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="text-sm text-gray-500 font-medium">No hours set</span>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div className="flex flex-wrap gap-2">
                                    {dayHours.map((slot, index) => (
                                      <div key={index} className="group relative">
                                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {formatTime(slot.open)} - {formatTime(slot.close)}
                                        </span>
                                        {/* Tooltip on hover */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                                          {slot.isOpen ? 'Open' : 'Closed'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                            
                            {dayData.isFestival && (
                              <div className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-1.5 rounded-full border border-yellow-300">
                                <span className="text-lg">🎉</span>
                                <span className="text-sm font-semibold text-orange-800">{dayData.festivalName}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                            dayData.status === 'parked' 
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                          }`}>
                            {getStatusIcon(dayData.status)}
                            {dayData.status === 'parked' ? 'Parked' : 'Available'}
                          </div>

                          {dayData.status === 'parked' && (
                            <div className="mt-3 text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-1 font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {dayData.startTime} - {dayData.endTime}
                              </div>
                              <div className="text-gray-500">{dayData.duration}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Festival Information */}
          {parkingArea.festivalAvailability && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-t border-yellow-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-2xl">🎊</span>
                Festival Special Hours
              </h3>
              <div className="grid gap-3">
                {Object.entries(parkingArea.festivalAvailability).map(([festival, info]) => (
                  <div key={festival} className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {festival === 'diwali' ? '🪔' : festival === 'holi' ? '🎨' : '🎄'}
                        </span>
                        <div>
                          <h4 className="font-semibold text-gray-900 capitalize">{festival}</h4>
                          {info.hours && <p className="text-sm text-gray-600">Hours: {info.hours}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          info.available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {info.available ? 'Available' : 'Closed'}
                        </div>
                        {info.note && (
                          <p className="text-xs text-gray-500 mt-1 max-w-48">{info.note}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors shadow-sm"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}

export default ParkingList
