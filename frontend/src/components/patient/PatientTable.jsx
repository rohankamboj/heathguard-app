import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { patientsApi } from '../../services/api'
import { Button, Input, Select, Spinner, EmptyState, Badge } from '../shared/UI'
import { Edit2, Check, X, Trash2, Search, ChevronLeft, ChevronRight, Database, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say']

function EditableCell({ value, field, type = 'text', editing, onChange }) {
  if (!editing) {
    return <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{value || '—'}</span>
  }

  if (field === 'gender') {
    return (
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--bg-base)', border: '1px solid var(--accent)', borderRadius: 6, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, padding: '4px 8px', outline: 'none', cursor: 'pointer' }}>
        {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
      </select>
    )
  }

  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'var(--bg-base)', border: '1px solid var(--accent)',
        borderRadius: 6, color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
        fontSize: 13, padding: '4px 8px', outline: 'none', width: '100%', minWidth: 120,
      }}
    />
  )
}

export default function PatientTable({ refreshKey }) {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patients', page, search, refreshKey],
    queryFn: () => patientsApi.list({ page, page_size: 10, search: search || undefined }).then(r => r.data),
    keepPreviousData: true,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => patientsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['patients'])
      setEditingId(null)
      toast.success('Patient updated')
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Update failed')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => patientsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(['patients'])
      setDeleteConfirm(null)
      toast.success('Patient removed')
    },
    onError: () => toast.error('Delete failed'),
  })

  const startEdit = (patient) => {
    setEditingId(patient.id)
    setEditData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
    })
  }

  const cancelEdit = () => { setEditingId(null); setEditData({}) }

  const saveEdit = (id) => {
    updateMutation.mutate({ id, data: editData })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const patients = data?.items || []
  const totalPages = data?.total_pages || 1
  const total = data?.total || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search + pagination info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by Patient ID…"
              style={{
                width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                fontSize: 13, padding: '8px 12px 8px 32px', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <Button type="submit" size="sm" variant="secondary">Search</Button>
          {search && <Button size="sm" variant="ghost" onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}>Clear</Button>}
        </form>

        {!isLoading && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {total} patient{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
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
                {['Patient ID', 'First Name', 'Last Name', 'Date of Birth', 'Gender', 'Uploaded', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
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
                      <EditableCell value={isEditing ? editData.first_name : patient.first_name} field="first_name" editing={isEditing}
                        onChange={v => setEditData(p => ({ ...p, first_name: v }))} />
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <EditableCell value={isEditing ? editData.last_name : patient.last_name} field="last_name" editing={isEditing}
                        onChange={v => setEditData(p => ({ ...p, last_name: v }))} />
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <EditableCell value={isEditing ? editData.date_of_birth : patient.date_of_birth} field="date_of_birth" type="date" editing={isEditing}
                        onChange={v => setEditData(p => ({ ...p, date_of_birth: v }))} />
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {isEditing ? (
                        <EditableCell value={editData.gender} field="gender" editing
                          onChange={v => setEditData(p => ({ ...p, gender: v }))} />
                      ) : (
                        <Badge variant="default">{patient.gender}</Badge>
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
                            <Button size="sm" variant="success" loading={isSaving} onClick={() => saveEdit(patient.id)}>
                              <Check size={12} />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={isSaving}>
                              <X size={12} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => startEdit(patient)} disabled={editingId !== null}>
                              <Edit2 size={12} />
                            </Button>
                            {deleteConfirm === patient.id ? (
                              <>
                                <Button size="sm" variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(patient.id)}>
                                  Confirm
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>
                                  <X size={12} />
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(patient.id)} disabled={editingId !== null}>
                                <Trash2 size={12} />
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
          <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft size={14} />
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
          <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}
