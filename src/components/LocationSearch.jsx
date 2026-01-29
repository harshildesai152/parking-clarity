import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserId, getUserStorageKey } from '../utils/userUtils'

const LocationSearch = ({ isOpen, onClose, onLocationSelect }) => {
  const [fromQuery, setFromQuery] = useState('')
  const [fromResults, setFromResults] = useState([])
  const [isSearchingFrom, setIsSearchingFrom] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedFrom, setSelectedFrom] = useState(null)

  const getStorageKey = () => getUserStorageKey('parking_search_history')

  // Load search history from localStorage on component mount
  useEffect(() => {
    if (isOpen) {
      loadSearchHistory()
      setFromQuery('')
      setFromResults([])
      setIsSearchingFrom(false)
      // Set current location as default FROM
      getCurrentLocationAsFrom()
    }
  }, [isOpen])

  // Get current location as default FROM
  const getCurrentLocationAsFrom = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setSelectedFrom({
            name: 'My Current Location',
            lat: latitude,
            lng: longitude,
            hasLocation: true,
            type: 'current'
          })
          // setFromQuery('My Current Location') // Keep query empty so it feels reset
        },
        (error) => {
          console.error('Error getting current location:', error)
          setSelectedFrom({
            name: 'Current Location (Unknown)',
            lat: 21.1951,
            lng: 72.8302,
            hasLocation: true,
            type: 'current'
          })
          // setFromQuery('Current Location (Unknown)') // Keep query empty
        }
      )
    }
  }

  // Load search history from localStorage
  const loadSearchHistory = () => {
    try {
      const storageKey = getStorageKey()
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const history = JSON.parse(stored)
        setSearchHistory(history)
      }
    } catch (error) {
      console.error('Error loading search history:', error)
      setSearchHistory([])
    }
  }

  // Save search history to localStorage
  const saveSearchHistory = (history) => {
    try {
      const storageKey = getStorageKey()
      localStorage.setItem(storageKey, JSON.stringify(history))
    } catch (error) {
      console.error('Error saving search history:', error)
    }
  }

  // Add item to search history
  const addToSearchHistory = (location) => {
    const historyItem = {
      id: location.id,
      name: location.name,
      type: location.type || 'parking',
      location: location.location,
      lat: location.lat,
      lng: location.lng,
      hasLocation: location.hasLocation,
      timestamp: new Date().toISOString()
    }

    const updatedHistory = [historyItem, ...searchHistory.filter(item => item.id !== location.id)]
    const limitedHistory = updatedHistory.slice(0, 10) // Keep only last 10 searches
    
    setSearchHistory(limitedHistory)
    saveSearchHistory(limitedHistory)
  }

  // Clear all search history
  const clearSearchHistory = () => {
    setSearchHistory([])
    try {
      const storageKey = getStorageKey()
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Error clearing search history:', error)
    }
  }

  // Mock data for demonstration - replace with your actual API call
  const mockParkingData = [
    { id: 1, name: 'Pragati Cinemas: Mota Varachha, Surat', type: 'cinema', location: 'Mota Varachha, Surat', lat: 21.2104, lng: 72.8907, hasLocation: true },
    { id: 2, name: 'Neer Mota', type: 'restaurant', location: 'Surat', lat: 21.1951, lng: 72.8302, hasLocation: false },
    { id: 3, name: 'Mota Plaza Parking', type: 'parking', location: 'Varachha, Surat', lat: 21.2054, lng: 72.8856, hasLocation: true },
    { id: 4, name: 'City Center Mall', type: 'mall', location: 'Surat', lat: 21.1865, lng: 72.8354, hasLocation: true },
    { id: 5, name: 'Mota Garden', type: 'park', location: 'Surat', lat: 21.1987, lng: 72.8421, hasLocation: true },
  ]


  // Search FROM locations using multiple APIs with fallback
  const searchFromLocations = async (query) => {
    if (!query.trim()) {
      setFromResults([])
      return
    }

    setIsSearchingFrom(true)
    
    try {
      // Try different APIs in order of preference
      const apis = [
        {
          name: 'Photon',
          url: `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
          transform: (data) => data.features?.map(item => ({
            id: `photon_${item.properties?.osm_id || Math.random()}`,
            name: item.properties?.name || item.properties?.city || item.properties?.country || 'Location',
            type: item.properties?.osm_type || 'location',
            location: `${item.properties?.name || ''}, ${item.properties?.city || ''}, ${item.properties?.country || ''}`.replace(/^, |, $/g, ''),
            lat: item.geometry?.coordinates?.[1],
            lng: item.geometry?.coordinates?.[0],
            hasLocation: !!(item.geometry?.coordinates?.[1] && item.geometry?.coordinates?.[0])
          })) || []
        },
        {
          name: 'OpenCage',
          url: `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=YOUR_OPENCAGE_KEY&limit=5`,
          transform: (data) => data.results?.map(item => ({
            id: `opencage_${item.confidence}_${item.timestamp}`,
            name: item.components?.road || item.formatted?.split(',')[0] || 'Location',
            type: item.components?.category || 'location',
            location: item.formatted,
            lat: item.geometry?.lat,
            lng: item.geometry?.lng,
            hasLocation: !!(item.geometry?.lat && item.geometry?.lng)
          })) || []
        }
      ]

      // Try each API until one works
      for (const api of apis) {
        try {
          if (api.url.includes('YOUR_')) continue;
          
          const response = await fetch(api.url)
          if (!response.ok) continue;
          
          const data = await response.json()
          const transformedResults = api.transform(data)
          
          if (transformedResults.length > 0) {
            setFromResults(transformedResults)
            return
          }
        } catch (error) {
          continue
        }
      }

      // If all APIs fail, use fallback data
      const fallbackResults = getFallbackLocationResults(query)
      setFromResults(fallbackResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearchingFrom(false)
    }
  }

  // Fallback location results for common searches
  const getFallbackLocationResults = (query) => {
    const commonLocations = [
      { id: 'fallback_1', name: 'Current Location', lat: 21.1951, lng: 72.8302, hasLocation: true, location: 'Surat, Gujarat, India' },
      { id: 'fallback_2', name: 'Surat City Center', lat: 21.1702, lng: 72.8311, hasLocation: true, location: 'Surat, Gujarat, India' },
      { id: 'fallback_3', name: 'Varachha', lat: 21.2104, lng: 72.8907, hasLocation: true, location: 'Varachha, Surat, Gujarat, India' },
      { id: 'fallback_4', name: 'Adajan', lat: 21.2016, lng: 72.7895, hasLocation: true, location: 'Adajan, Surat, Gujarat, India' },
      { id: 'fallback_5', name: 'Piplod', lat: 21.1859, lng: 72.8395, hasLocation: true, location: 'Piplod, Surat, Gujarat, India' }
    ]
    
    return commonLocations.filter(loc => 
      loc.name.toLowerCase().includes(query.toLowerCase()) ||
      loc.location.toLowerCase().includes(query.toLowerCase())
    )
  }

  // Search TO locations using your parking API
  const searchToLocations = async (query) => {
    if (!query.trim()) {
      setToResults([])
      return
    }

    setIsSearchingTo(true)
    try {
      // Use your parking API
      const response = await fetch(`/api/parking?search=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      
      // Transform API data to match our format
      const transformedResults = (data.data || []).map(item => ({
        id: `to_${item._id || item.id}`,
        name: item.name,
        type: item.category || 'parking',
        location: `${item.area || ''}, ${item.city || ''}`.replace(/, ,/g, ',').replace(/^, |, $/g, ''),
        lat: item.location?.lat || item.coordinates?.[0] || 21.1951,
        lng: item.location?.lng || item.coordinates?.[1] || 72.8302,
        hasLocation: !!(item.location?.lat && item.location?.lng) || !!(item.coordinates?.[0] && item.coordinates?.[1])
      }))
      
      setToResults(transformedResults)
    } catch (error) {
      console.error('TO search error:', error)
      
      // Fallback to mock data if API fails
      const filteredResults = mockParkingData.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.location.toLowerCase().includes(query.toLowerCase())
      )
      setToResults(filteredResults)
    } finally {
      setIsSearchingTo(false)
    }
  }

  // Debounced search for FROM with rate limiting
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (fromQuery && fromQuery !== 'My Current Location' && fromQuery !== 'Current Location (Unknown)') {
        // Don't re-search if this query was just set from a selection
        if (selectedFrom && fromQuery === selectedFrom.name) {
          return
        }
        
        // Only search if query is at least 2 characters long to reduce API calls
        if (fromQuery.trim().length >= 2) {
          searchFromLocations(fromQuery)
        } else {
          setFromResults([])
        }
      } else {
        setFromResults([])
      }
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [fromQuery])

  // Handle navigation selection
  const handleNavigate = () => {
    if (selectedFrom) {
      // Pass the selected location to parent
      onLocationSelect(selectedFrom)
      onClose()
    } else {
      alert('Please select a location')
    }
  }

  // Handle location selection
  const handleLocationSelect = (location) => {
    if (location.hasLocation) {
      // Add to search history
      addToSearchHistory(location)
      
      // Call parent handler
      onLocationSelect(location)
      onClose()
    }
  }

  // Get icon for result type
  const getResultIcon = (item) => {
    if (item.hasLocation) {
      return (
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      )
    } else {
      return (
        <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex flex-col">
      {/* Search Header */}
      <div className="bg-white p-4 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Navigate to Parking</h2>
        </div>

        {/* FROM and TO Inputs */}
        <div className="space-y-3">
          {/* FROM Input */}
          <div className="relative">
            <div className="absolute left-3 top-3.5 w-5 h-5 text-green-500">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Current location or search..."
              value={fromQuery}
              onChange={(e) => setFromQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {fromQuery && (
              <button
                onClick={() => setFromQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Navigate / Select Button */}
          <button
            onClick={handleNavigate}
            disabled={!selectedFrom}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              selectedFrom
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Select Location
          </button>
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 bg-white overflow-y-auto">
        {/* FROM Results */}
        {isSearchingFrom && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mr-3"></div>
            <span className="text-gray-600">Searching FROM locations...</span>
          </div>
        )}
        {fromQuery && fromResults.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">FROM LOCATIONS</h3>
            <div className="space-y-3">
              {fromResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    setSelectedFrom(result)
                    setFromQuery(result.name)
                    setFromResults([])
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-5 h-5 text-green-500">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{result.name}</h4>
                    <p className="text-sm text-gray-500">{result.location}</p>
                  </div>
                  {result.hasLocation && (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

            {/* Removed TO Results section */}

        {/* Selected Locations Summary */}
        {selectedFrom && (
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">SELECTED LOCATION</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                <div className="w-4 h-4 text-green-500">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">{selectedFrom.name}</h4>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LocationSearch
