import { useState, type CSSProperties } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { patientsApi } from '@/services/api'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Edit2, Check, X, Trash2, Search, ChevronLeft, ChevronRight, Database, AlertCircle, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import type { Patient } from '@/types'

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const

const searchSchema = z.object({
  query: z.string().max(500, 'Search is too long'),
})

const editSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(200),
  last_name: z.string().min(1, 'Last name is required').max(200),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(GENDER_OPTIONS),
})

type SearchValues = z.infer<typeof searchSchema>
type EditValues = z.infer<typeof editSchema>

const inputEditStyle: CSSProperties = {
  background: 'var(--bg-base)',
  border: '1px solid var(--accent)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  padding: '4px 8px',
  outline: 'none',
  width: '100%',
  minWidth: 120,
}

function DisplayCell({ value }: { value: string }) {
  return <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{value || '—'}</span>
}

type SortKey = 'patient_id' | 'created_at' | 'updated_at'
type SortOrder = 'asc' | 'desc'

function SortIcon({ col, sortBy, sortOrder }: { col: SortKey; sortBy: SortKey; sortOrder: SortOrder }) {
  if (sortBy !== col) return <ChevronsUpDown className="size-3 opacity-40" />
  return sortOrder === 'asc' ? <ChevronUp className="size-3 text-brand-accent" /> : <ChevronDown className="size-3 text-brand-accent" />
}

