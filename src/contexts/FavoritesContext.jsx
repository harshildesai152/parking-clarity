import { createContext, useContext, useState, useEffect } from 'react'

const FavoritesContext = createContext()

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([])

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('parkingFavorites')
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites))
      } catch (error) {
        console.error('Error loading favorites:', error)
      }
    }
  }, [])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('parkingFavorites', JSON.stringify(favorites))
  }, [favorites])

  const addToFavorites = (parkingSpot) => {
    setFavorites(prev => {
      if (!prev.find(fav => fav.id === parkingSpot.id)) {
        return [...prev, parkingSpot]
      }
      return prev
    })
  }

  const removeFromFavorites = (parkingSpotId) => {
    setFavorites(prev => prev.filter(fav => fav.id !== parkingSpotId))
  }

  const toggleFavorite = (parkingSpot) => {
    if (favorites.find(fav => fav.id === parkingSpot.id)) {
      removeFromFavorites(parkingSpot.id)
    } else {
      addToFavorites(parkingSpot)
    }
  }

  const isFavorite = (parkingSpotId) => {
    return favorites.some(fav => fav.id === parkingSpotId)
  }

  const getFavoriteCount = () => {
    return favorites.length
  }

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    getFavoriteCount
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}
