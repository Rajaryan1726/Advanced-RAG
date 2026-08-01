import { UploadCloud, FolderOpen } from 'lucide-react'

const UploadPage = () => {
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
          Supports .srt, .vtt, .pdf, .docx, and .csv. Folder names like
          "module-1" are used to auto-detect the module number.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all shadow-lg shadow-primary/20"
        >
          <FolderOpen size={16} />
          Choose folder
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Upload functionality coming in the next build step.
      </p>
    </div>
  )
}

export default UploadPage