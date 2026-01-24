import { useState } from 'react'

const ParkingDetailModal = ({ parkingArea, onClose, onShowRoute }) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{parkingArea.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{parkingArea.category}</span>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-500">{parkingArea.distance} km away</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium mb-4 border ${getStatusColor(parkingArea.status)}`}>
            {getStatusIcon(parkingArea.status)}
            {getStatusText(parkingArea.status)}
          </div>

          {parkingArea.description && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600">{parkingArea.description}</p>
            </div>
          )}

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Operating Hours</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {parkingArea.operatingHours}
            </div>
          </div>

          {parkingArea.capacity && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Parking Capacity</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="font-medium">Total Capacity: {parkingArea.capacity.total || Object.values(parkingArea.capacity).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0)} spots</span>
                </div>
                {parkingArea.vehicleTypes && parkingArea.vehicleTypes.map(vehicleType => {
                  const count = parkingArea.capacity[vehicleType];
                  if (!count) return null;

                  const vehicleIcons = {
                    car: '🚗',
                    motorcycle: '🏍️',
                    bicycle: '🚲',
                    truck: '🚛',
                    ev: '⚡'
                  };

                  return (
                    <div key={vehicleType} className="flex items-center gap-2 text-sm text-gray-600 ml-6">
                      <span className="text-lg">{vehicleIcons[vehicleType] || '🚗'}</span>
                      <span>{vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}: {count} spots</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {parkingArea.rules && parkingArea.rules.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Parking Rules</h3>
              <div className="space-y-2">
                {parkingArea.rules.map((rule, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-600">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onShowRoute}
              className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors min-h-[44px]"
            >
              Show Route
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors min-h-[44px]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const staticParkingData = [
  {
    id: 1,
    name: 'Diamond Hospital Varachha',
    category: 'Hospital',
    vehicleTypes: ['car', 'motorcycle'],
    capacity: { car: 25, motorcycle: 15, total: 40 },
    distance: 1.7,
    description: 'Busy hospital zone in the heart of the diamond district. High vehicle turnover.',
    status: 'avoid',
    operatingHours: '0:00 - 23:00',
    maxDuration: 120, // minutes
    dayWiseAvailability: {
      sunday: {
        status: 'parked',
        startTime: '08:30',
        endTime: '12:45',
        duration: '4h 15m',
        isFestival: false
      },
      monday: {
        status: 'not_parked',
        startTime: null,
        endTime: null,
        duration: null,
        isFestival: false
      },
      tuesday: {
        status: 'parked',
        startTime: '09:15',
        endTime: '17:30',
        duration: '8h 15m',
        isFestival: false
      },
      wednesday: {
        status: 'parked',
        startTime: '10:00',
        endTime: '14:20',
        duration: '4h 20m',
        isFestival: false
      },
      thursday: {
        status: 'not_parked',
        startTime: null,
        endTime: null,
        duration: null,
        isFestival: true,
        festivalName: 'Diwali',
        festivalAvailable: false
      },
      friday: {
        status: 'parked',
        startTime: '11:30',
        endTime: '16:45',
        duration: '5h 15m',
        isFestival: false
      },
      saturday: {
        status: 'parked',
        startTime: '07:00',
        endTime: '19:30',
        duration: '12h 30m',
        isFestival: false
      }
    },
    festivalAvailability: {
      diwali: { available: false, note: 'Closed during Diwali festival' },
      holi: { available: true, hours: '8:00-18:00', note: 'Limited hours during Holi' },
      christmas: { available: true, hours: '9:00-17:00', note: 'Normal operation' }
    },
    rules: [
      'Strictly for patients/visitors',
      'No long-term parking'
    ],
    coordinates: [21.2054, 72.8422]
  },
  {
    id: 2,
    name: 'Surat Railway Station Market',
    category: 'Market',
    vehicleTypes: ['motorcycle', 'bicycle'],
    capacity: { motorcycle: 50, bicycle: 30, total: 80 },
    distance: 2.9,
    description: 'Bustling market area near the railway station with high foot traffic.',
    status: 'avoid',
    operatingHours: '6:00 - 22:00',
    maxDuration: 60,
    dayWiseAvailability: {
      sunday: {
        status: 'parked',
        startTime: '08:30',
        endTime: '12:45',
        duration: '4h 15m',
        isFestival: false
      },
      monday: {
        status: 'parked',
        startTime: '07:00',
        endTime: '14:30',
        duration: '7h 30m',
        isFestival: false
      },
      tuesday: {
        status: 'not_parked',
        startTime: null,
        endTime: null,
        duration: null,
        isFestival: false
      },
      wednesday: {
        status: 'parked',
        startTime: '09:15',
        endTime: '16:45',
        duration: '7h 30m',
        isFestival: false
      },
      thursday: {
        status: 'parked',
        startTime: '08:00',
        endTime: '18:30',
        duration: '10h 30m',
        isFestival: true,
        festivalName: 'Diwali',
        festivalAvailable: true
      },
      friday: {
        status: 'parked',
        startTime: '06:30',
        endTime: '21:00',
        duration: '14h 30m',
        isFestival: false
      },
      saturday: {
        status: 'parked',
        startTime: '07:30',
        endTime: '22:15',
        duration: '14h 45m',
        isFestival: false
      }
    },
    festivalAvailability: {
      diwali: { available: true, hours: '8:00-20:00', note: 'Extended hours during Diwali shopping' },
      holi: { available: false, note: 'Closed during Holi festival' },
      christmas: { available: true, hours: '7:00-21:00', note: 'Holiday shopping hours' }
    },
    rules: [
      'Paid parking',
      '2-wheeler separate area'
    ],
    coordinates: [21.1954, 72.8322]
  },
  {
    id: 3,
    name: 'City Center Mall',
    category: 'Shopping Mall',
    vehicleTypes: ['car', 'motorcycle', 'truck'],
    capacity: { car: 150, motorcycle: 75, truck: 10, total: 235 },
    distance: 3.2,
    description: 'Modern shopping complex with multiple retail outlets and food court.',
    status: 'limited',
    operatingHours: '10:00 - 23:00',
    maxDuration: 480, // 8 hours
    dayWiseAvailability: {
      sunday: {
        status: 'parked',
        startTime: '13:20',
        endTime: '18:45',
        duration: '5h 25m',
        isFestival: false
      },
      monday: {
        status: 'parked',
        startTime: '08:00',
        endTime: '12:00',
        duration: '4h 0m',
        isFestival: false
      },
      tuesday: {
        status: 'not_parked',
        startTime: null,
        endTime: null,
        duration: null,
        isFestival: false
      },
      wednesday: {
        status: 'parked',
        startTime: '14:30',
        endTime: '20:15',
        duration: '5h 45m',
        isFestival: false
      },
      thursday: {
        status: 'parked',
        startTime: '10:45',
        endTime: '23:00',
        duration: '12h 15m',
        isFestival: true,
        festivalName: 'Diwali',
        festivalAvailable: true
      },
      friday: {
        status: 'parked',
        startTime: '16:00',
        endTime: '22:30',
        duration: '6h 30m',
        isFestival: false
      },
      saturday: {
        status: 'parked',
        startTime: '10:30',
        endTime: '23:00',
        duration: '12h 30m',
        isFestival: false
      }
    },
    festivalAvailability: {
      diwali: { available: true, hours: '9:00-24:00', note: 'Extended hours for Diwali shopping' },
      holi: { available: true, hours: '11:00-22:00', note: 'Special Holi celebration hours' },
      christmas: { available: true, hours: '10:00-24:00', note: 'Christmas shopping extended hours' }
    },
    rules: [
      'First 2 hours free',
      'Validation required'
    ],
    coordinates: [21.2154, 72.8522]
  },
  {
    id: 4,
    name: 'VR Mall',
    category: 'Shopping Mall',
    vehicleTypes: ['car', 'motorcycle', 'ev'],
    capacity: { car: 200, motorcycle: 100, ev: 20, total: 320 },
    distance: 4.1,
    description: 'Large entertainment and shopping destination with cinema complex.',
    status: 'available',
    operatingHours: '9:00 - 23:30',
    maxDuration: 720, // 12 hours
    dayWiseAvailability: {
      sunday: {
        status: 'parked',
        startTime: '12:30',
        endTime: '20:15',
        duration: '7h 45m',
        isFestival: false
      },
      monday: {
        status: 'parked',
        startTime: '09:30',
        endTime: '15:45',
        duration: '6h 15m',
        isFestival: false
      },
      tuesday: {
        status: 'parked',
        startTime: '11:00',
        endTime: '18:30',
        duration: '7h 30m',
        isFestival: false
      },
      wednesday: {
        status: 'parked',
        startTime: '14:15',
        endTime: '22:00',
        duration: '7h 45m',
        isFestival: false
      },
      thursday: {
        status: 'parked',
        startTime: '10:30',
        endTime: '23:30',
        duration: '13h 0m',
        isFestival: true,
        festivalName: 'Diwali',
        festivalAvailable: true
      },
      friday: {
        status: 'parked',
        startTime: '13:45',
        endTime: '23:15',
        duration: '9h 30m',
        isFestival: false
      },
      saturday: {
        status: 'parked',
        startTime: '11:30',
        endTime: '23:45',
        duration: '12h 15m',
        isFestival: false
      }
    },
    festivalAvailability: {
      diwali: { available: true, hours: '8:00-24:00', note: 'Full day celebration and shopping' },
      holi: { available: true, hours: '10:00-23:00', note: 'Holi color festival events' },
      christmas: { available: true, hours: '9:00-24:00', note: 'Christmas celebrations and events' }
    },
    rules: [
      'Free parking',
      'EV charging available'
    ],
    coordinates: [21.2254, 72.8622]
  },
  {
    id: 5,
    name: 'Government Office Complex',
    category: 'Office',
    vehicleTypes: ['car', 'motorcycle'],
    capacity: { car: 40, motorcycle: 25, total: 65 },
    distance: 2.3,
    description: 'Administrative buildings with limited visitor parking.',
    status: 'limited',
    operatingHours: '9:00 - 17:00',
    maxDuration: 240, // 4 hours
    dayWiseAvailability: {
      sunday: {
        status: 'not_parked',
        startTime: null,
        endTime: null,
        duration: null,
        isFestival: false
      },
      monday: {
        status: 'parked',
        startTime: '09:30',
        endTime: '13:15',
        duration: '3h 45m',
        isFestival: false
      },
      tuesday: {
        status: 'parked',
        startTime: '10:00',
        endTime: '14:30',
        duration: '4h 30m',
        isFestival: false
      },
      wednesday: {
        status: 'parked',
        startTime: '08:45',
        endTime: '12:00',
        duration: '3h 15m',
        isFestival: false
      },
      thursday: {
        status: 'not_parked',
        startTime: null,
        endTime: null,
        duration: null,
        isFestival: true,
        festivalName: 'Diwali',
        festivalAvailable: false
      },
      friday: {
        status: 'parked',
        startTime: '11:15',
        endTime: '15:45',
        duration: '4h 30m',
        isFestival: false
      },
      saturday: {
        status: 'not_parked',
        startTime: null,
        endTime: null,
        duration: null,
        isFestival: false
      }
    },
    festivalAvailability: {
      diwali: { available: false, note: 'Government offices closed for Diwali' },
      holi: { available: false, note: 'Government offices closed for Holi' },
      christmas: { available: false, note: 'Government offices closed for Christmas' }
    },
    rules: [
      'Visitor pass required',
      'No overnight parking'
    ],
    coordinates: [21.1854, 72.8222]
  }
]

const ParkingList = ({ selectedArea, setSelectedArea, currentTime, fullWidth = false, onAreaSelect, selectedCategories = [], selectedVehicleTypes = [], parkingDuration = null }) => {
  const [detailModal, setDetailModal] = useState(null)
  const [availabilityModal, setAvailabilityModal] = useState(null)

  const handleCardClick = (parkingArea) => {
    if (fullWidth) {
      // In fullWidth mode, show detail modal
      setDetailModal(parkingArea)
    } else {
      // In sidebar mode, select for map
      setSelectedArea(parkingArea)
      // Close mobile menu if callback provided
      if (onAreaSelect) {
        onAreaSelect()
      }
    }
  }

  const handleCloseModal = () => {
    setDetailModal(null)
  }

  const handleShowRoute = () => {
    if (detailModal) {
      setSelectedArea(detailModal)
      setDetailModal(null)
    }
  }

  const openDetailsModal = (parkingArea) => {
    setAvailabilityModal(parkingArea)
  }

  const closeAvailabilityModal = () => {
    setAvailabilityModal(null)
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

  // Filter parking data based on selected categories, vehicle types, and duration
  const filteredData = staticParkingData.filter(area => {
    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(area.category)) {
      return false
    }

    // Vehicle type filter
    if (selectedVehicleTypes.length > 0 && (!area.vehicleTypes || !selectedVehicleTypes.some(type => area.vehicleTypes.includes(type)))) {
      return false
    }

    // Duration filter
    if (parkingDuration && area.maxDuration && parseInt(parkingDuration) > area.maxDuration) {
      return false
    }

    return true
  })

  return (
    <>
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
                  <span className="text-sm text-gray-500">{area.distance} km away</span>
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
                <span className="text-gray-600">Operating: {area.operatingHours}</span>
              </div>

              {area.capacity && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="text-gray-600">
                    Capacity: {area.capacity.total || Object.values(area.capacity).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0)} spots
                    {area.vehicleTypes && area.vehicleTypes.length > 0 && (
                      <span className="text-xs ml-1">
                        ({area.vehicleTypes.map(type => {
                          const count = area.capacity[type];
                          return count ? `${type}: ${count}` : type;
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

            {/* View Details Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDetailsModal(area);
              }}
              className="w-full mt-3 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors min-h-[40px] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View Availability Details
            </button>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <ParkingDetailModal
          parkingArea={detailModal}
          onClose={handleCloseModal}
          onShowRoute={handleShowRoute}
        />
      )}

      {/* Availability Details Modal */}
      {availabilityModal && (
        <AvailabilityDetailModal
          parkingArea={availabilityModal}
          onClose={closeAvailabilityModal}
        />
      )}
    </>
  )
}

// Availability Detail Modal Component
const AvailabilityDetailModal = ({ parkingArea, onClose }) => {
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
    const dayData = parkingArea.dayWiseAvailability[day.key]
    if (dayData.status === 'parked') {
      stats.parkedDays++
      // Parse duration like "4h 15m" to minutes
      const durationMatch = dayData.duration.match(/(\d+)h\s*(\d+)m/)
      if (durationMatch) {
        const hours = parseInt(durationMatch[1])
        const minutes = parseInt(durationMatch[2])
        stats.totalParkingTime += (hours * 60) + minutes
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
                <span>{parkingArea.distance} km away</span>
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

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Weekly Statistics */}
          <div className="bg-gray-50 p-6 border-b">
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
          </div>

          {/* Day-wise Availability */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Availability</h3>
            <div className="grid gap-3">
              {daysOfWeek.map((day) => {
                const dayData = parkingArea.dayWiseAvailability[day.key]
                return (
                  <div key={day.key} className={`rounded-xl p-4 border-2 transition-all hover:shadow-md ${
                    dayData.isFestival
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300'
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Day indicator */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          dayData.status === 'parked' ? 'bg-green-500' : 'bg-gray-400'
                        }`}>
                          {day.shortName}
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{day.name}</h4>
                          {dayData.isFestival && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-lg">🎉</span>
                              <span className="text-sm font-medium text-orange-700">{dayData.festivalName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-md ${getStatusColor(dayData.status)}`}>
                          {getStatusIcon(dayData.status)}
                          {dayData.status === 'parked' ? 'Parked' : 'Available'}
                        </div>

                        {dayData.status === 'parked' && (
                          <div className="mt-2 text-sm text-gray-600">
                            <div className="font-medium">{dayData.startTime} - {dayData.endTime}</div>
                            <div className="text-gray-500">{dayData.duration}</div>
                          </div>
                        )}

                        {dayData.isFestival && (
                          <div className="mt-2">
                            <span className={`text-sm font-semibold ${
                              dayData.festivalAvailable ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {dayData.festivalAvailable ? '✓ Festival Available' : '✗ Festival Blocked'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Festival Information */}
          {parkingArea.festivalAvailability && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-t border-yellow-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
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
