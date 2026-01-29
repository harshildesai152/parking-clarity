import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const ReportsContext = createContext()

export const useReports = () => {
  const context = useContext(ReportsContext)
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider')
  }
  return context
}

export const ReportsProvider = ({ children }) => {
  const [reports, setReports] = useState([])

  // API to set data show
  const { token } = useAuth()

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/reports')
        if (response.ok) {
          const data = await response.json()
          setReports(data)
        }
      } catch (error) {
        console.error('Error fetching reports:', error)
      }
    }
    fetchReports()
  }, [token])

  const addReport = (report) => {
    const newReport = {
      id: Date.now().toString(),
      ...report,
      timestamp: new Date().toISOString()
    }
    setReports(prev => [newReport, ...prev])
  }

  const deleteReport = (reportId) => {
    setReports(prev => prev.filter(report => report.id !== reportId))
  }

  const getReportsByParkingArea = (parkingAreaName) => {
    return reports.filter(report => report.parkingArea === parkingAreaName)
  }

  const getReportCount = () => {
    return reports.length
  }

  const value = {
    reports,
    addReport,
    deleteReport,
    getReportsByParkingArea,
    getReportCount
  }

  return (
    <ReportsContext.Provider value={value}>
      {children}
    </ReportsContext.Provider>
  )
}
