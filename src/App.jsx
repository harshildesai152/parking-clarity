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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
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
          
          <div className="px-4 pb-4">
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
            />
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          {activeTab === 'map' ? (
            <MapView 
              selectedArea={selectedArea}
              setSelectedArea={setSelectedArea}
              currentTime={currentTime}
            />
          ) : (
            <div className="w-full h-full bg-gray-50 p-8 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Parking Areas List</h2>
                <ParkingList 
                  selectedArea={selectedArea}
                  setSelectedArea={setSelectedArea}
                  currentTime={currentTime}
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
