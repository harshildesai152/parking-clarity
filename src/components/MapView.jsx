import { useState, useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './MapView.css'
import L from 'leaflet'
import Switch from 'react-switch'
import { useFavorites } from '../contexts/FavoritesContext'
import { calculateStatus } from '../utils/statusUtils'
import { calculateDistance, formatDistance } from '../utils/distanceUtils'
import { useGeolocation } from '../hooks/useGeolocation'

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// MapController component to handle map interactions
const MapController = ({ selectedArea, route, userGeolocation, locationPermission }) => {
  const map = useMap()
  const [hasZoomedToLocation, setHasZoomedToLocation] = useState(false)

  useEffect(() => {
    if (selectedArea && !route) {
      // Precision zoom to selected parking location
      map.flyTo(selectedArea.coordinates, 17, {
        duration: 1.5,
        easeLinearity: 0.5
      })
    } else if (route && route.length > 0) {
      // Show route with better zoom level - center on route but don't zoom out too much
      const bounds = L.latLngBounds(route)

      // Calculate distance between start and end points
      const startPoint = route[0]
      const endPoint = route[route.length - 1]
      const distance = map.distance(startPoint, endPoint)

      // Adjust zoom based on route distance
      let zoomLevel = 15 // Default zoom
      if (distance < 1000) { // Less than 1km
        zoomLevel = 16
      } else if (distance < 5000) { // Less than 5km
        zoomLevel = 14
      } else if (distance < 10000) { // Less than 10km
        zoomLevel = 13
      } else {
        zoomLevel = 12
      }

      // Center the map on the route bounds center with appropriate zoom
      map.fitBounds(bounds, {
        maxZoom: zoomLevel,
        padding: [30, 30]
      })
    }
  }, [selectedArea, route, map])

  // Zoom to live location when it's first fetched
  useEffect(() => {
    if (userGeolocation && locationPermission === 'granted' && !hasZoomedToLocation) {
      map.flyTo([userGeolocation.lat, userGeolocation.lng], 15, {
        duration: 1.5,
        easeLinearity: 0.5
      })
      setHasZoomedToLocation(true)
    }
  }, [userGeolocation, locationPermission, hasZoomedToLocation, map])

  return null
}

// FixedPinController component to handle truly fixed pin positioning
const FixedPinController = ({ tempLocation, isAdjustMode, onMapCenterChange }) => {
  const map = useMap()
  const [isDragging, setIsDragging] = useState(false)
  const dragTimeoutRef = useRef(null)

  useEffect(() => {
    const handleDragStart = () => {
      setIsDragging(true)
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current)
      }
    }

    const handleDragEnd = () => {
      setIsDragging(false)
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current)
      }
      // Update immediately on drag end
      const center = map.getCenter()
      onMapCenterChange([center.lat, center.lng])
    }

    const handleMove = () => {
      // Update on any map movement (pan, zoom)
      const center = map.getCenter()
      onMapCenterChange([center.lat, center.lng])
    }

    const handleMoveEnd = () => {
      // Also update on move end for consistency
      const center = map.getCenter()
      onMapCenterChange([center.lat, center.lng])
    }

    map.on('dragstart', handleDragStart)
    map.on('dragend', handleDragEnd)
    map.on('move', handleMove) // Update during movement
    map.on('moveend', handleMoveEnd) // Update after movement
    map.on('zoomend', handleMoveEnd) // Update after zoom

    return () => {
      map.off('dragstart', handleDragStart)
      map.off('dragend', handleDragEnd)
      map.off('move', handleMove)
      map.off('moveend', handleMoveEnd)
      map.off('zoomend', handleMoveEnd)
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current)
      }
    }
  }, [map, onMapCenterChange])

  return null
}

