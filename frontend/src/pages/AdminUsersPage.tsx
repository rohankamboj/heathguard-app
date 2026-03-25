import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { usersApi } from '@/services/api'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import UsersTable from '@/components/dashboard/UsersTable'
import { UserPlus, Search, Filter, Lock, RefreshCw, Users, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const SELECT_EMPTY = '__empty__'

interface MetaRole {
  id: number
  name: string
}

interface MetaLocation {
  id: number
  code: string
  name: string
}

interface MetaTeam {
  id: number
  code: string
  name: string
}

const emptyForm = {
  username: '',
  email: '',
  full_name: '',
  password: '',
  role_id: '',
  location_id: '',
  team_id: '',
}

function CreateUserModal({
  open,
  onClose,
  roles,
  locations,
  teams,
}: {
  open: boolean
  onClose: () => void
  roles: MetaRole[]
  locations: MetaLocation[]
  teams: MetaTeam[]
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => usersApi.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-users'] })
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      void qc.invalidateQueries({ queryKey: ['dashboard-users'] })
      toast.success('User created successfully')
      onClose()
      setForm(emptyForm)
    },
    onError: (err: unknown) => {
      if (!axios.isAxiosError(err)) return
      const detail = err.response?.data?.detail as unknown
      if (typeof detail === 'string') toast.error(detail)
      else if (Array.isArray(detail)) {
        const errs: Record<string, string> = {}
        for (const e of detail as { loc?: unknown[]; msg: string }[]) {
          const key = e.loc?.[1]
          if (typeof key === 'string') errs[key] = e.msg
        }
        setErrors(errs)
      }
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setErrors({})
    const missing: Record<string, string> = {}
    if (!form.username) missing.username = 'Required'
    if (!form.email) missing.email = 'Required'
    if (!form.full_name) missing.full_name = 'Required'
    if (!form.password) missing.password = 'Required'
    if (!form.role_id) missing.role_id = 'Required'
    if (!form.location_id) missing.location_id = 'Required'
    if (!form.team_id) missing.team_id = 'Required'
    if (Object.keys(missing).length) {
      setErrors(missing)
      return
    }

    createMutation.mutate({
      ...form,
      role_id: Number(form.role_id),
      location_id: Number(form.location_id),
      team_id: Number(form.team_id),
    })
  }

  const set =
    (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }))

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-full_name">Full Name</Label>
              <Input
                id="create-full_name"
                placeholder="Jane Smith"
                value={form.full_name}
                onChange={set('full_name')}
                aria-invalid={!!errors.full_name}
              />
              {errors.full_name ? (
                <p className="text-xs text-destructive">{errors.full_name}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-username">Username</Label>
              <Input
                id="create-username"
                placeholder="jane_smith"
                value={form.username}
                onChange={set('username')}
                aria-invalid={!!errors.username}
              />
              {errors.username ? (
                <p className="text-xs text-destructive">{errors.username}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={set('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-password">Password</Label>
            <Input
              id="create-password"
              type="password"
              placeholder="Min 8 chars, upper, lower, digit, special"
              value={form.password}
              onChange={set('password')}
              aria-invalid={!!errors.password}
            />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={form.role_id || SELECT_EMPTY}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, role_id: v === SELECT_EMPTY ? '' : v }))
                }
              >
                <SelectTrigger id="create-role" className="w-full" aria-invalid={!!errors.role_id}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_EMPTY}>Select role</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role_id ? (
                <p className="text-xs text-destructive">{errors.role_id}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-location">Location</Label>
              <Select
                value={form.location_id || SELECT_EMPTY}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, location_id: v === SELECT_EMPTY ? '' : v }))
                }
              >
                <SelectTrigger id="create-location" className="w-full" aria-invalid={!!errors.location_id}>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_EMPTY}>Select location</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.code} — {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location_id ? (
                <p className="text-xs text-destructive">{errors.location_id}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-team">Team</Label>
              <Select
                value={form.team_id || SELECT_EMPTY}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, team_id: v === SELECT_EMPTY ? '' : v }))
                }
              >
                <SelectTrigger id="create-team" className="w-full" aria-invalid={!!errors.team_id}>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_EMPTY}>Select team</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.code} — {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.team_id ? (
                <p className="text-xs text-destructive">{errors.team_id}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-1 flex gap-2.5">
            <Button type="submit" loading={createMutation.isPending} className="flex-1">
              Create User
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
    mutationFn: (id: number) => usersApi.unlock(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User unlocked')
    },
    onError: () => toast.error('Failed to unlock user'),
  })

  const handleSearch = (e: FormEvent) => {
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
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <UserPlus className="size-3.5" /> New User
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
              <Button
                key={u.id}
                size="sm"
                variant="warning"
                loading={unlockMutation.isPending}
                onClick={() => unlockMutation.mutate(u.id)}
              >
                Unlock @{u.username}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-5">
        <CardContent className="flex flex-wrap items-center gap-3 py-2">
          <Filter className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name, username, email…"
                className="h-7 w-[220px] pl-8 text-[13px]"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary">
              Search
            </Button>
          </form>

          <Select
            value={filterRole || SELECT_EMPTY}
            onValueChange={(v) => setFilterRole(v === SELECT_EMPTY ? '' : v)}
          >
            <SelectTrigger size="sm" className="w-[min(100%,140px)] min-w-[120px] text-[13px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_EMPTY}>All Roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterLocation || SELECT_EMPTY}
            onValueChange={(v) => setFilterLocation(v === SELECT_EMPTY ? '' : v)}
          >
            <SelectTrigger size="sm" className="w-[min(100%,120px)] min-w-[100px] text-[13px]">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_EMPTY}>All Locations</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterTeam || SELECT_EMPTY}
            onValueChange={(v) => setFilterTeam(v === SELECT_EMPTY ? '' : v)}
          >
            <SelectTrigger size="sm" className="w-[min(100%,120px)] min-w-[100px] text-[13px]">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_EMPTY}>All Teams</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterActive || SELECT_EMPTY}
            onValueChange={(v) => setFilterActive(v === SELECT_EMPTY ? '' : v)}
          >
            <SelectTrigger size="sm" className="w-[min(100%,130px)] min-w-[110px] text-[13px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_EMPTY}>All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {(search || filterRole || filterLocation || filterTeam || filterActive) && (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="gap-0 overflow-hidden py-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <AlertCircle className="mx-auto mb-3 size-8 text-destructive" aria-hidden />
            <p className="text-destructive">Failed to load users</p>
          </div>
        ) : !users.length ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description="Try adjusting your filters or create a new user"
            action={
              <Button onClick={() => setShowCreate(true)}>
                <UserPlus className="size-3.5" /> Create User
              </Button>
            }
          />
        ) : (
          <UsersTable users={users} loading={false} />
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
