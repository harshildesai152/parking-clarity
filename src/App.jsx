import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ClarityTime from './components/ClarityTime'
import ParkingList from './components/ParkingList'
import MapView from './components/MapView'
import FavoritesList from './components/FavoritesList'
import ReportsList from './components/ReportsList'
import LocationSearch from './components/LocationSearch'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { ReportsProvider } from './contexts/ReportsContext'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'

function App() {
  const navigate = useNavigate()
  const [selectedArea, setSelectedArea] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isSimulationEnabled, setIsSimulationEnabled] = useState(false) // Default: checkbox NOT checked
  const [activeTab, setActiveTab] = useState('map') // 'map' or 'list'
  const [listViewTab, setListViewTab] = useState('parking') // 'parking' or 'reports' for list view
  const [sidebarView, setSidebarView] = useState('parking') // 'parking' or 'favorites'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState([]) // Start with no categories selected
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState([])
  const [parkingDuration, setParkingDuration] = useState('')
  const [selectedParkingTypes, setSelectedParkingTypes] = useState([])
  const [filterByAvailability, setFilterByAvailability] = useState(null) // null, 'available', 'unavailable'
  const [searchRadius, setSearchRadius] = useState('all') // Default: ALL (no radius filter)
  const [searchLocation, setSearchLocation] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [parkingData, setParkingData] = useState([])
  const [allParkingData, setAllParkingData] = useState([]) // Separate state for all parking data
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('') // Search query for parking areas
  const [showOnlyReported, setShowOnlyReported] = useState(false) // New filter for reported spots
  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false)
  const [searchedLocation, setSearchedLocation] = useState(null)
  const [mapSearchText, setMapSearchText] = useState('') // Text to show in map search bar
  const [route, setRoute] = useState(null) // Add route state to manage routes
  const [routeInfo, setRouteInfo] = useState(null) // State for route distance and duration
  const [activeLocation, setActiveLocation] = useState(null) // Active location from MapView (confirmed or live)
  
  // Location adjustment state - moved from MapView to persist across view changes
  const [liveLocation, setLiveLocation] = useState(null) // Real GPS location
  const [tempLocation, setTempLocation] = useState(null) // Temporary location during adjust mode
  const [confirmedLocation, setConfirmedLocation] = useState(null) // Final overridden location
  const [isAdjustMode, setIsAdjustMode] = useState(false) // Switch state for adjust mode
  const [locationSource, setLocationSource] = useState('current') // 'current' or 'search'
  const [zoomTrigger, setZoomTrigger] = useState(0) // Trigger zoom to current location

  // Handle mobile menu close
  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  // Handle location source change from dropdown
  const handleLocationSourceChange = (source) => {
    setLocationSource(source)
    if (source === 'current') {
      setZoomTrigger(prev => prev + 1)
    }
  }

  // Handle location selection from MapView (new system)
  const handleMapLocationSelect = (location) => {
    console.log('Map location selected:', location);
    
    if (location.type === 'navigation') {
      // Handle navigation from LocationSearch (FROM/TO)
      if (location.from && location.to) {
        // Validate coordinates before using them
        const fromLat = location.from.lat;
        const fromLng = location.from.lng;
        const toLat = location.to.lat;
        const toLng = location.to.lng;
        
        if (typeof fromLat === 'number' && typeof fromLng === 'number' && !isNaN(fromLat) && !isNaN(fromLng) &&
            typeof toLat === 'number' && typeof toLng === 'number' && !isNaN(toLat) && !isNaN(toLng)) {
          
          // Set FROM as confirmed location for route calculation
          setConfirmedLocation([fromLat, fromLng]);
          setLiveLocation([fromLat, fromLng]);
          
          // Set TO as selected area
          const selectedParkingArea = {
            id: location.to.id,
            name: location.to.name,
            coordinates: [toLat, toLng],
            category: location.to.type,
            // Add other required fields for parking area
          };
          setSelectedArea(selectedParkingArea);
        } else {
          console.warn('Invalid navigation coordinates:', location);
          return; // Don't proceed with invalid coordinates
        }
        
        // Switch to map view to show the route
        setActiveTab('map');
        
        // Generate route from FROM to TO using OSRM routing service
        const fetchRoute = async () => {
          try {
            // OSRM API - Free OpenStreetMap routing service
            const routeUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
            
            const response = await fetch(routeUrl);
            if (!response.ok) {
              throw new Error('Route calculation failed');
            }
            
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0];
              const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
              
              // Set the route for display on map
              setRoute(coordinates);
              
              console.log('Route calculated successfully:', {
                distance: route.distance,
                duration: route.duration,
                coordinates: coordinates.length
              });
            } else {
              throw new Error('No route found');
            }
          } catch (error) {
            console.error('Error fetching route:', error);
            // Fallback to straight line if routing fails
            setRoute([[fromLat, fromLng], [toLat, toLng]]);
          }
        };
        
        fetchRoute();
      }
    } else if (location.name === 'Temporary Location') {
      setSearchLocation('Adjusting Location');
    } else if (location.name === 'Live Location') {
      setSearchLocation('Live GPS Location');
    } else if (location.name === 'Default Location') {
      setSearchLocation('Default Location');
    } else {
      setSearchLocation(location.name || 'Selected Location');
    }
  }

  // Handle location selection from search
  const handleLocationSelect = (location) => {
    // Always clear previous route and selection on new search
    setSelectedArea(null)
    setRoute(null)
    setRouteInfo(null)
    setSearchedLocation(location)
    
    setActiveTab('map')
    setUserLocation([location.lat, location.lng])
    setMapSearchText(location.name)
    
    // Set search result as a temporary marker
    setTimeout(() => {
      setSelectedArea({
        id: `search-${location.id}`,
        name: location.name,
        coordinates: [location.lat, location.lng],
        category: location.type || 'location',
        isSearchResult: true
      })
    }, 100)
  }

  // Clear all filters function
  const clearAllFilters = () => {
    setSelectedCategories([]) // Clear all categories instead of default selection
    setSelectedVehicleTypes([])
    setSelectedParkingTypes([])
    setParkingDuration('')
    setFilterByAvailability(null)
    setSearchRadius('all') // Reset to ALL
    setSearchLocation('')
    setUserLocation(null)
    setSearchQuery('') // Clear search query
    setShowOnlyReported(false)
    setIsSimulationEnabled(false) // Uncheck simulation checkbox
  }

  // Fetch all parking data without any filters
  const fetchAllParkingData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/parking')
      const result = await response.json()
      if (result && result.data) {
        setAllParkingData(result.data)
      }
    } catch (error) {
      console.error('Error fetching all parking data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch parking data with filters
  const fetchParkingData = async () => {
    try {
      setIsLoading(true)
      
      const params = new URLSearchParams()
      
      // Only add SIMULATE parameters when checkbox is checked
      if (isSimulationEnabled) {
        const timeString = currentTime.toTimeString().slice(0, 5)
        const dayString = currentTime.toLocaleDateString('en-US', { weekday: 'long' })
        
        params.append('SIMULATE_TIME', timeString)
        params.append('SIMULATE_DAY', dayString)
      }
      
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategories.length > 0) params.append('category', selectedCategories.join(','))
      if (selectedVehicleTypes.length > 0) params.append('vehicleType', selectedVehicleTypes.join(','))
      if (selectedParkingTypes.length > 0) params.append('parkingType', selectedParkingTypes.join(','))
      if (parkingDuration) params.append('minDuration', parkingDuration)
      if (filterByAvailability) params.append('available', filterByAvailability === 'available' ? 'true' : 'false')
      if (searchRadius && searchRadius !== 'all') params.append('radius', searchRadius)
      if (userLocation) {
        params.append('lat', userLocation[0])
        params.append('lng', userLocation[1])
      }
      
      const url = `/api/parking${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url)
      const result = await response.json()
      if (result && result.data) {
        setParkingData(result.data)
      }
    } catch (error) {
      console.error('Error fetching parking data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Combined refresh function
  const refreshData = () => {
    fetchParkingData()
    fetchAllParkingData()
  }

  useEffect(() => {
    fetchParkingData()
  }, [currentTime, isSimulationEnabled, selectedCategories, selectedVehicleTypes, selectedParkingTypes, parkingDuration, filterByAvailability, searchRadius, userLocation, searchQuery])

  // Fetch all parking data when component mounts or when switching views
  useEffect(() => {
    if (activeTab === 'list' || listViewTab === 'parking') {
      fetchAllParkingData()
    }
  }, [activeTab, listViewTab])

  return (
    <>
    <AuthProvider>
      <ReportsProvider>
        <FavoritesProvider>
          {/* UI implementation continues ... */}
      <div className="h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 z-30 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-gray-900">Parking Clarity</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:bg-gray-200"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Location Source Dropdown & Radius */}
        <div className="space-y-3 mb-3">
          <div className="flex items-center justify-between gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Find packing spots From:</span>
              <select
                value={locationSource}
                onChange={(e) => handleLocationSourceChange(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 transition-all"
              >
                <option value="current">Current location</option>
                <option value="search">Search location</option>
              </select>
            </div>
            <div className="flex items-center gap-2 border-l pl-3 border-gray-300">
              <span className="text-sm font-semibold text-gray-700">Radius:</span>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 transition-all"
              >
                <option value="all">ALL</option>
                <option value="1000">1 KM</option>
                <option value="2000">2 KM</option>
                <option value="5000">5 KM</option>
                <option value="10000">10 KM</option>
              </select>
            </div>
          </div>

          {/* Conditional Search Bar */}
          {locationSource === 'search' && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <button
                onClick={() => setIsLocationSearchOpen(true)}
                className="flex-1 relative bg-white border-2 border-blue-500 rounded-xl px-4 py-3 text-left text-gray-700 shadow-md transform active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {mapSearchText || 'Search for parking, places...'}
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Tab Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors min-h-[40px] ${
              activeTab === 'map'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors min-h-[40px] ${
              activeTab === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50"
          style={{ zIndex: 9999 }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto"
            style={{ zIndex: 10000 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Menu Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-6 text-white z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">🅿️</span>
                    Parking Filters
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">Find your perfect parking spot</p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-white hover:bg-white/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <ClarityTime
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                isSimulationEnabled={isSimulationEnabled}
                setIsSimulationEnabled={setIsSimulationEnabled}
              />

              {/* Search Section */}
              <div className="space-y-2">
                
                {/* <div className="relative">
                  <input
                    type="text"
                    placeholder="Search name or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base shadow-sm transition-all duration-200"
                  />
                  <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div> */}
              </div>
            </div>

            {/* Clear Filters Button - Mobile */}
           

            {/* Tab Navigation */}
          

            {/* Category Filter */}
            <div className="px-4 pb-4">
            

            

           

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Vehicle Type</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'car', label: '🚗 Car' },
                    { key: 'motorcycle', label: '🏍️ Motorcycle' },
                    { key: 'bicycle', label: '🚲 Bicycle' },
                    { key: 'truck', label: '🚛 Truck' },
                    { key: 'ev', label: '⚡ EV' }
                  ].map((vehicle) => (
                    <button
                      key={vehicle.key}
                      onClick={() => {
                        if (selectedVehicleTypes.includes(vehicle.key)) {
                          setSelectedVehicleTypes(selectedVehicleTypes.filter(v => v !== vehicle.key))
                        } else {
                          setSelectedVehicleTypes([...selectedVehicleTypes, vehicle.key])
                        }
                      }}
                      className={`px-3 py-2 rounded-full text-xs font-medium transition-colors min-h-[36px] ${
                        selectedVehicleTypes.includes(vehicle.key)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {vehicle.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Parking Type</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'free', label: '🆓 Free' },
                    { key: 'paid', label: '💰 Paid' },
                    { key: 'street', label: '🅿️ Street' },
                    { key: 'covered', label: '🏢 Covered' },
                    { key: 'valet', label: '🚗 Valet' }
                  ].map((type) => (
                    <button
                      key={type.key}
                      onClick={() => {
                        if (selectedParkingTypes.includes(type.key)) {
                          setSelectedParkingTypes(selectedParkingTypes.filter(t => t !== type.key))
                        } else {
                          setSelectedParkingTypes([...selectedParkingTypes, type.key])
                        }
                      }}
                      className={`px-3 py-2 rounded-full text-xs font-medium transition-colors min-h-[36px] ${
                        selectedParkingTypes.includes(type.key)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Parking Duration (minutes)</h3>
                <input
                  type="number"
                  placeholder="e.g., 45"
                  value={parkingDuration}
                  onChange={(e) => setParkingDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                  min="1"
                  max="1440"
                />
                {parkingDuration && (
                  <p className="text-xs text-gray-500 mt-1">
                    Show only spots where you can park for {parkingDuration} minutes
                  </p>
                )}
              </div>

               <div className="px-4 pb-4">
              <button
                onClick={() => {
                  clearAllFilters()
                  setIsMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All Filters
              </button>
            </div>

              {/* <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Public Areas Near You</h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search name or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                  />
                  <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div> */}
                
              {/* <ParkingList
                parkingData={parkingData}
                isLoading={isLoading}
                selectedArea={selectedArea}
                setSelectedArea={setSelectedArea}
                currentTime={currentTime}
                selectedCategories={selectedCategories}
                selectedVehicleTypes={selectedVehicleTypes}
                selectedParkingTypes={selectedParkingTypes}
                parkingDuration={parkingDuration}
                filterByAvailability={filterByAvailability}
                onAreaSelect={() => setIsMobileMenuOpen(false)}
                clearAllFilters={clearAllFilters}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchRadius={searchRadius}
              /> */}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-96 lg:bg-gradient-to-b lg:from-white lg:to-gray-50 lg:border-r lg:border-gray-200 lg:overflow-y-auto lg:flex-col lg:shadow-xl">
          {/* Beautiful Sidebar Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <span className="text-3xl">🅿️</span>
                  Parking Clarity
                </h1>
                <p className="text-blue-100 text-sm mt-1">Find your perfect parking spot</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-4">
            <ClarityTime 
              currentTime={currentTime}
              setCurrentTime={setCurrentTime}
              isSimulationEnabled={isSimulationEnabled}
              setIsSimulationEnabled={setIsSimulationEnabled}
            />
          </div>
          
          {/* Tab Navigation */}
          <div className="px-4 pb-4">
            <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-1 mb-4 shadow-inner">
              <button
                onClick={() => setSidebarView('parking')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  sidebarView === 'parking'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <span className="text-lg">🅿️</span>
                Parking
              </button>
              <button
                onClick={() => setSidebarView('favorites')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  sidebarView === 'favorites'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <span className="text-lg">⭐</span>
                Favorites
              </button>
            </div>

            {/* Clear Filters Button */}
            {sidebarView === 'parking' && (
              <div className="mb-6">
                <button
                  onClick={clearAllFilters}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All Filters
                </button>
              </div>
            )}

            {sidebarView === 'parking' && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'map'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Map Explorer
                </button>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List Only
                </button>
              </div>
            )}
          </div>
          
          {/* Filters */}
          <div className="px-4 pb-4">
            {sidebarView === 'parking' ? (
              <>
                {/* Location Search & Radius */}
                <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Search From</label>
                      <select
                        value={locationSource}
                        onChange={(e) => handleLocationSourceChange(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-all font-medium"
                      >
                        <option value="current">📍 Current location</option>
                        <option value="search">🔍 Search location</option>
                      </select>
                    </div>

                    {locationSource === 'search' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <button
                          onClick={() => setIsLocationSearchOpen(true)}
                          className="w-full relative bg-white border-2 border-blue-500 rounded-xl px-4 py-3 text-left text-gray-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span className="text-sm font-semibold">
                              {mapSearchText || 'Search location...'}
                            </span>
                          </div>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-sm font-semibold text-gray-600">Search Radius:</span>
                      <select
                        value={searchRadius}
                        onChange={(e) => setSearchRadius(e.target.value)}
                        className="bg-transparent border-none text-blue-600 text-sm font-bold focus:ring-0 p-0 cursor-pointer"
                      >
                        <option value="all">ALL</option>
                        <option value="1000">1 KM</option>
                        <option value="2000">2 KM</option>
                        <option value="5000">5 KM</option>
                        <option value="10000">10 KM</option>
                      </select>
                    </div>

                    {locationSource === 'current' && (
                      <button
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                const userCoords = [position.coords.latitude, position.coords.longitude]
                                setUserLocation(userCoords)
                                setSearchLocation('Current Location')
                                setActiveTab('map')
                                setSelectedArea({
                                  id: 'current-location',
                                  name: 'Your Current Location',
                                  coordinates: userCoords,
                                  category: 'Location',
                                  isCurrentLocation: true
                                })
                                setTimeout(() => setSelectedArea(null), 2000)
                              },
                              (error) => console.error('Location error:', error)
                            )
                          }
                        }}
                        className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                      >
                        <span>�</span> Refresh Current location
                      </button>
                    )}
                  </div>
                </div>



              

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Vehicle Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'car', label: '🚗 Car' },
                      { key: 'motorcycle', label: '🏍️ Motorcycle' },
                      { key: 'bicycle', label: '🚲 Bicycle' },
                      { key: 'truck', label: '🚛 Truck' },
                      { key: 'ev', label: '⚡ EV' }
                    ].map((vehicle) => (
                      <button
                        key={vehicle.key}
                        onClick={() => {
                          if (selectedVehicleTypes.includes(vehicle.key)) {
                            setSelectedVehicleTypes(selectedVehicleTypes.filter(v => v !== vehicle.key))
                          } else {
                            setSelectedVehicleTypes([...selectedVehicleTypes, vehicle.key])
                          }
                        }}
                        className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                          selectedVehicleTypes.includes(vehicle.key)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {vehicle.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Parking Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'free', label: '🆓 Free' },
                      { key: 'paid', label: '💰 Paid' },
                      { key: 'street', label: '🅿️ Street' },
                      { key: 'covered', label: '🏢 Covered' },
                      { key: 'valet', label: '🚗 Valet' }
                    ].map((type) => (
                      <button
                        key={type.key}
                        onClick={() => {
                          if (selectedParkingTypes.includes(type.key)) {
                            setSelectedParkingTypes(selectedParkingTypes.filter(t => t !== type.key))
                          } else {
                            setSelectedParkingTypes([...selectedParkingTypes, type.key])
                          }
                        }}
                        className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                          selectedParkingTypes.includes(type.key)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Parking Duration (minutes)</h3>
                  <input
                    type="number"
                    placeholder="e.g., 45"
                    value={parkingDuration}
                    onChange={(e) => setParkingDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="1440"
                  />
                  {parkingDuration && (
                    <p className="text-xs text-gray-500 mt-1">
                      Show only spots where you can park for {parkingDuration} minutes
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    Search Parking Areas
                  </h2>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search name or type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base shadow-sm transition-all duration-200"
                    />
                    <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                <ParkingList 
                  parkingData={parkingData}
                  isLoading={isLoading}
                  selectedArea={selectedArea}
                  setSelectedArea={setSelectedArea}
                  currentTime={currentTime}
                  selectedCategories={selectedCategories}
                  selectedVehicleTypes={selectedVehicleTypes}
                  selectedParkingTypes={selectedParkingTypes}
                  parkingDuration={parkingDuration}
                  filterByAvailability={filterByAvailability}
                  onAreaSelect={() => setIsMobileMenuOpen(false)}
                  clearAllFilters={clearAllFilters}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  searchRadius={searchRadius}
                  refreshData={refreshData} // Added refresh callback
                  navigate={navigate} // Pass navigate function
                  activeLocation={activeLocation}
                />
              </>
            ) : (
              <FavoritesList />
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 overflow-hidden relative">
          {activeTab === 'map' ? (
            <MapView 
              parkingData={parkingData}
              isLoading={isLoading}
              selectedArea={selectedArea}
              setSelectedArea={setSelectedArea}
              currentTime={currentTime}
              selectedCategories={selectedCategories}
              selectedVehicleTypes={selectedVehicleTypes}
              selectedParkingTypes={selectedParkingTypes}
              parkingDuration={parkingDuration}
              filterByAvailability={filterByAvailability}
              route={route}
              setRoute={setRoute}
              routeInfo={routeInfo}
              setRouteInfo={setRouteInfo}
              mapSearchText={mapSearchText}
              searchRadius={searchRadius}
              onLocationSelect={handleMapLocationSelect}
              liveLocation={liveLocation}
              setLiveLocation={setLiveLocation}
              tempLocation={tempLocation}
              setTempLocation={setTempLocation}
              confirmedLocation={confirmedLocation}
              setConfirmedLocation={setConfirmedLocation}
              isAdjustMode={isAdjustMode}
              setIsAdjustMode={setIsAdjustMode}
              searchedLocation={searchedLocation}
              zoomTrigger={zoomTrigger}
            />
          ) : (
            <div className="w-full h-full bg-gray-50 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Parking Areas List</h2>
                
                {/* List View Tabs */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                  <button
                    onClick={() => setListViewTab('parking')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      listViewTab === 'parking'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🅿️ All Parking
                  </button>
                  <button
                    onClick={() => setListViewTab('favorites')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      listViewTab === 'favorites'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ⭐ Favorites
                  </button>
                  <button
                    onClick={() => setListViewTab('reports')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      listViewTab === 'reports'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📋 Reports
                  </button>
                </div>

                {/* Tab Content */}
                {listViewTab === 'parking' ? (
                  <ParkingList 
                    parkingData={parkingData} // Use filtered parkingData for list view
                    isLoading={isLoading}
                    selectedArea={selectedArea}
                    setSelectedArea={setSelectedArea}
                    currentTime={currentTime}
                    fullWidth={true}
                    onAreaSelect={handleMobileMenuClose}
                    selectedCategories={selectedCategories}
                    selectedVehicleTypes={selectedVehicleTypes}
                    selectedParkingTypes={selectedParkingTypes}
                    parkingDuration={parkingDuration}
                    filterByAvailability={filterByAvailability}
                    clearAllFilters={clearAllFilters}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showAllData={false} // Use filtered data
                    showOnlyReported={showOnlyReported} 
                    searchRadius={searchRadius}
                    refreshData={refreshData} // Added refresh callback
                    navigate={navigate} // Pass navigate function
                    activeLocation={activeLocation}
                  />
                ) : listViewTab === 'favorites' ? (
                  <FavoritesList 
                    selectedArea={selectedArea}
                    setSelectedArea={setSelectedArea}
                    currentTime={currentTime}
                    fullWidth={true}
                  />
                ) : (
                  <ReportsList />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Location Search Modal */}
      <LocationSearch
        isOpen={isLocationSearchOpen}
        onClose={() => setIsLocationSearchOpen(false)}
        onLocationSelect={handleLocationSelect}
      />
      </div>
    </FavoritesProvider>
    </ReportsProvider>
    </AuthProvider>
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
    </>
  )
}

export default App
