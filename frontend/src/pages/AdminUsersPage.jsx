import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../services/api'
import { Button, Card, Badge, Modal, Input, Select, Spinner, EmptyState } from '../components/shared/UI'
import UsersTable from '../components/dashboard/UsersTable'
import {
  UserPlus, Search, Filter, UserCheck, Lock,
  RefreshCw, Users, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

function CreateUserModal({ open, onClose, roles, locations, teams }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    username: '', email: '', full_name: '', password: '',
    role_id: '', location_id: '', team_id: '',
  })
  const [errors, setErrors] = useState({})

  const createMutation = useMutation({
    mutationFn: (data) => usersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-users'])
      qc.invalidateQueries(['dashboard-stats'])
      qc.invalidateQueries(['dashboard-users'])
      toast.success('User created successfully')
      onClose()
      setForm({ username: '', email: '', full_name: '', password: '', role_id: '', location_id: '', team_id: '' })
    },
    onError: (err) => {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') toast.error(detail)
      else if (Array.isArray(detail)) {
        const errs = {}
        detail.forEach(e => { errs[e.loc?.[1]] = e.msg })
        setErrors(errs)
      }
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    const missing = {}
    if (!form.username) missing.username = 'Required'
    if (!form.email) missing.email = 'Required'
    if (!form.full_name) missing.full_name = 'Required'
    if (!form.password) missing.password = 'Required'
    if (!form.role_id) missing.role_id = 'Required'
    if (!form.location_id) missing.location_id = 'Required'
    if (!form.team_id) missing.team_id = 'Required'
    if (Object.keys(missing).length) { setErrors(missing); return }

    createMutation.mutate({
      ...form,
      role_id: parseInt(form.role_id),
      location_id: parseInt(form.location_id),
      team_id: parseInt(form.team_id),
    })
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <Modal open={open} onClose={onClose} title="Create New User" width={560}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="Full Name" placeholder="Jane Smith" value={form.full_name} onChange={set('full_name')} error={errors.full_name} />
          <Input label="Username" placeholder="jane_smith" value={form.username} onChange={set('username')} error={errors.username} />
        </div>
        <Input label="Email" type="email" placeholder="jane@example.com" value={form.email} onChange={set('email')} error={errors.email} />
        <Input label="Password" type="password" placeholder="Min 8 chars, upper, lower, digit, special" value={form.password} onChange={set('password')} error={errors.password} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Select label="Role" value={form.role_id} onChange={set('role_id')} error={errors.role_id}>
            <option value="">Select role</option>
            {roles?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
          <Select label="Location" value={form.location_id} onChange={set('location_id')} error={errors.location_id}>
            <option value="">Select location</option>
            {locations?.map(l => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
          </Select>
          <Select label="Team" value={form.team_id} onChange={set('team_id')} error={errors.team_id}>
            <option value="">Select team</option>
            {teams?.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
          </Select>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button type="submit" loading={createMutation.isPending} style={{ flex: 1 }}>Create User</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminUsersPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterActive, setFilterActive] = useState('')

  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: () => usersApi.roles().then(r => r.data) })
  const { data: locations = [] } = useQuery({ queryKey: ['locations'], queryFn: () => usersApi.locations().then(r => r.data) })
  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: () => usersApi.teams().then(r => r.data) })

  const { data: users = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users', search, filterRole, filterLocation, filterTeam, filterActive],
    queryFn: () => usersApi.list({
      search: search || undefined,
      role_id: filterRole || undefined,
      location_id: filterLocation || undefined,
      team_id: filterTeam || undefined,
      is_active: filterActive === '' ? undefined : filterActive === 'true',
      limit: 200,
    }).then(r => r.data),
  })

  const unlockMutation = useMutation({
    mutationFn: (id) => usersApi.unlock(id),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('User unlocked') },
    onError: () => toast.error('Failed to unlock user'),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id) => usersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('User deactivated') },
    onError: () => toast.error('Failed to deactivate user'),
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const clearFilters = () => {
    setSearch(''); setSearchInput(''); setFilterRole(''); setFilterLocation(''); setFilterTeam(''); setFilterActive('')
  }

  const lockedUsers = users.filter(u => u.is_locked)

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            User Management
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            {users.length} total users · {users.filter(u => u.is_active).length} active
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <UserPlus size={14} /> New User
          </Button>
        </div>
      </div>

      {/* Locked users alert */}
      {lockedUsers.length > 0 && (
        <div style={{ background: 'var(--warning-bg)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Lock size={16} color="var(--warning)" />
            <span style={{ fontSize: 14, color: 'var(--warning)', fontWeight: 500 }}>
              {lockedUsers.length} account{lockedUsers.length > 1 ? 's' : ''} locked due to failed login attempts
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {lockedUsers.map(u => (
              <Button key={u.id} size="sm" variant="warning"
                loading={unlockMutation.isPending}
                onClick={() => unlockMutation.mutate(u.id)}
                style={{ background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid rgba(245,166,35,0.4)' }}>
                Unlock @{u.username}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Filter size={14} color="var(--text-muted)" />

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search name, username, email…"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, padding: '7px 12px 7px 30px', outline: 'none', width: 220 }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <Button type="submit" size="sm" variant="secondary">Search</Button>
          </form>

          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13, padding: '7px 12px', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Roles</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13, padding: '7px 12px', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Locations</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
          </select>

          <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13, padding: '7px 12px', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.code}</option>)}
          </select>

          <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13, padding: '7px 12px', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {(search || filterRole || filterLocation || filterTeam || filterActive) && (
            <Button size="sm" variant="ghost" onClick={clearFilters}>Clear filters</Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner size={32} /></div>
        ) : isError ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <AlertCircle size={32} color="var(--danger)" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--danger)' }}>Failed to load users</p>
          </div>
        ) : !users.length ? (
          <EmptyState icon={Users} title="No users found" description="Try adjusting your filters or create a new user" action={<Button onClick={() => setShowCreate(true)}><UserPlus size={14} /> Create User</Button>} />
        ) : (
          <UsersTable users={users} loading={false} showActions
            onUnlock={(id) => unlockMutation.mutate(id)}
            onDeactivate={(id) => deactivateMutation.mutate(id)}
          />
        )}
      </Card>

      <CreateUserModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        roles={roles}
        locations={locations}
        teams={teams}
      />
    </div>
  )
}
