// User utility functions for localStorage management

export const getUserId = () => {
  // Try to get user ID from auth context or token first
  // This is where you'd integrate with your authentication system
  
  // Option 1: From JWT token (if you use JWT)
  const token = localStorage.getItem('token')
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.userId || payload.sub || 'authenticated_user'
    } catch (error) {
      console.error('Error parsing token:', error)
    }
  }
  
  // Option 2: From user data object (if you store user info)
  const userData = localStorage.getItem('userData')
  if (userData) {
    try {
      const user = JSON.parse(userData)
      return user.id || user._id || user.userId
    } catch (error) {
      console.error('Error parsing user data:', error)
    }
  }
  
  // Option 3: From dedicated user ID field
  const userId = localStorage.getItem('userId')
  if (userId) {
    return userId
  }
  
  // Option 4: Generate unique ID for guest users
  let guestId = localStorage.getItem('guestUserId')
  if (!guestId) {
    guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('guestUserId', guestId)
  }
  
  return guestId
}

export const getUserStorageKey = (key) => {
  const userId = getUserId()
  return `${key}_${userId}`
}

export const clearUserData = () => {
  // Clear all user-specific data when logging out
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.includes(getUserId())) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
}
