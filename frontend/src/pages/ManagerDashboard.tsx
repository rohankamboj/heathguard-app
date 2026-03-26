import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { StatCard } from '@/components/shared/stat-card'
import { Card, CardContent } from '@/components/ui/card'
import UsersTable from '@/components/dashboard/UsersTable'
import PatientUpload from '@/components/patient/PatientUpload'
import PatientTable from '@/components/patient/PatientTable'
import { Users, UserCheck, FileSpreadsheet, Database, Upload, Lock } from 'lucide-react'

export default function ManagerDashboard() {
  const user = useAuthStore((s) => s.user)
  const [patientTab, setPatientTab] = useState<'records' | 'upload'>('records')
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then(r => r.data),
  })

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: () => dashboardApi.users().then(r => r.data),
  })

  const handleUploadSuccess = () => {
    setRefreshKey(k => k + 1)
    setPatientTab('records')
  }

  return (
    <div className="mx-auto max-w-[1280px] animate-fade-in-hg flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-[28px] font-extrabold tracking-tight text-fg-primary">
          Manager Dashboard
        </h1>
        <p className="mt-1 text-sm text-fg-secondary">
          {user?.location?.name} ({user?.location?.code}) · {user?.team?.name} team
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <StatCard label="Location Users" value={statsLoading ? '—' : stats?.total_users ?? 0} icon={Users} iconTone="accent" />
        <StatCard label="Active Users" value={statsLoading ? '—' : stats?.active_users ?? 0} icon={UserCheck} iconTone="success" />
        <StatCard label="My Patients" value={statsLoading ? '—' : stats?.my_patients ?? 0} icon={Database} iconTone="admin" />
        <StatCard label="Total Uploads" value={statsLoading ? '—' : stats?.recent_uploads ?? 0} icon={FileSpreadsheet} iconTone="info" />
      </div>

      {/* Section 1 + 2: Patient Data Management */}
      <div>
        {/* Section header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-[10px] border border-line-accent bg-brand-accent-glow p-2">
            <Lock className="size-4 text-brand-accent" aria-hidden />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-fg-primary">Patient Data Management</h2>
            <p className="text-xs text-fg-muted">All PHI encrypted with AES-256-GCM · HIPAA-compliant storage</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-4 flex gap-1 rounded-lg border border-border bg-surface-elevated p-1 w-fit">
          {([
            { key: 'records', label: 'Patient Records', icon: Database },
            { key: 'upload',  label: 'Upload File',     icon: Upload },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPatientTab(key)}
              className={[
                'flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium transition-colors',
                patientTab === key
                  ? 'bg-surface-base border border-line-accent text-brand-accent'
                  : 'text-fg-secondary hover:text-fg-primary',
              ].join(' ')}
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        {/* Section 1: File Upload */}
        {patientTab === 'upload' && (
          <Card>
            <CardContent className="pt-0">
              <h3 className="font-heading mb-5 text-base font-bold text-foreground">Upload Patient Excel File</h3>
              <PatientUpload onSuccess={handleUploadSuccess} />
            </CardContent>
          </Card>
        )}

        {/* Section 2: Patient Records Table */}
        {patientTab === 'records' && (
          <Card className="gap-0 py-0">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="font-heading text-base font-bold text-foreground">Patient Records</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Decrypted on-the-fly · inline edit re-encrypts on save
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPatientTab('upload')}
                className="flex items-center gap-1.5 rounded-lg border border-line-accent bg-brand-accent-glow px-3 py-1.5 text-[12px] font-medium text-brand-accent hover:opacity-90"
              >
                <Upload className="size-3" aria-hidden /> Upload More
              </button>
            </div>
            <div className="px-6 py-5">
              <PatientTable refreshKey={refreshKey} />
            </div>
          </Card>
        )}
      </div>

      {/* Team Users */}
      <Card className="gap-0 py-0">
        <div className="border-b border-border px-6 py-5">
          <h2 className="font-heading text-lg font-bold text-foreground">{user?.location?.name} Team</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Users within your location scope</p>
        </div>
        <UsersTable users={users} loading={usersLoading} />
      </Card>
    </div>
  )
}
