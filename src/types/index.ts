export interface User {
  id: number;
  name: string;
  email: string;
  role: "chief" | "technician";
  employee_id: string;
  is_active: boolean;
}

export interface VehicleType {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface Vehicle {
  id: number;
  registration_number: string;
  brand: string;
  model: string;
  vehicle_type?: VehicleType;
  vehicle_type_id: number;
  year?: number;
  acquisition_date?: string;
  status: "active" | "maintenance" | "out_of_service";
  under_warranty: boolean;
  warranty_end_date?: string;
  specifications?: any;
  last_maintenance?: MaintenanceOperation;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceType {
  id: number;
  name: string;
  category: "preventive" | "corrective" | "ameliorative";
  description?: string;
  default_cost: number;
}

export interface MaintenanceOperation {
  id: number;
  vehicle?: Vehicle;
  vehicle_id: number;
  maintenance_type?: MaintenanceType;
  maintenance_type_id: number;
  technician?: User;
  technician_id: number;
  operation_date: string;
  description?: string;
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  status: "pending" | "validated" | "rejected";
  validator?: User;
  validated_by?: number;
  validated_at?: string;
  validation_comment?: string;
  spare_part_usages?: SparePartUsage[];
  created_at: string;
  updated_at: string;
}

export interface SparePart {
  id: number;
  code: string;
  name: string;
  description?: string;
  unit: string;
  unit_price: number;
  quantity_in_stock: number;
  minimum_stock: number;
  category:
    | "filtration"
    | "lubrification"
    | "pneumatique"
    | "batterie"
    | "autre";
  is_low_stock: boolean;
}

export interface SparePartUsage {
  id: number;
  spare_part?: SparePart;
  spare_part_id: number;
  quantity_used: number;
  unit_price: number;
  total_price: number;
}

export interface DashboardStats {
  total_vehicles: number;
  active_vehicles: number;
  total_operations_this_month: number;
  pending_validations: number;
  total_cost_this_month: number;
}

export interface MonthlyCost {
  month: string;
  total_cost: number;
  operations_count: number;
}

export interface Dashboard {
  stats: DashboardStats;
  monthly_costs: MonthlyCost[];
  costs_by_category: Array<{
    category: string;
    total_cost: number;
    operations_count: number;
  }>;
  costs_by_vehicle_type: Array<{
    vehicle_type: string;
    total_cost: number;
    operations_count: number;
  }>;
  upcoming_maintenance: Vehicle[];
  low_stock_alerts: SparePart[];
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
