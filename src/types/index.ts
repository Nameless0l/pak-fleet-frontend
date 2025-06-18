export interface User {
  id: number
  name: string
  email: string
  role: 'chief' | 'technician'
  employee_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VehicleType {
  id: number
  name: string
  code: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: number
  registration_number: string
  brand: string
  model: string
  vehicle_type_id: number
  vehicle_type?: VehicleType
  year?: number
  acquisition_date?: string
  status: 'active' | 'maintenance' | 'out_of_service'
  under_warranty: boolean
  warranty_end_date?: string
  specifications?: Record<string, any>
  image_path?: string
  full_image_url?: string
  last_maintenance?: MaintenanceOperation
  created_at: string
  updated_at: string
}

export interface MaintenanceType {
  id: number
  name: string
  category: 'preventive' | 'corrective' | 'ameliorative'
  description?: string
  default_cost: number
  created_at: string
  updated_at: string
}

export interface SparePart {
  id: number
  code: string
  name: string
  description?: string
  unit: string
  unit_price: number
  quantity_in_stock: number
  minimum_stock: number
  category: string
  created_at: string
  updated_at: string
}

export interface SparePartUsage {
  id: number
  maintenance_operation_id: number
  spare_part_id: number
  spare_part?: SparePart
  quantity_used: number
  unit_price: number
  total_price: number
  created_at: string
  updated_at: string
}

export interface MaintenanceOperation {
  id: number
  vehicle_id: number
  vehicle?: Vehicle
  maintenance_type_id: number
  maintenance_type?: MaintenanceType
  technician_id: number
  technician?: User
  operation_date: string
  description?: string
  labor_cost: number
  parts_cost: number
  total_cost: number
  status: 'pending' | 'validated' | 'rejected'
  validated_by?: number
  validator?: User
  validated_at?: string
  validation_comment?: string
  additional_data?: Record<string, any>
  spare_part_usages?: SparePartUsage[]
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_vehicles: number
  active_vehicles: number
  maintenance_vehicles: number
  out_of_service_vehicles: number
  pending_operations: number
  validated_operations: number
  total_technicians: number
  low_stock_parts: number
  monthly_cost: number
  recent_operations: MaintenanceOperation[]
  upcoming_maintenances: any[]
}

export interface VehicleAnalytics {
  total_vehicles: number
  active_vehicles: number
  maintenance_vehicles: number
  out_of_service_vehicles: number
  vehicles_by_type: Record<string, number>
  recent_maintenances: Vehicle[]
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}