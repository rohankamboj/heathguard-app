export interface Role {
  id: number
  name: string
}

export interface Location {
  id: number
  code: string
  name: string
}

export interface Team {
  id: number
  code: string
  name: string
}

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role?: Role
  location?: Location
  team?: Team
  is_active?: boolean
  is_locked?: boolean
  last_login?: string | null
  created_at?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface DashboardStats {
  total_users: number
  active_users: number
  locations: Record<string, number>
  teams: Record<string, number>
  roles: Record<string, number>
  my_patients?: number
  recent_uploads?: number
}

export interface Patient {
  id: number
  patient_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  created_at: string
}

export interface PatientListResponse {
  items: Patient[]
  total: number
  total_pages: number
}

export interface UploadResult {
  total_records: number
  successful_records: number
  failed_records: number
  error_details?: string
}
