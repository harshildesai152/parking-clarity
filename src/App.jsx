import { useState, useEffect } from 'react'
import ClarityTime from './components/ClarityTime'
import ParkingList from './components/ParkingList'
import MapView from './components/MapView'
import FavoritesList from './components/FavoritesList'
import ReportsList from './components/ReportsList'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { ReportsProvider } from './contexts/ReportsContext'
import './App.css'

function App() {
  const [selectedArea, setSelectedArea] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLiveMode, setIsLiveMode] = useState(false) // Default to SIMULATE mode
  const [activeTab, setActiveTab] = useState('map') // 'map' or 'list'
  const [listViewTab, setListViewTab] = useState('parking') // 'parking' or 'reports' for list view
  const [sidebarView, setSidebarView] = useState('parking') // 'parking' or 'favorites'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState([]) // Start with no categories selected
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState([])
  const [parkingDuration, setParkingDuration] = useState('')
  const [selectedParkingTypes, setSelectedParkingTypes] = useState([])
  const [filterByAvailability, setFilterByAvailability] = useState(null) // null, 'available', 'unavailable'
  const [searchRadius, setSearchRadius] = useState(1000) // Default 1km
  const [searchLocation, setSearchLocation] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [parkingData, setParkingData] = useState([])
  const [allParkingData, setAllParkingData] = useState([]) // Separate state for all parking data
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('') // Search query for parking areas

  // Clear all filters function
  const clearAllFilters = () => {
    setSelectedCategories([]) // Clear all categories instead of default selection
    setSelectedVehicleTypes([])
    setSelectedParkingTypes([])
    setParkingDuration('')
    setFilterByAvailability(null)
    setSearchRadius(1000)
    setSearchLocation('')
    setUserLocation(null)
    setSearchQuery('') // Clear search query
  }

  // Fetch all parking data without any filters
  const fetchAllParkingData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:5000/api/parking')
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

  useEffect(() => {
    const fetchParkingData = async () => {
      try {
        setIsLoading(true)
        
        // Build query parameters
        const params = new URLSearchParams()
        
        // Add simulate parameters if not in live mode, or current time if in live mode
        if (!isLiveMode) {
          const timeString = currentTime.toTimeString().slice(0, 5) // HH:MM format
          const dayString = currentTime.toLocaleDateString('en-US', { weekday: 'long' })
          
          params.append('SIMULATE_TIME', timeString)
          params.append('SIMULATE_DAY', dayString)
        } else {
          // In live mode, send current time and day
          const now = new Date()
          const timeString = now.toTimeString().slice(0, 5) // HH:MM format
          const dayString = now.toLocaleDateString('en-US', { weekday: 'long' })
          
          params.append('SIMULATE_TIME', timeString)
          params.append('SIMULATE_DAY', dayString)
        }
        
        // Add other filter parameters
        if (searchQuery) {
          params.append('search', searchQuery)
        }
        if (selectedCategories.length > 0) {
          params.append('category', selectedCategories.join(','))
        }
        if (selectedVehicleTypes.length > 0) {
          params.append('vehicleType', selectedVehicleTypes.join(','))
        }
        if (selectedParkingTypes.length > 0) {
          params.append('parkingType', selectedParkingTypes.join(','))
        }
        if (parkingDuration) {
          params.append('minDuration', parkingDuration)
        }
        if (filterByAvailability) {
          params.append('available', filterByAvailability === 'available' ? 'true' : 'false')
        }
        if (searchRadius) {
          params.append('radius', searchRadius)
        }
        if (userLocation) {
          params.append('lat', userLocation[0])
          params.append('lng', userLocation[1])
        }
        
        const url = `http://localhost:5000/api/parking${params.toString() ? '?' + params.toString() : ''}`
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

    fetchParkingData()
  }, [currentTime, isLiveMode, selectedCategories, selectedVehicleTypes, selectedParkingTypes, parkingDuration, filterByAvailability, searchRadius, userLocation, searchQuery])

  // Auto-refresh data every minute when in live mode
  useEffect(() => {
    let interval;
    if (isLiveMode) {
      interval = setInterval(() => {
        // This will trigger the fetchParkingData effect
        const now = new Date()
        setCurrentTime(now)
      }, 60000) // Refresh every minute
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isLiveMode])

  // Fetch all parking data when component mounts or when switching views
  useEffect(() => {
    if (activeTab === 'list' || listViewTab === 'parking') {
      fetchAllParkingData()
    }
  }, [activeTab, listViewTab])

  return (
    <ReportsProvider>
      <FavoritesProvider>
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

        {/* Location Search & Radius */}
        <div className="space-y-3 mb-3">
          <div className="flex gap-2">
            {/* <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Enter location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div> */}
            {/* <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setUserLocation([position.coords.latitude, position.coords.longitude])
                      setSearchLocation('Current Location')
                    },
                    (error) => console.error('Location error:', error)
                  )
                }
              }}
              className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
            >
              📍
            </button> */}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Radius:</span>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={500}>500m</option>
              <option value={1000}>1km</option>
              <option value={2000}>2km</option>
              <option value={5000}>5km</option>
            </select>
          </div>
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
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Parking Filters</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                isLiveMode={isLiveMode}
                setIsLiveMode={setIsLiveMode}
              />

              {/* Search Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Search Parking</h3>
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
              </div>
            </div>

            {/* Clear Filters Button - Mobile */}
            <div className="px-4 pb-4">
              <button
                onClick={() => {
                  clearAllFilters()
                  setIsMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm shadow-md hover:shadow-lg min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All Filters
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="px-4 pb-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">View Mode</h3>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setActiveTab('map')
                    setIsMobileMenuOpen(false)
                  }}
                  className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                    activeTab === 'map'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🗺️ Map
                </button>
                <button
                  onClick={() => {
                    setActiveTab('list')
                    setIsMobileMenuOpen(false)
                  }}
                  className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                    activeTab === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 List
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="px-4 pb-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Filter by Availability</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterByAvailability(filterByAvailability === 'available' ? null : 'available')}
                    className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                      filterByAvailability === 'available'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ✅ Available
                  </button>
                  <button
                    onClick={() => setFilterByAvailability(filterByAvailability === 'unavailable' ? null : 'unavailable')}
                    className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                      filterByAvailability === 'unavailable'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ❌ Unavailable
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Filter by Category</h3>
                <div className="flex flex-wrap gap-2">
                  {['Hospital', 'Market', 'Shopping Mall', 'Office'].map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        if (selectedCategories.includes(category)) {
                          setSelectedCategories(selectedCategories.filter(c => c !== category))
                        } else {
                          setSelectedCategories([...selectedCategories, category])
                        }
                      }}
                      className={`px-3 py-2 rounded-full text-xs font-medium transition-colors min-h-[36px] ${
                        selectedCategories.includes(category)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
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

              <div className="mb-4">
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
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-96 lg:bg-white lg:border-r lg:border-gray-200 lg:overflow-y-auto lg:flex-col">
          <div className="p-4">
            <ClarityTime 
              currentTime={currentTime}
              setCurrentTime={setCurrentTime}
              isLiveMode={isLiveMode}
              setIsLiveMode={setIsLiveMode}
            />
          </div>
          
          {/* Tab Navigation */}
          <div className="px-4 pb-4">
            <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
              <button
                onClick={() => setSidebarView('parking')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  sidebarView === 'parking'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🅿️ Parking
              </button>
              <button
                onClick={() => setSidebarView('favorites')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  sidebarView === 'favorites'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ⭐ Favorites
              </button>
            </div>

            {/* Clear Filters Button */}
            {sidebarView === 'parking' && (
              <div className="mb-4">
                <button
                  onClick={clearAllFilters}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  {/* <h3 className="text-sm font-semibold text-gray-900 mb-3">Location & Radius</h3> */}
                  <div className="space-y-3">
                    <div className="relative">
                      {/* <input
                        type="text"
                        placeholder="Enter location..."
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      /> */}
                      {/* <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg> */}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Radius:</span>
                      <select
                        value={searchRadius}
                        onChange={(e) => setSearchRadius(Number(e.target.value))}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={500}>500m</option>
                        <option value={1000}>1km</option>
                        <option value={2000}>2km</option>
                        <option value={5000}>5km</option>
                      </select>
                      <button
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                setUserLocation([position.coords.latitude, position.coords.longitude])
                                setSearchLocation('Current Location')
                              },
                              (error) => console.error('Location error:', error)
                            )
                          }
                        }}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                      >
                        📍 Current
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Filter by Availability</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterByAvailability(filterByAvailability === 'available' ? null : 'available')}
                      className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                        filterByAvailability === 'available'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ✅ Available
                    </button>
                    <button
                      onClick={() => setFilterByAvailability(filterByAvailability === 'unavailable' ? null : 'unavailable')}
                      className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                        filterByAvailability === 'unavailable'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ❌ Unavailable
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Filter by Category</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Hospital', 'Market', 'Shopping Mall', 'Office'].map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          if (selectedCategories.includes(category)) {
                            setSelectedCategories(selectedCategories.filter(c => c !== category))
                          } else {
                            setSelectedCategories([...selectedCategories, category])
                          }
                        }}
                        className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                          selectedCategories.includes(category)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
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

                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Public Areas Near You</h2>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search name or type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    parkingData={allParkingData} // Use allParkingData for list view
                    isLoading={isLoading}
                    selectedArea={selectedArea}
                    setSelectedArea={setSelectedArea}
                    currentTime={currentTime}
                    selectedCategories={selectedCategories}
                    selectedVehicleTypes={selectedVehicleTypes}
                    selectedParkingTypes={selectedParkingTypes}
                    parkingDuration={parkingDuration}
                    filterByAvailability={filterByAvailability}
                    fullWidth={true}
                    clearAllFilters={clearAllFilters}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showAllData={true} // Show all data without filters in list view
                  />
                ) : (
                  <ReportsList />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </FavoritesProvider>
    </ReportsProvider>
  )
}

export default App
