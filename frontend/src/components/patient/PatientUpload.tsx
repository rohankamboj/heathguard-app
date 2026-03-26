import { useState, useCallback } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import axios from 'axios'
import { patientsApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import type { UploadResult } from '@/types'
import { cn } from '@/lib/utils'

export default function PatientUpload({ onSuccess }: { onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState('')

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    setError('')
    setResult(null)
    if (rejected.length) {
      setError('Only .xlsx and .xls files are accepted')
      return
    }
    const next = accepted[0]
    if (next) setFile(next)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  })

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    setError('')
    setResult(null)

    try {
      const { data } = await patientsApi.upload(file, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100))
      })
      setResult(data)
      setFile(null)
      if (data.successful_records > 0) {
        toast.success(`Uploaded ${data.successful_records} patient records`)
        onSuccess?.()
      } else {
        toast.error('No records were imported')
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail : undefined
      const text = typeof msg === 'string' ? msg : 'Upload failed'
      setError(text)
      toast.error(text)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDownloadTemplate = () => {
    const csv = `Patient ID,First Name,Last Name,Date of Birth,Gender\nPT-001,John,Doe,1990-01-15,Male\nPT-002,Jane,Smith,1985-07-22,Female`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'patient_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg-hg border border-semantic-info/25 bg-semantic-info-bg px-5 py-4">
        <p className="mb-1.5 text-[13px] font-semibold text-semantic-info">
          Required columns (exact names):
        </p>
        <div className="flex flex-wrap gap-2">
          {['Patient ID', 'First Name', 'Last Name', 'Date of Birth', 'Gender'].map((col) => (
            <code
              key={col}
              className="rounded px-2 py-0.5 font-mono text-xs text-semantic-info bg-semantic-info/15"
            >
              {col}
            </code>
          ))}
        </div>
        <p className="mt-2 text-xs text-fg-muted">
          Gender options: Male, Female, Other, Prefer not to say · Date format: YYYY-MM-DD
        </p>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer rounded-lg-hg border-2 border-dashed px-6 py-10 text-center transition-colors duration-hg-slow ease-hg',
          isDragActive && 'border-brand-accent bg-brand-accent-glow-sm',
          !isDragActive && file && 'border-semantic-success bg-semantic-success-bg',
          !isDragActive && !file && 'border-line bg-surface-elevated',
        )}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <FileSpreadsheet className="size-9 text-semantic-success" aria-hidden />
            <div>
              <p className="font-display text-base font-bold text-semantic-success">{file.name}</p>
              <p className="mt-1 text-[13px] text-fg-muted">
                {(file.size / 1024).toFixed(1)} KB · Ready to upload
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setFile(null)
              }}
              className="flex items-center gap-1 border-0 bg-transparent text-xs text-fg-muted hover:text-fg-secondary"
            >
              <X className="size-3" aria-hidden /> Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload
              className={cn('size-9 stroke-[1.5]', isDragActive ? 'text-brand-accent' : 'text-fg-muted')}
              aria-hidden
            />
            <div>
              <p
                className={cn(
                  'font-display text-base font-semibold',
                  isDragActive ? 'text-brand-accent' : 'text-fg-primary',
                )}
              >
                {isDragActive ? 'Drop it here' : 'Drag & drop your Excel file'}
              </p>
              <p className="mt-1 text-[13px] text-fg-muted">
                or click to browse · .xlsx and .xls only · max 50MB
              </p>
            </div>
          </div>
        )}
      </div>

      {uploading ? (
        <div>
          <div className="mb-1.5 flex justify-between">
            <span className="text-[13px] text-fg-secondary">Processing & encrypting…</span>
            <span className="text-[13px] font-semibold text-brand-accent">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-sm bg-surface-elevated">
            <div
              className="h-full rounded-sm bg-[linear-gradient(90deg,var(--accent-dim),var(--accent))] shadow-[0_0_8px_var(--accent-glow)] transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-fg-muted">
            🔐 Data is being AES-256 encrypted before storage
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2.5 rounded-md border border-semantic-danger/25 bg-semantic-danger-bg px-4 py-3">
          <AlertCircle className="mt-px size-4 shrink-0 text-semantic-danger" aria-hidden />
          <p className="text-[13px] text-semantic-danger">{error}</p>
        </div>
      ) : null}

      {result ? (
        <div
          className={cn(
            'rounded-lg-hg px-5 py-4',
            result.successful_records > 0
              ? 'border border-semantic-success/25 bg-semantic-success-bg'
              : 'border border-semantic-warning/25 bg-semantic-warning-bg',
          )}
        >
          <div className="mb-3 flex items-center gap-2.5">
            <CheckCircle2
              className={cn(
                'size-[18px]',
                result.successful_records > 0 ? 'text-semantic-success' : 'text-semantic-warning',
              )}
              aria-hidden
            />
            <span className="font-display text-[15px] font-bold text-fg-primary">Upload Complete</span>
          </div>
          <div className="flex gap-5">
            <div>
              <p className="text-[11px] tracking-wide text-fg-muted uppercase">Processed</p>
              <p className="font-display text-xl font-extrabold text-fg-primary">{result.total_records}</p>
            </div>
            <div>
              <p className="text-[11px] tracking-wide text-fg-muted uppercase">Imported</p>
              <p className="font-display text-xl font-extrabold text-semantic-success">
                {result.successful_records}
              </p>
            </div>
            {result.failed_records > 0 ? (
              <div>
                <p className="text-[11px] tracking-wide text-fg-muted uppercase">Failed</p>
                <p className="font-display text-xl font-extrabold text-semantic-danger">
                  {result.failed_records}
                </p>
              </div>
            ) : null}
          </div>
          {result.error_details ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-semantic-warning">View row errors</summary>
              <pre className="mt-2 max-h-[200px] overflow-auto rounded-md bg-surface-base p-3 text-[11px] text-fg-muted">
                {result.error_details}
              </pre>
            </details>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-3">
        <Button onClick={handleUpload} loading={uploading} disabled={!file || uploading} className="flex-1">
          <Upload className="size-4" />
          {uploading ? 'Encrypting & Uploading…' : 'Upload & Encrypt'}
        </Button>
        <Button variant="secondary" onClick={handleDownloadTemplate}>
          <Download className="size-4" /> Template
        </Button>
      </div>
    </div>
  )
}
