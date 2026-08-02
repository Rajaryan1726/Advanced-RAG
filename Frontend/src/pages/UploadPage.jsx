import { useState } from 'react'
import {
  UploadCloud,
  FolderOpen,
  FilePlus,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
} from 'lucide-react'
import useUpload from '../hooks/useUpload.js'

const statusConfig = {
  pending: { label: 'Pending', icon: Circle, className: 'text-muted-foreground' },
  manifested: { label: 'Ready', icon: CheckCircle2, className: 'text-primary' },
  uploading: { label: 'Uploading', icon: Loader2, className: 'text-accent animate-spin' },
  done: { label: 'Uploaded', icon: CheckCircle2, className: 'text-green-500' },
  error: { label: 'Failed', icon: XCircle, className: 'text-destructive' },
  processing: { label: 'Processing', icon: Loader2, className: 'text-amber-500 animate-spin' },
}

const UploadPage = () => {
  const {
    files,
    isBuildingManifest,
    manifestError,
    manifestWarning,
    overallStatus,
    selectFiles,
    addLooseFiles,
    setManualModuleNumber,
    buildManifest,
    uploadFiles,
  } = useUpload()

  const [overrideDrafts, setOverrideDrafts] = useState({})

  const handleFileInputChange = (e) => {
    selectFiles(e.target.files)
  }

  const handleLooseFileInputChange = (e) => {
    addLooseFiles(e.target.files)
  }

  const handleOverrideChange = (relativePath, value) => {
    setOverrideDrafts((prev) => ({ ...prev, [relativePath]: value }))
  }

  const handleOverrideConfirm = (relativePath) => {
    const value = Number(overrideDrafts[relativePath])
    if (Number.isInteger(value) && value > 0) {
      setManualModuleNumber(relativePath, value)
    }
  }

  const manifestedCount = files.filter((f) => f.status === 'manifested').length
  const doneCount = files.filter((f) => f.status === 'done').length
  const needsOverrideCount = files.filter((f) => f.needsModuleNumber).length
  const hasManifested = manifestedCount > 0

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Upload course content
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add lecture transcripts, subtitles, or documents to a module.
        </p>
      </div>

      <div className="border-2 border-dashed border-border rounded-xl bg-card/50 hover:border-primary/50 hover:bg-card transition-colors py-16 px-6 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <UploadCloud size={26} className="text-primary" />
        </div>
        <h2 className="text-base font-medium text-foreground mb-1">
          Drag a folder here, or browse
        </h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Supports .srt, .vtt, .pdf, .docx, .pptx, and .csv. Folder names like
          "module-1" are used to auto-detect the module number.
        </p>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all shadow-lg shadow-primary/20 cursor-pointer">
            <FolderOpen size={16} />
            Choose folder
            <input
              type="file"
              webkitdirectory="true"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />
          </label>

          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary/50 transition-colors cursor-pointer">
            <FilePlus size={16} />
            Add individual files
            <input
              type="file"
              multiple
              onChange={handleLooseFileInputChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {manifestWarning && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-500">
              Module number not detected
            </p>
            <p className="text-xs text-amber-500/80 mt-0.5">{manifestWarning}</p>
          </div>
        </div>
      )}

      {manifestError && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <XCircle size={18} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{manifestError}</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6 border border-border rounded-xl bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </p>
              {doneCount > 0 ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {doneCount} of {files.length} uploaded
                </p>
              ) : hasManifested ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {manifestedCount} ready to upload
                  {needsOverrideCount > 0 ? `, ${needsOverrideCount} need a module number` : ''}
                </p>
              ) : null}
            </div>

            {hasManifested ? (
              <button
                type="button"
                onClick={uploadFiles}
                disabled={overallStatus === 'uploading'}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
              >
                {overallStatus === 'uploading' ? 'Uploading...' : 'Upload files'}
              </button>
            ) : (
              <button
                type="button"
                onClick={buildManifest}
                disabled={isBuildingManifest}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
              >
                {isBuildingManifest ? 'Building...' : 'Build manifest'}
              </button>
            )}
          </div>

          <ul className="max-h-96 overflow-auto divide-y divide-border">
            {files.map((f, i) => {
              const config = statusConfig[f.status] || statusConfig.pending
              const StatusIcon = config.icon

              return (
                <li
                  key={i}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/40 transition-colors"
                >
                  <FileText size={16} className="text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm text-foreground truncate">
                    {f.relativePath}
                  </span>

                  {f.needsModuleNumber ? (
                    f.moduleNumberOverride ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                        Module {f.moduleNumberOverride} set — rebuild manifest
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="1"
                          placeholder="Module #"
                          value={overrideDrafts[f.relativePath] || ''}
                          onChange={(e) => handleOverrideChange(f.relativePath, e.target.value)}
                          className="w-24 px-2 py-1 rounded-md bg-input border border-border text-xs text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => handleOverrideConfirm(f.relativePath)}
                          className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs hover:bg-secondary/80"
                        >
                          Set
                        </button>
                      </div>
                    )
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.className}`}
                    >
                      <StatusIcon size={14} />
                      {config.label}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default UploadPage