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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
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
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Show Route
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
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
    distance: 1.7,
    description: 'Busy hospital zone in the heart of the diamond district. High vehicle turnover.',
    status: 'avoid',
    operatingHours: '0:00 - 23:00',
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
    distance: 2.9,
    description: 'Bustling market area near the railway station with high foot traffic.',
    status: 'avoid',
    operatingHours: '6:00 - 22:00',
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
    distance: 3.2,
    description: 'Modern shopping complex with multiple retail outlets and food court.',
    status: 'limited',
    operatingHours: '10:00 - 23:00',
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
    distance: 4.1,
    description: 'Large entertainment and shopping destination with cinema complex.',
    status: 'available',
    operatingHours: '9:00 - 23:30',
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
    distance: 2.3,
    description: 'Administrative buildings with limited visitor parking.',
    status: 'limited',
    operatingHours: '9:00 - 17:00',
    rules: [
      'Visitor pass required',
      'No overnight parking'
    ],
    coordinates: [21.1854, 72.8222]
  }
]

const ParkingList = ({ selectedArea, setSelectedArea, currentTime, fullWidth = false }) => {
  const [detailModal, setDetailModal] = useState(null)

  const handleCardClick = (parkingArea) => {
    if (fullWidth) {
      // In fullWidth mode, show detail modal
      setDetailModal(parkingArea)
    } else {
      // In sidebar mode, select for map
      setSelectedArea(parkingArea)
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
    <>
      <div className={fullWidth ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-3'}>
        {staticParkingData.map((area) => (
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
    </>
  )
}

export default ParkingList
