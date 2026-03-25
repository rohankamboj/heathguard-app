import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { patientsApi } from '../../services/api'
import { Button, Badge } from '../shared/UI'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Download } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PatientUpload({ onSuccess }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const onDrop = useCallback((accepted, rejected) => {
    setError('')
    setResult(null)
    if (rejected.length) {
      setError('Only .xlsx and .xls files are accepted')
      return
    }
    if (accepted.length) setFile(accepted[0])
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
    } catch (err) {
      const msg = err.response?.data?.detail || 'Upload failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDownloadTemplate = () => {
    // Create a simple CSV that user can convert — in a real app would serve an xlsx
    const csv = `Patient ID,First Name,Last Name,Date of Birth,Gender\nPT-001,John,Doe,1990-01-15,Male\nPT-002,Jane,Smith,1985-07-22,Female`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'patient_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Instructions */}
      <div style={{ background: 'var(--info-bg)', border: '1px solid rgba(77,166,255,0.25)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
        <p style={{ fontSize: 13, color: 'var(--info)', fontWeight: 600, marginBottom: 6 }}>Required columns (exact names):</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Patient ID', 'First Name', 'Last Name', 'Date of Birth', 'Gender'].map(col => (
            <code key={col} style={{ fontSize: 12, background: 'rgba(77,166,255,0.15)', color: 'var(--info)', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{col}</code>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Gender options: Male, Female, Other, Prefer not to say · Date format: YYYY-MM-DD
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--accent)' : file ? 'var(--success)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragActive ? 'var(--accent-glow-sm)' : file ? 'var(--success-bg)' : 'var(--bg-elevated)',
          transition: 'var(--transition-slow)',
        }}
      >
        <input {...getInputProps()} />
        {file ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <FileSpreadsheet size={36} color="var(--success)" />
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>{file.name}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB · Ready to upload</p>
            </div>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setFile(null) }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
            >
              <X size={12} /> Remove
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Upload size={36} color={isDragActive ? 'var(--accent)' : 'var(--text-muted)'} strokeWidth={1.5} />
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: isDragActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                {isDragActive ? 'Drop it here' : 'Drag & drop your Excel file'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>or click to browse · .xlsx and .xls only · max 50MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      {uploading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Processing & encrypting…</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{progress}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent-dim), var(--accent))', borderRadius: 3, transition: 'width 0.3s ease', boxShadow: '0 0 8px var(--accent-glow)' }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            🔐 Data is being AES-256 encrypted before storage
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--danger-bg)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
          <AlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ background: result.successful_records > 0 ? 'var(--success-bg)' : 'var(--warning-bg)', border: `1px solid ${result.successful_records > 0 ? 'rgba(0,200,150,0.25)' : 'rgba(245,166,35,0.25)'}`, borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <CheckCircle2 size={18} color={result.successful_records > 0 ? 'var(--success)' : 'var(--warning)'} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Upload Complete</span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div><p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Processed</p><p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)' }}>{result.total_records}</p></div>
            <div><p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Imported</p><p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--success)' }}>{result.successful_records}</p></div>
            {result.failed_records > 0 && <div><p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Failed</p><p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--danger)' }}>{result.failed_records}</p></div>}
          </div>
          {result.error_details && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ fontSize: 12, color: 'var(--warning)', cursor: 'pointer' }}>View row errors</summary>
              <pre style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, background: 'var(--bg-base)', padding: 12, borderRadius: 6, overflow: 'auto', maxHeight: 200 }}>{result.error_details}</pre>
            </details>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Button onClick={handleUpload} loading={uploading} disabled={!file || uploading} style={{ flex: 1 }}>
          <Upload size={15} />
          {uploading ? 'Encrypting & Uploading…' : 'Upload & Encrypt'}
        </Button>
        <Button variant="secondary" onClick={handleDownloadTemplate}>
          <Download size={15} /> Template
        </Button>
      </div>
    </div>
  )
}
