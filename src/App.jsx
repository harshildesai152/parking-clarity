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
                onAreaSelect={() => setIsMobileMenuOpen(false)}
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
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {activeTab === 'map' ? (
            <MapView
              selectedArea={selectedArea}
              setSelectedArea={setSelectedArea}
              currentTime={currentTime}
              selectedCategories={selectedCategories}
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
                  fullWidth={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
