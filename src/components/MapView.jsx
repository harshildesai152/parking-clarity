import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

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

// MapController component to handle map interactions
const MapController = ({ selectedArea, route }) => {
  const map = useMap()

  useEffect(() => {
    if (selectedArea) {
      // Precision zoom to selected parking location
      map.flyTo(selectedArea.coordinates, 18, {
        duration: 1.5,
        easeLinearity: 0.5
      })
    } else if (route && route.length > 0) {
      // Fit bounds to show the entire route with maxZoom constraint
      const bounds = L.latLngBounds(route)
      map.fitBounds(bounds, { 
        maxZoom: 16,
        padding: [50, 50]
      })
    }
  }, [selectedArea, route, map])

  return null
}

const MapView = ({ selectedArea, currentTime, setSelectedArea }) => {
  const [userLocation, setUserLocation] = useState([21.2000, 72.8400]) // Default: Surat city center
  const [isClient, setIsClient] = useState(false)
  const [route, setRoute] = useState(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [locationPermission, setLocationPermission] = useState('prompt') // 'prompt', 'granted', 'denied'

  useEffect(() => {
    setIsClient(true)
    
    // Request user's live location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])
          setLocationPermission('granted')
        },
        (error) => {
          console.error('Error getting location:', error)
          setLocationPermission('denied')
          // Keep using default location (Surat city center)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    } else {
      setLocationPermission('denied')
    }
  }, [])

  // Generate route using OSRM routing service
  const generateRoute = async (start, end) => {
    try {
      // OSRM routing API - free and open source
      const coordinates = `${start[1]},${start[0]};${end[1]},${end[0]}`
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`
      )
      
      if (!response.ok) {
        throw new Error('Routing service unavailable')
      }
      
      const data = await response.json()
      
      if (data.routes && data.routes.length > 0) {
        // Convert GeoJSON coordinates to Leaflet format
        const routeCoords = data.routes[0].geometry.coordinates.map(
          coord => [coord[1], coord[0]] // Flip lat/lng for Leaflet
        )
        return routeCoords
      }
      
      // Fallback to straight line if routing fails
      return [start, end]
    } catch (error) {
      console.error('Routing error:', error)
      // Fallback to straight line
      return [start, end]
    }
  }

  const handleParkingClick = async (parkingArea) => {
    // Set selected area to sync with sidebar
    setSelectedArea(parkingArea)
    
    setIsLoadingRoute(true)
    try {
      const routePath = await generateRoute(userLocation, parkingArea.coordinates)
      setRoute(routePath)
    } catch (error) {
      console.error('Failed to generate route:', error)
    } finally {
      setIsLoadingRoute(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return '#10b981' // green
      case 'limited':
        return '#f59e0b' // yellow
      case 'avoid':
        return '#ef4444' // red
      default:
        return '#6b7280' // gray
    }
  }

  const createCustomIcon = (status, isSelected = false) => {
    const color = getStatusColor(status)
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: ${isSelected ? '28px' : '24px'};
          height: ${isSelected ? '28px' : '24px'};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          ${isSelected ? 'animation: pulse 2s infinite;' : ''}
        ">
          <div style="
            background-color: white;
            width: ${isSelected ? '10px' : '8px'};
            height: ${isSelected ? '10px' : '8px'};
            border-radius: 50%;
          "></div>
        </div>
        <style>
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
            }
          }
        </style>
      `,
      className: 'custom-marker',
      iconSize: [isSelected ? 28 : 24, isSelected ? 28 : 24],
      iconAnchor: [isSelected ? 14 : 12, isSelected ? 14 : 12],
    })
  }

  const createUserIcon = () => {
    return L.divIcon({
      html: `
        <div style="
          background-color: #3b82f6;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      className: 'user-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })
  }

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={userLocation}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <MapController selectedArea={selectedArea} route={route} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location */}
        <Marker position={userLocation} icon={createUserIcon()}>
          <Popup>
            <div className="text-sm">
              <strong>Your Location</strong>
              <br />
              Current position
            </div>
          </Popup>
        </Marker>

        {/* Search radius circle */}
        <Circle
          center={userLocation}
          radius={3000} // 3km radius
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 2,
          }}
        />

        {/* Route Line */}
        {route && (
          <Polyline
            positions={route}
            pathOptions={{
              color: '#3b82f6',
              weight: 4,
              opacity: 0.8,
            }}
          />
        )}

        {/* Parking Locations */}
        {staticParkingData.map((area) => (
          <Marker
            key={area.id}
            position={area.coordinates}
            icon={createCustomIcon(area.status, selectedArea?.id === area.id)}
            eventHandlers={{
              click: () => handleParkingClick(area)
            }}
          >
            <Popup>
              <div className="text-xs sm:text-sm max-w-[200px] sm:max-w-xs p-1 sm:p-2">
                <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{area.name}</div>
                <div className="text-xs text-gray-500 mb-2">{area.category} • {area.distance} km away</div>

                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                  area.status === 'available' ? 'bg-green-100 text-green-800' :
                  area.status === 'limited' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {area.status === 'available' ? 'LIKELY AVAILABLE' :
                   area.status === 'limited' ? 'LIMITED / BUSY' :
                   'AVOID RIGHT NOW'}
                </div>

                {area.description && (
                  <p className="text-gray-600 text-xs mb-2">{area.description}</p>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {area.operatingHours}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute top-4 right-2 sm:right-4 bg-white rounded-lg shadow-lg p-2 sm:p-3 z-[1000] max-w-[160px] sm:max-w-none">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Legend</h3>
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm flex-shrink-0"></div>
            <span className="text-xs text-gray-600">Likely Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-white shadow-sm flex-shrink-0"></div>
            <span className="text-xs text-gray-600">Limited / Busy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm flex-shrink-0"></div>
            <span className="text-xs text-gray-600">Avoid / Closed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm flex-shrink-0"></div>
            <span className="text-xs text-gray-600">Your Location</span>
          </div>
        </div>
      </div>

      {/* Selected Area Info */}
      {selectedArea && (
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-auto bg-white rounded-lg shadow-lg p-3 sm:p-4 max-w-sm z-[1000]">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base pr-2">{selectedArea.name}</h3>
            <button
              onClick={() => setSelectedArea(null)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-xs sm:text-sm text-gray-600">
            <p>{selectedArea.category} • {selectedArea.distance} km away</p>
            <p className="mt-1">{selectedArea.description}</p>
          </div>
          <button
            onClick={() => handleParkingClick(selectedArea)}
            disabled={isLoadingRoute}
            className="mt-3 w-full bg-blue-500 text-white px-3 py-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed min-h-[44px]"
          >
            {isLoadingRoute ? 'Calculating Route...' : 'Show Route'}
          </button>
        </div>
      )}

      {/* Location Permission Status */}
      <div className="absolute top-4 left-2 sm:left-4 bg-white rounded-lg shadow-lg p-2 sm:p-3 z-[1000]">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          {locationPermission === 'granted' ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700">Live Location</span>
            </>
          ) : locationPermission === 'denied' ? (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Location Denied</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700">Getting Location...</span>
            </>
          )}
        </div>
      </div>

      {/* Route Control */}
      {route && (
        <div className="absolute top-16 sm:top-20 left-2 sm:left-4 bg-white rounded-lg shadow-lg p-2 sm:p-3 z-[1000]">
          <button
            onClick={() => setRoute(null)}
            className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 min-h-[44px] px-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Route
          </button>
        </div>
      )}
    </div>
  )
}

export default MapView
