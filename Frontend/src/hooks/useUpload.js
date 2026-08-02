import { useState, useCallback, useRef } from 'react'
import useApi from './useApi.js'
import { fileListToRelativePaths, filterSupportedFiles } from '../lib/uploadHelpers.js'

const MAX_POLL_ATTEMPTS = 30
const POLL_INTERVAL_MS = 2000

const useUpload = () => {
  const [files, setFiles] = useState([])
  const [isBuildingManifest, setIsBuildingManifest] = useState(false)
  const [manifestError, setManifestError] = useState(null)
  const [manifestWarning, setManifestWarning] = useState(null)
  const [batchId, setBatchId] = useState(null)
  const [overallStatus, setOverallStatus] = useState('idle')
  const api = useApi()

  // Tracks poll attempt counts per tempId without triggering re-renders
  const pollAttemptsRef = useRef({})

  const selectFiles = useCallback((fileList) => {
    const filesWithRelativePaths = fileListToRelativePaths(fileList)
    const supportedFiles = filterSupportedFiles(filesWithRelativePaths)

    const filesWithStatus = supportedFiles.map((entry) => ({
      ...entry,
      tempId: null,
      status: 'pending',
      error: null,
      jobId: null,
      moduleNumberOverride: null,
      needsModuleNumber: false,
    }))
    setFiles(filesWithStatus)
    setManifestError(null)
    setManifestWarning(null)
    setOverallStatus('idle')
    pollAttemptsRef.current = {}
  }, [])

  const addLooseFiles = useCallback((fileList) => {
    const entries = Array.from(fileList).map((file) => ({
      file,
      relativePath: file.name,
    }))
    const supportedFiles = filterSupportedFiles(entries)

    const filesWithStatus = supportedFiles.map((entry) => ({
      ...entry,
      tempId: null,
      status: 'pending',
      error: null,
      jobId: null,
      moduleNumberOverride: null,
      needsModuleNumber: true,
    }))

    setFiles((prevFiles) => [...prevFiles, ...filesWithStatus])
    setManifestError(null)
    setManifestWarning(null)
  }, [])

  const setManualModuleNumber = useCallback((relativePath, moduleNumber) => {
    setFiles((prevFiles) =>
      prevFiles.map((f) =>
        f.relativePath === relativePath
          ? { ...f, moduleNumberOverride: moduleNumber }
          : f
      )
    )
  }, [])

  const buildManifest = useCallback(async () => {
    setIsBuildingManifest(true)
    setManifestError(null)
    setManifestWarning(null)
    try {
      const response = await api.post('/ingest/manifest', {
        files: files.map(({ relativePath, moduleNumberOverride }) => ({
          relativePath,
          ...(moduleNumberOverride ? { moduleNumberOverride } : {}),
        })),
      })

      console.log('RAW manifest response:', response)

      const manifestEntries = response.files || []
      setBatchId(response.batchId || null)
      if (response.warning) {
        setManifestWarning(response.warning)
      }

      setFiles((prevFiles) =>
        prevFiles.map((f) => {
          const match = manifestEntries.find(
            (m) => m.relativePath === f.relativePath
          )
          if (match) {
            const stillUnresolved = match.moduleNumber === null || match.moduleNumber === undefined
            return {
              ...f,
              tempId: match.tempId,
              status: stillUnresolved ? f.status : 'manifested',
              needsModuleNumber: stillUnresolved,
            }
          }
          return f
        })
      )
    } catch (error) {
      console.error('Manifest build error:', error)
      setManifestError(error.message || 'Failed to build manifest')
    } finally {
      setIsBuildingManifest(false)
    }
  }, [files, api])

  const pollJobStatus = useCallback(
    (jobId) => api.get(`/ingest/status/${jobId}`),
    [api]
  )

  const pollJob = useCallback(
    (jobId, tempId) => {
      const attempts = pollAttemptsRef.current[tempId] || 0

      if (attempts >= MAX_POLL_ATTEMPTS) {
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.tempId === tempId
              ? { ...f, status: 'error', error: 'Processing timed out' }
              : f
          )
        )
        return
      }

      pollAttemptsRef.current[tempId] = attempts + 1

      pollJobStatus(jobId)
        .then((result) => {
          console.log('RAW status response:', result)

          if (result.state === 'completed') {
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.tempId === tempId ? { ...f, status: 'done' } : f
              )
            )
          } else if (result.state === 'failed') {
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.tempId === tempId
                  ? { ...f, status: 'error', error: result.failedReason || 'Processing failed' }
                  : f
              )
            )
          } else {
            setTimeout(() => pollJob(jobId, tempId), POLL_INTERVAL_MS)
          }
        })
        .catch((error) => {
          console.error('Status poll error for', tempId, error)
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.tempId === tempId
                ? { ...f, status: 'error', error: error.message || 'Status check failed' }
                : f
            )
          )
        })
    },
    [pollJobStatus]
  )

  const uploadFiles = useCallback(async () => {
    setOverallStatus('uploading')

    const toUpload = files.filter((f) => f.status === 'manifested')

    for (const target of toUpload) {
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.tempId === target.tempId ? { ...f, status: 'uploading' } : f
        )
      )

      try {
        const formData = new FormData()
        formData.append('file', target.file)
        formData.append('tempId', target.tempId)

        const response = await api.postForm('/ingest/upload', formData)

        console.log('RAW upload response:', response)

        const jobId = response.jobId || null

        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.tempId === target.tempId
              ? { ...f, status: 'processing', jobId }
              : f
          )
        )

        if (jobId) {
          // Don't await — let polling run in the background so the
          // upload loop can move on to the next file immediately
          pollJob(jobId, target.tempId)
        }
      } catch (error) {
        console.error('Upload error for', target.relativePath, error)
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.tempId === target.tempId
              ? { ...f, status: 'error', error: error.message || 'Upload failed' }
              : f
          )
        )
      }
    }

    setOverallStatus('done')
  }, [files, api, pollJob])

  return {
    files,
    isBuildingManifest,
    manifestError,
    manifestWarning,
    batchId,
    overallStatus,
    selectFiles,
    addLooseFiles,
    setManualModuleNumber,
    buildManifest,
    uploadFiles,
  }
}

export default useUpload