export default function PatientTable({ refreshKey }: { refreshKey?: number }) {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const {
    register: registerSearch,
    handleSubmit: submitSearch,
    reset: resetSearch,
    formState: { errors: searchErrors },
  } = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: '' },
  })

  const {
    register: registerEdit,
    handleSubmit: submitEdit,
    control: editControl,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'Male',
    },
  })

  const toggleSort = (col: SortKey) => {
    if (sortBy === col) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patients', page, search, sortBy, sortOrder, refreshKey],
    queryFn: () => patientsApi.list({ page, page_size: 10, search: search || undefined, sort_by: sortBy, sort_order: sortOrder }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => patientsApi.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patients'] })
      setEditingId(null)
      toast.success('Patient updated')
    },
    onError: (err: unknown) => {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined
      toast.error(typeof detail === 'string' ? detail : 'Update failed')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => patientsApi.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patients'] })
      setDeleteConfirm(null)
      toast.success('Patient removed')
    },
    onError: () => toast.error('Delete failed'),
  })

  const genderFromPatient = (g: string): EditValues['gender'] =>
    (GENDER_OPTIONS as readonly string[]).includes(g) ? (g as EditValues['gender']) : 'Other'

  const startEdit = (patient: Patient) => {
    setEditingId(patient.id)
    resetEdit({
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: patient.date_of_birth,
      gender: genderFromPatient(patient.gender),
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    resetEdit()
  }

  const onSearchSubmit = (values: SearchValues) => {
    setSearch(values.query.trim())
    setPage(1)
  }

  const onEditSubmit = (data: EditValues) => {
    if (editingId === null) return
    updateMutation.mutate({ id: editingId, data })
  }

  const patients = data?.items || []
  const totalPages = data?.total_pages || 1
  const total = data?.total || 0

  const searchField = registerSearch('query')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search + pagination info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <form onSubmit={submitSearch(onSearchSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                placeholder="Search by Patient ID…"
                aria-invalid={!!searchErrors.query}
                style={{
                  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                  fontSize: 13, padding: '8px 12px 8px 32px', outline: 'none',
                }}
                {...searchField}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent)'
                }}
                onBlur={(e) => {
                  void searchField.onBlur(e)
                  e.target.style.borderColor = 'var(--border)'
                }}
              />
            </div>
            <Button type="submit" size="sm" variant="secondary">
              Search
            </Button>
            {search ? (
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => {
                  setSearch('')
                  resetSearch({ query: '' })
                  setPage(1)
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>
          {searchErrors.query ? (
            <p style={{ fontSize: 11, color: 'var(--danger)', margin: 0 }}>{searchErrors.query.message}</p>
          ) : null}
        </form>

        {!isLoading && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {total} patient{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : isError ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--danger)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--danger)' }}>Failed to load patients</p>
        </div>
      ) : !patients.length ? (
        <EmptyState icon={Database} title={search ? 'No patients match your search' : 'No patients yet'} description={search ? 'Try a different Patient ID' : 'Upload an Excel file to get started'} />
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                {([
                  { label: 'Patient ID', col: 'patient_id' as SortKey },
                  { label: 'First Name', col: null },
                  { label: 'Last Name', col: null },
                  { label: 'Date of Birth', col: null },
                  { label: 'Gender', col: null },
                  { label: 'Uploaded', col: 'created_at' as SortKey },
                  { label: 'Actions', col: null },
                ]).map(({ label, col }) => (
                  <th
                    key={label}
                    onClick={col ? () => toggleSort(col) : undefined}
                    style={{
                      padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600,
                      color: col && sortBy === col ? 'var(--accent)' : 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                      cursor: col ? 'pointer' : 'default', userSelect: 'none',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {label}
                      {col && <SortIcon col={col} sortBy={sortBy} sortOrder={sortOrder} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((patient, idx) => {
                const isEditing = editingId === patient.id
                const isSaving = updateMutation.isPending && editingId === patient.id
                return (
                  <tr key={patient.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isEditing ? 'var(--accent-glow-sm)' : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isEditing) e.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseLeave={e => { if (!isEditing) e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                  >
                    <td style={{ padding: '11px 14px' }}>
                      <code style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-glow-sm)', padding: '2px 8px', borderRadius: 4 }}>{patient.patient_id}</code>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <input
                            aria-invalid={!!editErrors.first_name}
                            style={inputEditStyle}
                            {...registerEdit('first_name')}
                          />
                          {editErrors.first_name ? (
                            <span style={{ fontSize: 10, color: 'var(--danger)' }}>{editErrors.first_name.message}</span>
                          ) : null}
                        </div>
                      ) : (
                        <DisplayCell value={String(patient.first_name ?? '')} />
                      )}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <input
                            aria-invalid={!!editErrors.last_name}
                            style={inputEditStyle}
                            {...registerEdit('last_name')}
                          />
                          {editErrors.last_name ? (
                            <span style={{ fontSize: 10, color: 'var(--danger)' }}>{editErrors.last_name.message}</span>
                          ) : null}
                        </div>
                      ) : (
                        <DisplayCell value={String(patient.last_name ?? '')} />
                      )}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <input
                            type="date"
                            aria-invalid={!!editErrors.date_of_birth}
                            style={inputEditStyle}
                            {...registerEdit('date_of_birth')}
                          />
                          {editErrors.date_of_birth ? (
                            <span style={{ fontSize: 10, color: 'var(--danger)' }}>{editErrors.date_of_birth.message}</span>
                          ) : null}
                        </div>
                      ) : (
                        <DisplayCell value={String(patient.date_of_birth ?? '')} />
                      )}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Controller
                            control={editControl}
                            name="gender"
                            render={({ field }) => (
                              <select
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                onBlur={field.onBlur}
                                ref={field.ref}
                                aria-invalid={!!editErrors.gender}
                                style={{
                                  ...inputEditStyle,
                                  cursor: 'pointer',
                                }}
                              >
                                {GENDER_OPTIONS.map((g) => (
                                  <option key={g} value={g}>
                                    {g}
                                  </option>
                                ))}
                              </select>
                            )}
                          />
                          {editErrors.gender ? (
                            <span style={{ fontSize: 10, color: 'var(--danger)' }}>{editErrors.gender.message}</span>
                          ) : null}
                        </div>
                      ) : (
                        <Badge variant="secondary">{patient.gender}</Badge>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {format(new Date(patient.created_at), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {isEditing ? (
                          <>
                            <Button size="sm" variant="success" loading={isSaving} onClick={() => void submitEdit(onEditSubmit)()}>
                              <Check className="size-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={isSaving}>
                              <X className="size-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => startEdit(patient)} disabled={editingId !== null}>
                              <Edit2 className="size-3" />
                            </Button>
                            {deleteConfirm === patient.id ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  loading={deleteMutation.isPending}
                                  onClick={() => deleteMutation.mutate(patient.id)}
                                >
                                  Confirm
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>
                                  <X className="size-3" />
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(patient.id)} disabled={editingId !== null}>
                                <Trash2 className="size-3" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="size-3.5" />
          </Button>
          {[...Array(Math.min(7, totalPages))].map((_, i) => {
            const p = i + Math.max(1, page - 3)
            if (p > totalPages) return null
            return (
              <button key={p} onClick={() => setPage(p)}
                style={{
                  width: 32, height: 32, borderRadius: 6, border: '1px solid',
                  borderColor: p === page ? 'var(--accent)' : 'var(--border)',
                  background: p === page ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                  color: p === page ? 'var(--accent)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: p === page ? 700 : 400,
                  cursor: 'pointer', transition: 'var(--transition)',
                }}>
                {p}
              </button>
            )
          })}
          <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
