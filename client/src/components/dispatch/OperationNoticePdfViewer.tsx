import { useState } from "react"
import { X, ExternalLink, Loader2 } from "lucide-react"
import type { OperationNotice } from "@/types"

interface OperationNoticePdfViewerProps {
  notice: OperationNotice | null
  open: boolean
  onClose: () => void
}

/** Wrap URL through Google Docs Viewer to bypass X-Frame-Options restrictions */
function getViewerUrl(url: string): string {
  return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`
}

export function OperationNoticePdfViewer({ notice, open, onClose }: OperationNoticePdfViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  if (!open || !notice) return null

  const fileUrl = notice.fileUrl || ''
  const viewerUrl = getViewerUrl(fileUrl)

  const handleOpenNewTab = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-[520px] max-w-[90vw] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-blue-50 border-b border-blue-200">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-800 truncate">
              TB: {notice.noticeNumber}
            </h3>
            <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-gray-600">
              {notice.issueDate && <span>Ngay BH: {notice.issueDate}</span>}
              {notice.issuingAuthority && <span>{notice.issuingAuthority}</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors ml-2"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 relative overflow-hidden">
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              <span className="ml-2 text-sm text-gray-500">Dang tai PDF...</span>
            </div>
          )}

          {error ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <p className="text-sm text-gray-600 mb-4">
                Khong the hien thi PDF truc tiep. Vui long mo trong tab moi.
              </p>
              <button
                type="button"
                onClick={handleOpenNewTab}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Mo trong tab moi
              </button>
            </div>
          ) : (
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              title={`Thong bao ${notice.noticeNumber}`}
              onLoad={() => setLoading(false)}
              onError={() => { setError(true); setLoading(false) }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t bg-gray-50">
          <button
            type="button"
            onClick={handleOpenNewTab}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Mo tab moi
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Dong
          </button>
        </div>
      </div>
    </div>
  )
}
