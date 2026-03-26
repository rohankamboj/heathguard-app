import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

const filterSearchSchema = z.object({
  q: z.string().max(500, 'Search is too long'),
})

const passwordRules = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a digit')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character')

const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required').max(150),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required').max(200),
  password: passwordRules,
  role_id: z.string().refine((v) => v !== '' && v !== SELECT_EMPTY, 'Role is required'),
  location_id: z.string().refine((v) => v !== '' && v !== SELECT_EMPTY, 'Location is required'),
  team_id: z.string().refine((v) => v !== '' && v !== SELECT_EMPTY, 'Team is required'),
})

type CreateUserValues = z.infer<typeof createUserSchema>
type FilterSearchValues = z.infer<typeof filterSearchSchema>

const createUserDefaults: CreateUserValues = {
  username: '',
  email: '',
  full_name: '',
  password: '',
  role_id: '',
  location_id: '',
  team_id: '',
}

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
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: createUserDefaults,
  })

  useEffect(() => {
    if (open) {
      reset(createUserDefaults)
      clearErrors()
    }
  }, [open, reset, clearErrors])

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => usersApi.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-users'] })
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      void qc.invalidateQueries({ queryKey: ['dashboard-users'] })
      toast.success('User created successfully')
      onClose()
      reset(createUserDefaults)
    },
    onError: (err: unknown) => {
      if (!axios.isAxiosError(err)) return
      const detail = err.response?.data?.detail as unknown
      if (typeof detail === 'string') {
        toast.error(detail)
        return
      }
      if (Array.isArray(detail)) {
        for (const e of detail as { loc?: unknown[]; msg: string }[]) {
          const key = e.loc?.[1]
          if (typeof key === 'string' && key in createUserDefaults) {
            setError(key as keyof CreateUserValues, { message: e.msg })
          }
        }
      }
    },
  })

  const onSubmit = (data: CreateUserValues) => {
    clearErrors()
    createMutation.mutate({
      username: data.username.trim(),
      email: data.email.trim(),
      full_name: data.full_name.trim(),
      password: data.password,
      role_id: Number(data.role_id),
      location_id: Number(data.location_id),
      team_id: Number(data.team_id),
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-full_name">Full Name</Label>
              <Input
                id="create-full_name"
                placeholder="Jane Smith"
                aria-invalid={!!errors.full_name}
                {...register('full_name')}
              />
              {errors.full_name ? (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-username">Username</Label>
              <Input
                id="create-username"
                placeholder="jane_smith"
                aria-invalid={!!errors.username}
                {...register('username')}
              />
              {errors.username ? (
                <p className="text-xs text-destructive">{errors.username.message}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              placeholder="jane@example.com"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-password">Password</Label>
            <Input
              id="create-password"
              type="password"
              placeholder="Min 8 chars, upper, lower, digit, special"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-role">Role</Label>
              <Controller
                control={control}
                name="role_id"
                render={({ field }) => (
                  <Select
                    value={field.value || SELECT_EMPTY}
                    onValueChange={(v) => field.onChange(v === SELECT_EMPTY ? '' : v)}
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
                )}
              />
              {errors.role_id ? (
                <p className="text-xs text-destructive">{errors.role_id.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-location">Location</Label>
              <Controller
                control={control}
                name="location_id"
                render={({ field }) => (
                  <Select
                    value={field.value || SELECT_EMPTY}
                    onValueChange={(v) => field.onChange(v === SELECT_EMPTY ? '' : v)}
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
                )}
              />
              {errors.location_id ? (
                <p className="text-xs text-destructive">{errors.location_id.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-team">Team</Label>
              <Controller
                control={control}
                name="team_id"
                render={({ field }) => (
                  <Select
                    value={field.value || SELECT_EMPTY}
                    onValueChange={(v) => field.onChange(v === SELECT_EMPTY ? '' : v)}
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
                )}
              />
              {errors.team_id ? (
                <p className="text-xs text-destructive">{errors.team_id.message}</p>
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
  const [filterRole, setFilterRole] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterActive, setFilterActive] = useState('')

  const {
    register: registerFilterSearch,
    handleSubmit: submitFilterSearch,
    reset: resetFilterSearch,
    formState: { errors: filterSearchErrors },
  } = useForm<FilterSearchValues>({
    resolver: zodResolver(filterSearchSchema),
    defaultValues: { q: '' },
  })

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

  const onFilterSearchSubmit = (values: FilterSearchValues) => {
    setSearch(values.q.trim())
  }

  const clearFilters = () => {
    setSearch('')
    resetFilterSearch({ q: '' })
    setFilterRole('')
    setFilterLocation('')
    setFilterTeam('')
    setFilterActive('')
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

          <form onSubmit={submitFilterSearch(onFilterSearchSubmit)} className="flex flex-col gap-1">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, username, email…"
                  className="h-7 w-[220px] pl-8 text-[13px]"
                  aria-invalid={!!filterSearchErrors.q}
                  {...registerFilterSearch('q')}
                />
              </div>
              <Button type="submit" size="sm" variant="secondary">
                Search
              </Button>
            </div>
            {filterSearchErrors.q ? (
              <p className="text-xs text-destructive">{filterSearchErrors.q.message}</p>
            ) : null}
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
