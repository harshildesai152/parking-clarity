import { useState, useEffect } from 'react'

const ClarityTime = ({ currentTime, setCurrentTime, isSimulationEnabled, setIsSimulationEnabled }) => {
  const [simulateTime, setSimulateTime] = useState(
    currentTime.toTimeString().slice(0, 5)
  )
  const [simulateDay, setSimulateDay] = useState(
    currentTime.toLocaleDateString('en-US', { weekday: 'long' })
  )
  const [liveCurrentTime, setLiveCurrentTime] = useState(new Date())

  // Live time update effect
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleTimeChange = (newTime) => {
    setSimulateTime(newTime)
    const [hours, minutes] = newTime.split(':')
    const newDate = new Date(currentTime)
    newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    setCurrentTime(newDate)
  }

  const handleDayChange = (newDay) => {
    setSimulateDay(newDay)
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayIndex = daysOfWeek.indexOf(newDay)
    const newDate = new Date(currentTime)
    const currentDayIndex = newDate.getDay()
    const diff = dayIndex - currentDayIndex
    newDate.setDate(newDate.getDate() + diff)
    setCurrentTime(newDate)
  }

  const handleCheckboxChange = (checked) => {
    setIsSimulationEnabled(checked)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">CLARITY TIME</h3>
        
        {/* Simulation Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isSimulationEnabled}
            onChange={(e) => handleCheckboxChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-sm font-medium text-gray-700">Simulate Time</span>
        </label>
      </div>

      {/* Show simulation controls only when checkbox is checked */}
      {isSimulationEnabled && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SIMULATE TIME
            </label>
            <input
              type="time"
              value={simulateTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SIMULATE DAY
            </label>
            <select
              value={simulateDay}
              onChange={(e) => handleDayChange(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
            >
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {isSimulationEnabled ? 'Viewing for' : 'Current time'}{' '}
          {isSimulationEnabled ? (
            currentTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })
          ) : (
            `${liveCurrentTime.getHours().toString().padStart(2, '0')}:${liveCurrentTime.getMinutes().toString().padStart(2, '0')}:${liveCurrentTime.getSeconds().toString().padStart(2, '0')}`
          )}
          {isSimulationEnabled && (
            <span className="ml-1">
              on {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

export default ClarityTime
