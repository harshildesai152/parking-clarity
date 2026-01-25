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
        {reports.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Delete all reports? This action cannot be undone.')) {
                reports.forEach(report => deleteReport(report.id))
              }
            }}
            className="text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            Clear All
          </button>
        )}
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
            <button
              onClick={() => handleDeleteClick(report)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Delete report"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {/* Confirmation Dialog Modal */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete Report?
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete this report for "{reportToDelete?.parkingArea}"? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportsList
