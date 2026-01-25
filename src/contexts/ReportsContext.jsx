import { createContext, useContext, useState, useEffect } from 'react'

const ReportsContext = createContext()

export const useReports = () => {
  const context = useContext(ReportsContext)
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider')
  }
  return context
}

export const ReportsProvider = ({ children }) => {
  const [reports, setReports] = useState([
    {
      id: '1',
      parkingArea: 'Diamond Hospital Varachha',
      reason: 'Parking completely full, no available spots found',
      time: '14:30',
      duration: '45 minutes',
      reportedBy: 'Anonymous User',
      timestamp: '2025-01-25T10:30:00.000Z'
    },
    {
      id: '2',
      parkingArea: 'VR Mall',
      reason: 'Weekend rush, all parking areas occupied',
      time: '16:45',
      duration: '2 hours',
      reportedBy: 'Anonymous User',
      timestamp: '2025-01-25T12:45:00.000Z'
    },
    {
      id: '3',
      parkingArea: 'City Light Mall',
      reason: 'Limited parking available, only 2 spots left',
      time: '11:15',
      duration: '30 minutes',
      reportedBy: 'Anonymous User',
      timestamp: '2025-01-25T07:15:00.000Z'
    },
    {
      id: '4',
      parkingArea: 'Piplod Municipal Market',
      reason: 'Morning market rush, no parking space',
      time: '09:00',
      duration: '1 hour',
      reportedBy: 'Anonymous User',
      timestamp: '2025-01-25T05:00:00.000Z'
    },
    {
      id: '5',
      parkingArea: 'Seemless Shopping Center',
      reason: 'Valet parking full, self-parking also unavailable',
      time: '15:20',
      duration: '1.5 hours',
      reportedBy: 'Anonymous User',
      timestamp: '2025-01-25T11:20:00.000Z'
    }
  ])

  // Load reports from localStorage on mount
  useEffect(() => {
    const savedReports = localStorage.getItem('parkingReports')
    if (savedReports) {
      try {
        const parsedReports = JSON.parse(savedReports)
        // Only use saved reports if they exist, otherwise keep static data
        if (parsedReports.length > 0) {
          setReports(parsedReports)
        }
      } catch (error) {
        console.error('Error loading reports:', error)
      }
    }
  }, [])

  // Save reports to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('parkingReports', JSON.stringify(reports))
  }, [reports])

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