const MapView = ({ 
  parkingData = [],
  isLoading: isLoadingAPI = false,
  selectedArea, 
  currentTime, 
  setSelectedArea, 
  selectedCategories = [], 
  selectedVehicleTypes = [], 
  selectedParkingTypes = [], 
  parkingDuration = null,
  filterByAvailability = null,
  route = null,
  setRoute = null,
  searchRadius = 'all',
  onLocationSelect = null
}) => {
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
        // Map "bike" to "motorcycle" in vehicleTypes
        vehicleTypes: (area.vehicleTypes || []).map(v => v === 'bike' ? 'motorcycle' : v),
        status: calculateStatus(area, currentTime),
        // Ensure all required fields exist
        distance: area.distance || 0,
        operatingHours: area.operatingHours ? (typeof area.operatingHours === 'string' ? area.operatingHours : '24/7') : 'N/A'
      }))
  }, [parkingData, currentTime])

  const [userLocation, setUserLocation] = useState([21.2000, 72.8400]) // Default: Surat city center
  const [isClient, setIsClient] = useState(false)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [locationPermission, setLocationPermission] = useState('prompt') // 'prompt', 'granted', 'denied')
  const [showNoParkingDialog, setShowNoParkingDialog] = useState(false)
  const [dialogDismissed, setDialogDismissed] = useState(false)
  const [liveLocation, setLiveLocation] = useState(null) // Real GPS location
  const [tempLocation, setTempLocation] = useState(null) // Temporary location during adjust mode
  const [confirmedLocation, setConfirmedLocation] = useState(null) // Final overridden location
  const [isAdjustMode, setIsAdjustMode] = useState(false) // Switch state for adjust mode
  const [mapCenter, setMapCenter] = useState(null) // Track actual map center for pin positioning
  const [pinPosition, setPinPosition] = useState(null) // Track pin pixel position for fixed mode
  const { location: userGeolocation, error: locationError, loading: locationLoading } = useGeolocation()
  const { toggleFavorite, isFavorite } = useFavorites()

  // Get the active location for calculations (confirmedLocation if set, otherwise live location)
  const getActiveLocation = () => {
    if (confirmedLocation && Array.isArray(confirmedLocation) && confirmedLocation.length === 2) {
      return confirmedLocation;
    } else if (liveLocation) {
      return liveLocation;
    } else {
      return userLocation;
    }
  };

  // Calculate distance from active location to selected area
  const getDistanceFromActiveLocation = (area) => {
    if (!area || !area.coordinates) return 0
    
    const activeLocation = getActiveLocation();
    if (!activeLocation || activeLocation.length !== 2) return 0
    
    return calculateDistance(activeLocation[0], activeLocation[1], area.coordinates[0], area.coordinates[1])
  }

  // Update selected area when active location changes to recalculate distance
  useEffect(() => {
    if (selectedArea && (liveLocation || confirmedLocation || userLocation)) {
      // Force re-render to update distance display
      setSelectedArea(prev => prev ? {...prev} : null)
    }
  }, [confirmedLocation, liveLocation, userLocation])

  // Calculate distances and handle "no parking nearby" logic using useMemo
  const parkingWithDistance = useMemo(() => {
    let results = normalizedParkingData;
    
    // Use confirmedLocation (override) if available, otherwise use live location or default location
    let activeLocationCoords;
    if (confirmedLocation && Array.isArray(confirmedLocation) && confirmedLocation.length === 2) {
      activeLocationCoords = { lat: confirmedLocation[0], lng: confirmedLocation[1] };
    } else if (liveLocation) {
      activeLocationCoords = { lat: liveLocation[0], lng: liveLocation[1] };
    } else {
      activeLocationCoords = { lat: userLocation[0], lng: userLocation[1] };
    }
    
    if (activeLocationCoords && normalizedParkingData.length > 0) {
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

        const distance = calculateDistance(activeLocationCoords.lat, activeLocationCoords.lng, areaLat, areaLng);
        
        return {
          ...area,
          distance: distance
        };
      });

      // Apply radius filter if not 'all'
      if (searchRadius !== 'all' && activeLocationCoords) {
        const radiusInKm = parseInt(searchRadius) / 1000;
        results = results.filter(area => area.distance <= radiusInKm);
      }

      // Update dialog state based on calculation (check against all parking data, not filtered)
      const allNearbyParking = normalizedParkingData.filter(area => {
        let areaLat, areaLng;
        if (area.coordinates && Array.isArray(area.coordinates) && area.coordinates.length === 2) {
          [areaLat, areaLng] = area.coordinates;
        } else if (area.location && area.location.lat && area.location.lng) {
          areaLat = area.location.lat;
          areaLng = area.location.lng;
        } else {
          return false;
        }
        
        const distance = calculateDistance(activeLocationCoords.lat, activeLocationCoords.lng, areaLat, areaLng);
        return distance <= 5;
      });
      
      if (allNearbyParking.length === 0 && !dialogDismissed) {
        setShowNoParkingDialog(true);
      } else {
        setShowNoParkingDialog(false);
      }
    }
    
    return results;
  }, [confirmedLocation, liveLocation, userLocation, normalizedParkingData, searchRadius]);
  const mapRef = useRef(null)

  // Auto-center map on first result when data arrives
  useEffect(() => {
    if (normalizedParkingData.length > 0 && mapRef.current) {
      const firstSpot = normalizedParkingData[0];
      if (firstSpot.coordinates) {
        mapRef.current.flyTo(firstSpot.coordinates, 13);
      }
    }
  }, [parkingData.length === 0 && normalizedParkingData.length > 0]) // Only on first load of data

  // Initialize liveLocation with user's current location when component mounts
  useEffect(() => {
    if (userGeolocation && !liveLocation) {
      setLiveLocation([userGeolocation.lat, userGeolocation.lng])
    } else if (!userGeolocation && !liveLocation) {
      setLiveLocation(userLocation)
    }
  }, [userGeolocation, userLocation, liveLocation])

  useEffect(() => {
    setIsClient(true)
    
    // Request user's live location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])
          setLocationPermission('granted')
          // Set liveLocation if not already set
          if (!liveLocation) {
            setLiveLocation([latitude, longitude])
          }
        },
        (error) => {
          console.error('Error getting location:', error)
          setLocationPermission('denied')
          // Keep using default location (Surat city center)
          if (!liveLocation) {
            setLiveLocation(userLocation)
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    } else {
      setLocationPermission('denied')
      if (!liveLocation) {
        setLiveLocation(userLocation)
      }
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
    console.log('Parking clicked:', parkingArea.name);
    
    // Set selected area to sync with sidebar
    setSelectedArea(parkingArea)
    
    setIsLoadingRoute(true)
    try {
      // Use confirmedLocation (override) as start point if available, otherwise use live location
      let activeLocation;
      if (confirmedLocation && Array.isArray(confirmedLocation) && confirmedLocation.length === 2) {
        activeLocation = confirmedLocation;
      } else if (liveLocation) {
        activeLocation = liveLocation;
      } else {
        activeLocation = userLocation;
      }
      
      const routePath = await generateRoute(activeLocation, parkingArea.coordinates)
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

  const createCustomIcon = (status, isSelected = false, isFavoriteSpot = false) => {
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
          position: relative;
          cursor: pointer;
          ${isSelected ? 'animation: pulse 2s infinite;' : ''}
        ">
          <div style="
            background-color: white;
            width: ${isSelected ? '10px' : '8px'};
            height: ${isSelected ? '10px' : '8px'};
            border-radius: 50%;
            pointer-events: none;
          "></div>
          ${isFavoriteSpot ? `
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              background-color: #fbbf24;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              border: 2px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              pointer-events: none;
            ">⭐</div>
          ` : ''}
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

  // Update pin position when map moves (only when not in adjust mode)
  useEffect(() => {
    if (!isAdjustMode && getActiveLocation() && mapRef.current) {
      const updatePinPosition = () => {
        const position = getPinPixelPosition()
        setPinPosition(position)
      }
      
      // Update immediately
      updatePinPosition()
      
      // Also update on map movements
      const map = mapRef.current
      map.on('moveend', updatePinPosition)
      map.on('zoomend', updatePinPosition)
      
      return () => {
        map.off('moveend', updatePinPosition)
        map.off('zoomend', updatePinPosition)
      }
    }
  }, [confirmedLocation, liveLocation, isAdjustMode])

  // Convert lat/lng to pixel position for fixed pin when not in adjust mode
  const getPinPixelPosition = () => {
    if (!mapRef.current || !getActiveLocation() || isAdjustMode) return null
    
    try {
      const map = mapRef.current
      const activeLocation = getActiveLocation()
      const point = map.latLngToContainerPoint(activeLocation)
      return { x: point.x, y: point.y }
    } catch (error) {
      console.error('Error converting coordinates to pixel position:', error)
      return null
    }
  }

  // Handle map center change (respects adjust mode)
  const handleMapCenterChange = (centerCoords) => {
    setMapCenter(centerCoords)
    
    if (isAdjustMode) {
      // Only update tempLocation when in adjust mode
      setTempLocation(centerCoords)
      
      // Notify parent component if callback provided (only in adjust mode)
      if (onLocationSelect) {
        onLocationSelect({
          lat: centerCoords[0],
          lng: centerCoords[1],
          name: 'Temporary Location'
        })
      }
    }
    // Don't update confirmedLocation - only confirm button should do that
  }

  // Get the active center coordinates for map centering
  const getMapCenter = () => {
    if (isAdjustMode && tempLocation && Array.isArray(tempLocation) && tempLocation.length === 2) {
      return tempLocation
    }
    const activeLocation = getActiveLocation()
    return activeLocation
  }

  // Handle confirm location action
  const handleConfirmLocation = () => {
    if (tempLocation && Array.isArray(tempLocation) && tempLocation.length === 2) {
      setConfirmedLocation(tempLocation)
      setTempLocation(null)
      setIsAdjustMode(false) // Turn switch OFF automatically
      
      // Notify parent component with confirmed location
      if (onLocationSelect) {
        onLocationSelect({
          lat: tempLocation[0],
          lng: tempLocation[1],
          name: 'Confirmed Location'
        })
      }
    }
  }

  // Handle adjust mode toggle
  const handleAdjustModeToggle = (enabled) => {
    setIsAdjustMode(enabled)
    if (!enabled) {
      // Switch turned OFF, clear temporary location
      setTempLocation(null)
    } else {
      // Switch turned ON, initialize tempLocation with current active location
      const activeLocation = getActiveLocation()
      if (activeLocation) {
        setTempLocation(activeLocation)
      }
    }
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
      {isLoadingAPI && (
        <div className="absolute inset-0 bg-white bg-opacity-70 z-[2000] flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-2"></div>
            <div className="text-blue-600 font-medium">Updating parking spots...</div>
          </div>
        </div>
      )}
      <MapContainer
        ref={mapRef}
        center={getMapCenter()}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <MapController selectedArea={selectedArea} route={route} userGeolocation={userGeolocation} locationPermission={locationPermission} />
        <FixedPinController 
          tempLocation={tempLocation}
          isAdjustMode={isAdjustMode}
          onMapCenterChange={handleMapCenterChange} 
        />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location (Blue Dot) - Only show when NOT in adjust mode */}
        {!isAdjustMode && (
          <Marker 
            position={getActiveLocation()}
            icon={createUserIcon()}
          >
            <Popup>
              <div className="text-xs sm:text-sm max-w-[200px] sm:max-w-xs p-1 sm:p-2">
                <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                  {confirmedLocation ? 'Overridden Location' : 'Your Current Location'}
                </div>
                <div className="text-xs text-gray-500">
                  Lat: {getActiveLocation()[0].toFixed(4)}, Lng: {getActiveLocation()[1].toFixed(4)}
                  <br />
                  {confirmedLocation ? 'Manually selected location' : 'Actual GPS position'}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Search radius circle - Only show when in adjust mode */}
        {isAdjustMode && tempLocation && (
          <Circle
            center={tempLocation}
            radius={3000} // 3km radius
            pathOptions={{
              color: '#ef4444', // Red for selected location
              fillColor: '#ef4444',
              fillOpacity: 0.1,
              weight: 2,
            }}
          />
        )}

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
        {parkingWithDistance
          .filter(area => {
            // Category filter - map API category to UI filter
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
          .map((area) => {
            // Additional safety check before rendering Marker
            if (!area.coordinates || !Array.isArray(area.coordinates) || area.coordinates.length !== 2) {
              return null;
            }
            
            return (
              <Marker
                key={area.id}
                position={area.coordinates}
                icon={createCustomIcon(area.status, selectedArea?.id === area.id, isFavorite(area.id))}
                onclick={() => {
                  console.log('Marker onclick triggered');
                  handleParkingClick(area);
                }}
                eventHandlers={{
                  click: (e) => {
                    console.log('Marker eventHandlers click triggered');
                    handleParkingClick(area);
                  }
                }}
              >
            <Popup>
              <div className="text-xs sm:text-sm max-w-[200px] sm:max-w-xs p-1 sm:p-2">
                <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{area.name}</div>
                <div className="text-xs text-gray-500 mb-2">{area.category} • {formatDistance(getDistanceFromActiveLocation(area))}</div>

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

                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {area.operatingHours || '24/7'}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(area);
                  }}
                  className={`w-full px-2 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    isFavorite(area.id)
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <span className="text-sm">{isFavorite(area.id) ? '⭐' : '☆'}</span>
                  {isFavorite(area.id) ? 'Favorited' : 'Add to Favorites'}
                </button>
              </div>
            </Popup>
          </Marker>
            );
          })}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute top-20 right-2 sm:right-4 bg-white rounded-lg shadow-lg p-2 sm:p-3 z-[1000] max-w-[160px] sm:max-w-none">
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
            <span className="text-xs text-gray-600">
              {confirmedLocation ? 'Current Location' : 'Live GPS Location'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] transform rotate-45 border-red-500"></div>
            <span className="text-xs text-gray-600">
              Selected Location (Adjust Mode)
            </span>
          </div>
        </div>
      </div>

      {/* Red Pin Overlay - Only show when in adjust mode */}
      {isAdjustMode && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none z-[1000]">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full opacity-30 animate-ping bg-red-500"></div>
            <div className="relative bg-red-500 w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <div className="bg-white w-3 h-3 rounded-full"></div>
            </div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-red-500"></div>
          </div>
        </div>
      )}

      {/* Location Controls */}
      <div className="absolute top-4 right-2 sm:right-4 bg-white rounded-lg shadow-lg p-3 sm:p-4 z-[1000] max-w-sm">
        <div className="space-y-3">
          {/* Adjust Location Switch */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Adjust Location
            </label>
            <Switch
              checked={isAdjustMode}
              onChange={handleAdjustModeToggle}
              onColor="#f59e0b"
              offColor="#d1d5db"
              onHandleColor="#ffffff"
              offHandleColor="#ffffff"
              handleDiameter={20}
              uncheckedIcon={false}
              checkedIcon={false}
              boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
              activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
              height={24}
              width={48}
              className="react-switch flex-shrink-0"
              id="adjust-location-switch"
            />
          </div>

          {/* Confirm Location Button */}
          {isAdjustMode && tempLocation && (
            <button
              onClick={handleConfirmLocation}
              className="w-full bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Confirm Location
            </button>
          )}
        </div>
      </div>

      {/* Active Location Display */}
      {(liveLocation || confirmedLocation) && (
        <div className="absolute bottom-4 left-2 sm:left-4 bg-white rounded-lg shadow-lg p-3 sm:p-4 max-w-sm z-[1000]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base flex items-center gap-2">
              <span className="text-blue-500">📍</span>
              {isAdjustMode ? 'Temporary Location' : (confirmedLocation ? 'Overridden Location' : 'Live Location')}
            </h3>
            <button
              onClick={() => {
                // Reset to live GPS location
                if (userGeolocation) {
                  const userCoords = [userGeolocation.lat, userGeolocation.lng]
                  setLiveLocation(userCoords)
                  setConfirmedLocation(null)
                  setTempLocation(null)
                  setIsAdjustMode(false)
                  if (mapRef.current) {
                    mapRef.current.flyTo(userCoords, 15)
                  }
                } else {
                  setLiveLocation(userLocation)
                  setConfirmedLocation(null)
                  setTempLocation(null)
                  setIsAdjustMode(false)
                  if (mapRef.current) {
                    mapRef.current.flyTo(userLocation, 15)
                  }
                }
              }}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
              title="Reset to live location"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="text-xs sm:text-sm text-gray-600">
            <p>
              Lat: {(isAdjustMode && tempLocation ? tempLocation : getActiveLocation())[0].toFixed(4)}, 
              Lng: {(isAdjustMode && tempLocation ? tempLocation : getActiveLocation())[1].toFixed(4)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {isAdjustMode 
                ? "Move the map to adjust, then confirm" 
                : confirmedLocation 
                ? "Location overridden - toggle switch to adjust"
                : "Live GPS location - toggle switch to adjust"}
            </p>
          </div>
        </div>
      )}

      {/* Selected Area Info */}
      {selectedArea && !selectedArea.isCurrentLocation && (
        <div className="absolute bottom-[7.5rem] sm:bottom-[6.5rem] left-2 sm:left-4 right-2 sm:right-auto bg-white rounded-lg shadow-lg p-3 sm:p-4 max-w-sm z-[1000]">
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
            <p>{selectedArea.category} • {getDistanceFromActiveLocation(selectedArea).toFixed(3)} km away</p>
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
      <div className="absolute top-4 left-12 sm:left-4 bg-white rounded-lg shadow-lg p-2 sm:p-3 z-[1000]">
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
        <div className="absolute top-20 sm:top-24 left-12 sm:left-4 bg-white rounded-lg shadow-lg p-2 sm:p-3 z-[1000]">
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

      {/* No Parking Spots Notification - Small Line */}
      {showNoParkingDialog && ((confirmedLocation || liveLocation) || userGeolocation) && (
        <div className="absolute top-16 bg-orange-50 border border-orange-200 rounded-lg p-2 z-[999]" style={{marginLeft: '3.5rem', marginRight: '7.5rem'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs text-orange-800 font-medium">
                No parking spots found within 5KM of {confirmedLocation ? 'overridden location' : 'your current location'}
              </span>
            </div>
            <button
              onClick={() => {
                setShowNoParkingDialog(false);
                setDialogDismissed(true);
              }}
              className="text-orange-600 hover:text-orange-800 p-1 rounded-full hover:bg-orange-100 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapView
