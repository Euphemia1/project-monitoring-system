export type UserRole = "director" | "project_engineer" | "project_manager" | "viewer"

export type ProjectStatus = "pending_approval" | "approved" | "in_progress" | "completed" | "on_hold"

export type DocumentType =
  | "precontract_document"
  | "contract_record_details"
  | "contract_documentation"
  | "contract_document"
  | "contract_documents"
  | "bills_of_quantities"
  | "drawings"
  | "internal_approvals"
  | "site_instruction"
  | "site_inspection_report"
  | "site_meeting_minutes"
  | "site_meeting_minutes_main"
  | "contractors_reports"
  | "contractors_reports_main"
  | "incoming_correspondence"
  | "incoming_correspondence_main"
  | "outgoing_correspondence"
  | "outgoing_correspondence_main"
  | "internal_correspondence"
  | "internal_memos"
  | "interim_payment_certificate"
  | "remeasurements"
  | "remeasurements_main"
  | "interim_valuations_certificate"
  | "interim_valuations_certificate_main"
  | "progress_report_attachment"
  | "variation_measurement"
  | "measurement_of_variations"
  | "final_account_remeasurement"
  | "remeasurement_main"
  | "delays_disruptions_records"
  | "all_reports"
  | "how_to_use_filling_system"
  | "other_report"

export interface District {
  id: string
  name: string
  code: string
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  district_id: string | null
  phone: string | null
  created_at: string
  updated_at: string
  district?: District
}

export interface Project {
  id: string
  contract_no: string
  contract_name: string
  description?: string
  district_id: string
  start_date: string
  completion_date: string
  contract_sum: number
  status: ProjectStatus
  created_by: string
  approved_by: string | null
  approved_at: string | null
  is_locked: boolean
  created_at: string
  updated_at: string
  district?: District
  creator?: Profile
  sections?: ProjectSection[]
}

export interface ProjectSection {
  id: string
  project_id: string
  section_name: string
  house_type: string | null
  created_at: string
  trades?: Trade[]
}

export interface Trade {
  id: string
  section_id: string
  trade_name: string
  amount: number
  created_at: string
}

export interface ProgressReport {
  id: string
  project_id: string
  report_no: number
  report_date: string
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
  trade_progress?: TradeProgress[]
  creator?: Profile
}

export interface TradeProgress {
  id: string
  progress_report_id: string
  trade_id: string
  progress_percentage: number
  amount_completed: number
  created_at: string
  trade?: Trade
}

export type ActionStatus = 'pending' | 'in_progress' | 'completed'

export interface ActionAssignee {
  id: string
  name: string
  email?: string
  role?: string
  created_at: string
}

export interface Document {
  id: string
  project_id: string
  progress_report_id: string | null
  document_type: DocumentType
  title: string
  description?: string
  file_url: string
  file_name: string
  file_size: number | null
  uploaded_by: string
  action_required?: string
  action_assignee_id?: string
  action_status?: ActionStatus
  action_response?: string
  is_locked: boolean
  created_at: string
  uploader?: Profile
  action_assignee?: ActionAssignee
  assignee_name?: string
  assignee_role?: string
}
