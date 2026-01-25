import { useState } from 'react'
import { useFavorites } from '../contexts/FavoritesContext'

const FavoritesList = () => {
  const { favorites, removeFromFavorites, isFavorite } = useFavorites()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleClearAll = () => {
    setShowConfirmDialog(true)
  }

  const confirmClearAll = () => {
    favorites.forEach(fav => removeFromFavorites(fav.id))
    setShowConfirmDialog(false)
  }

  const cancelClearAll = () => {
    setShowConfirmDialog(false)
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">⭐</div>
        <p className="text-gray-500 text-sm">No favorite parking spots yet</p>
        <p className="text-gray-400 text-xs mt-1">Click the star icon to add favorites</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Your Favorites ({favorites.length})
          </h3>
          {favorites.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {favorites.map((area) => (
          <div
            key={area.id}
            className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-500">⭐</span>
                  <h4 className="font-medium text-gray-900 text-sm">{area.name}</h4>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{area.category}</span>
                  <span>•</span>
                  <span>{area.distance} km away</span>
                </div>
                {area.description && (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{area.description}</p>
                )}
              </div>
              <button
                onClick={() => removeFromFavorites(area.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Remove from favorites"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {area.operatingHours}
            </div>

            {area.status && (
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                area.status === 'available' ? 'bg-green-100 text-green-800' :
                area.status === 'limited' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {area.status === 'available' ? 'LIKELY AVAILABLE' :
                 area.status === 'limited' ? 'LIMITED / BUSY' :
                 'AVOID RIGHT NOW'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Dialog Modal */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Remove All Favorites?
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to remove all {favorites.length} favorite parking spots? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelClearAll}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearAll}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Remove All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FavoritesList
