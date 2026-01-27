import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserId, getUserStorageKey } from '../utils/userUtils'

const LocationSearch = ({ isOpen, onClose, onLocationSelect }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [activeFilter, setActiveFilter] = useState('All')

  const getStorageKey = () => getUserStorageKey('parking_search_history')

  // Load search history from localStorage on component mount
  useEffect(() => {
    if (isOpen) {
      loadSearchHistory()
      setSearchQuery('')
      setSearchResults([])
      setIsSearching(false)
    }
  }, [isOpen])

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


  // Search parking locations via API
  const searchParking = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Use your actual parking API
      const response = await fetch(`/api/parking?search=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      
      // Transform API data to match our format
      const transformedResults = (data.data || []).map(item => ({
        id: item._id || item.id,
        name: item.name,
        type: item.category || 'parking',
        location: `${item.area || ''}, ${item.city || ''}`.replace(/, ,/g, ',').replace(/^, |, $/g, ''),
        lat: item.location?.lat || item.coordinates?.[0] || 21.1951,
        lng: item.location?.lng || item.coordinates?.[1] || 72.8302,
        hasLocation: !!(item.location?.lat && item.location?.lng) || !!(item.coordinates?.[0] && item.coordinates?.[1])
      }))
      
      setSearchResults(transformedResults)
    } catch (error) {
      console.error('Search error:', error)
      
      // Fallback to mock data if API fails
      const filteredResults = mockParkingData.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.location.toLowerCase().includes(query.toLowerCase())
      )
      setSearchResults(filteredResults)
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchParking(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

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
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search for parking, places, addresses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        
      </div>

      {/* Search Results */}
      <div className="flex-1 bg-white overflow-y-auto">
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-gray-600">Searching...</span>
          </div>
        ) : searchQuery && searchResults.length > 0 ? (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">SEARCH RESULTS</h3>
            <div className="space-y-3">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleLocationSelect(result)}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  {getResultIcon(result)}
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
        ) : searchQuery && !isSearching ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500 text-center">Try searching with different keywords or check your spelling</p>
          </div>
        ) : searchHistory.length > 0 ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500">RECENT SEARCHES</h3>
              <button
                onClick={clearSearchHistory}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-3">
              {searchHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleLocationSelect(item)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  {getResultIcon(item)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.location}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search for parking locations</h3>
            <p className="text-gray-500 text-center">Find parking spots, malls, cinemas, and more</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LocationSearch
