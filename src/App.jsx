import { useState, useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ClarityTime from './components/ClarityTime'
import ParkingList from './components/ParkingList'
import MapView from './components/MapView'
import FavoritesList from './components/FavoritesList'
import ReportsList from './components/ReportsList'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { ReportsProvider } from './contexts/ReportsContext'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'

function App() {
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
              onChange={(e) => setSearchRadius(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ALL</option>
              <option value="1000">Up to 1 KM</option>
              <option value="2000">Up to 2 KM</option>
              <option value="5000">Up to 5 KM</option>
              <option value="10000">Up to 10 KM</option>
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
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  Search Parking Areas
                </h3>
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
            </div>

            {/* Clear Filters Button - Mobile */}
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

            {/* Tab Navigation */}
            <div className="px-4 pb-4 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                View Mode
              </h3>
              <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-1 shadow-inner">
                <button
                  onClick={() => {
                    setActiveTab('map')
                    setIsMobileMenuOpen(false)
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'map'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <span className="text-lg">🗺️</span>
                  Map
                </button>
                <button
                  onClick={() => {
                    setActiveTab('list')
                    setIsMobileMenuOpen(false)
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'list'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <span className="text-lg">📋</span>
                  List
                </button>
              </div>
            </div>

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
                searchRadius={searchRadius}
              />
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
                        onChange={(e) => setSearchRadius(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">ALL</option>
                        <option value="1000">Up to 1 KM</option>
                        <option value="2000">Up to 2 KM</option>
                        <option value="5000">Up to 5 KM</option>
                        <option value="10000">Up to 10 KM</option>
                      </select>
                      <button
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                const userCoords = [position.coords.latitude, position.coords.longitude]
                                setUserLocation(userCoords)
                                setSearchLocation('Current Location')
                                
                                // Switch to map view and close mobile menu if open
                                setActiveTab('map')
                                setIsMobileMenuOpen(false)
                                
                                // Set user location as selected area to trigger map zoom
                                setSelectedArea({
                                  id: 'current-location',
                                  name: 'Your Current Location',
                                  coordinates: userCoords,
                                  category: 'Location',
                                  isCurrentLocation: true // Flag to identify current location
                                })
                                
                                // Clear selected area after a short delay to hide popup
                                setTimeout(() => {
                                  setSelectedArea(null)
                                }, 2000) // Clear after 2 seconds
                              },
                              (error) => console.error('Location error:', error)
                            )
                          }
                        }}
                        className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        📍 Current Location
                      </button>
                    </div>
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
                    showAllData={true} 
                    showOnlyReported={showOnlyReported} 
                    searchRadius={searchRadius}
                    refreshData={refreshData} // Added refresh callback
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
