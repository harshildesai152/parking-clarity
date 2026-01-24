import { useState } from 'react'
import ClarityTime from './components/ClarityTime'
import ParkingList from './components/ParkingList'
import MapView from './components/MapView'
import './App.css'

function App() {
  const [selectedArea, setSelectedArea] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLiveMode, setIsLiveMode] = useState(false) // Default to SIMULATE mode
  const [activeTab, setActiveTab] = useState('map') // 'map' or 'list'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState(['Hospital', 'Market', 'Shopping Mall', 'Office'])
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState([])
  const [parkingDuration, setParkingDuration] = useState('')
  const [selectedParkingTypes, setSelectedParkingTypes] = useState([])
  const [searchRadius, setSearchRadius] = useState(1000) // Default 1km
  const [searchLocation, setSearchLocation] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [showAddParkingModal, setShowAddParkingModal] = useState(false)

  return (
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
            className="fixed left-0 top-14 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto"
            style={{ zIndex: 10000 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

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
                  Map Explorer
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
                  List Only
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="px-4 pb-4">
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
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
                  />
                  <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <ParkingList
                selectedArea={selectedArea}
                setSelectedArea={setSelectedArea}
                currentTime={currentTime}
                selectedCategories={selectedCategories}
                selectedVehicleTypes={selectedVehicleTypes}
                selectedParkingTypes={selectedParkingTypes}
                parkingDuration={parkingDuration}
                onAreaSelect={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Parking Spot Modal */}
      {showAddParkingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Add Parking Spot</h2>
                  <p className="text-green-100 mt-1">Help others find parking!</p>
                  <p className="text-xs text-green-200 mt-2">
                    📝 Your submission will be reviewed by the community before being added.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddParkingModal(false)}
                  className="text-green-200 hover:text-white transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spot Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Mall Parking Lot A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" required>
                  <option value="">Select Category</option>
                  <option value="hospital">🏥 Hospital</option>
                  <option value="market">🛒 Market</option>
                  <option value="shopping-mall">🏬 Shopping Mall</option>
                  <option value="office">🏢 Office</option>
                  <option value="restaurant">🍽️ Restaurant</option>
                  <option value="other">📍 Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="21.123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="72.123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parking Type *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" required>
                  <option value="">Select Type</option>
                  <option value="free">🆓 Free Parking</option>
                  <option value="paid">💰 Paid Parking</option>
                  <option value="street">🅿️ Street Parking</option>
                  <option value="covered">🏢 Covered Parking</option>
                  <option value="valet">🚗 Valet Parking</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the parking spot..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Vehicle capacity inputs */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Capacity by Vehicle Type</h4>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'car', label: '🚗 Cars', defaultValue: 50 },
                    { key: 'motorcycle', label: '🏍️ Motorcycles', defaultValue: 25 },
                    { key: 'bicycle', label: '🚲 Bicycles', defaultValue: 10 },
                    { key: 'truck', label: '🚛 Trucks', defaultValue: 5 },
                    { key: 'ev', label: '⚡ Electric Vehicles', defaultValue: 5 }
                  ].map(vehicle => (
                    <div key={vehicle.key} className="flex items-center gap-3">
                      <span className="w-32 text-sm font-medium text-gray-700">{vehicle.label}</span>
                      <input
                        type="number"
                        min="0"
                        defaultValue={vehicle.defaultValue}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="time"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="time"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit for Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddParkingModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
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
          </div>
          
          {/* Filters */}
          <div className="px-4 pb-4">
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
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <ParkingList 
              selectedArea={selectedArea}
              setSelectedArea={setSelectedArea}
              currentTime={currentTime}
              selectedCategories={selectedCategories}
              selectedVehicleTypes={selectedVehicleTypes}
              selectedParkingTypes={selectedParkingTypes}
              parkingDuration={parkingDuration}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 overflow-hidden relative">
          {activeTab === 'map' ? (
            <MapView 
              selectedArea={selectedArea}
              setSelectedArea={setSelectedArea}
              currentTime={currentTime}
              selectedCategories={selectedCategories}
              selectedVehicleTypes={selectedVehicleTypes}
              selectedParkingTypes={selectedParkingTypes}
              parkingDuration={parkingDuration}
            />
          ) : (
            <div className="w-full h-full bg-gray-50 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Parking Areas List</h2>
                <ParkingList 
                  selectedArea={selectedArea}
                  setSelectedArea={setSelectedArea}
                  currentTime={currentTime}
                  selectedCategories={selectedCategories}
                  selectedVehicleTypes={selectedVehicleTypes}
                  selectedParkingTypes={selectedParkingTypes}
                  parkingDuration={parkingDuration}
                  fullWidth={true}
                />
              </div>
            </div>
          )}

          {/* Floating Action Button - Add Parking Spot */}
          <button
            onClick={() => setShowAddParkingModal(true)}
            className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 z-40"
            aria-label="Add Parking Spot"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
