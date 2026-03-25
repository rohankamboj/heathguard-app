import { useState } from 'react'
import { Card } from '../components/shared/UI'
import PatientUpload from '../components/patient/PatientUpload'
import PatientTable from '../components/patient/PatientTable'
// pages are in src/pages/, components in src/components/
import { Upload, Database, Lock } from 'lucide-react'

export default function PatientsPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [tab, setTab] = useState('table')

  const handleUploadSuccess = () => {
    setRefreshKey(k => k + 1)
    setTab('table')
  }

  const tabs = [
    { key: 'table', label: 'Patient Records', icon: Database },
    { key: 'upload', label: 'Upload File', icon: Upload },
  ]

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', borderRadius: 10, padding: 8 }}>
            <Lock size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Patient Data Management
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              All PHI encrypted with AES-256-GCM · HIPAA-compliant storage
            </p>
          </div>
        </div>

        {/* Encryption notice */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--success-bg)', border: '1px solid rgba(0,200,150,0.25)', borderRadius: 'var(--radius-full)', padding: '5px 14px', fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>
          <Lock size={11} />
          All patient fields encrypted with AES-256-GCM before database storage
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 4, width: 'fit-content' }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
              background: tab === key ? 'var(--bg-card)' : 'transparent',
              color: tab === key ? 'var(--accent)' : 'var(--text-secondary)',
              border: `1px solid ${tab === key ? 'var(--border-accent)' : 'transparent'}`,
              transition: 'var(--transition)',
            }}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'upload' ? (
        <Card>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
            Upload Patient Excel File
          </h2>
          <PatientUpload onSuccess={handleUploadSuccess} />
        </Card>
      ) : (
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                Patient Records
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Data decrypted on-the-fly for display · Edit inline, save with full re-encryption
              </p>
            </div>
            <button onClick={() => setTab('upload')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius)', color: 'var(--accent)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'var(--transition)' }}>
              <Upload size={14} /> Upload More
            </button>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <PatientTable refreshKey={refreshKey} />
          </div>
        </Card>
      )}
    </div>
  )
}
