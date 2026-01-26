import { useState } from 'react'
import { useReports } from '../contexts/ReportsContext'

const ReportsList = () => {
  const { reports, deleteReport } = useReports()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [reportToDelete, setReportToDelete] = useState(null)

  const handleDeleteClick = (report) => {
    setReportToDelete(report)
    setShowConfirmDialog(true)
  }

  const confirmDelete = () => {
    if (reportToDelete) {
      deleteReport(reportToDelete.id)
      setShowConfirmDialog(false)
      setReportToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowConfirmDialog(false)
    setReportToDelete(null)
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-gray-500 text-sm">No reports submitted yet</p>
        <p className="text-gray-400 text-xs mt-1">Reports will appear here when users submit parking issues</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          All Reports ({reports.length})
        </h3>
      
      </div>

      {reports.map((report) => (
        <div
          key={report.id}
          className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-500">🚨</span>
                <h4 className="font-medium text-gray-900 text-sm">{report.parkingArea}</h4>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <span>Reported by {report.reportedBy}</span>
                <span>•</span>
                <span>{formatDate(report.timestamp)}</span>
              </div>
              <div className="text-xs text-gray-600 mb-2">
                <strong>Reason:</strong> {report.reason}
              </div>
              {report.time && (
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Time observed: {report.time}
                </div>
              )}
              {report.duration && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Duration: {report.duration}
                </div>
              )}
            </div>
            
          </div>
        </div>
      ))}

      {/* Confirmation Dialog Modal */}
      
    </div>
  )
}

export default ReportsList
