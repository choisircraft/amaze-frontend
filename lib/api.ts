import { getAuthHeaders } from './auth'

// API Configuration
export const API_BASE_URL = 'https://api.choisircraft.com'

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  
  // Admin endpoints
  STAFF: '/admin/staff',
  STAFF_BY_ID: (id: string | number) => `/admin/staff/${id}`,
  
  // CRM endpoints
  CUSTOMERS: '/crm/customers',
  CUSTOMER_BY_ID: (id: string | number) => `/crm/customers/${id}`,
  ORDERS: '/crm/orders',
  ORDER_BY_ID: (id: string | number) => `/crm/orders/${id}`,
}

// API Response types
export interface StaffMember {
  id: number
  staff_name: string
  username: string
  role: string
  address: string
  status: 'active' | 'inactive'
  image?: string
  created_at?: string
  updated_at?: string
}

export interface CreateStaffRequest {
  staff_name: string
  username: string
  password: string
  role: string
  address: string
  status: 'active' | 'inactive'
  image?: string
}

export interface UpdateStaffRequest {
  staff_name?: string
  username?: string
  password?: string
  role?: string
  address?: string
  status?: 'active' | 'inactive'
  image?: string
}

// Customer types (used as leads)
export interface Customer {
  id: number
  customer_name: string
  mobile_number: string
  whatsapp_number: string
  address: string
  requirements: string
  created_on: string
  updated_on: string
  status: 'cold' | 'warm' | 'hot' | 'converted' | 'lost'
  created_by: number
  created_by_staff_name?: string
}

export interface CreateCustomerRequest {
  customer_name: string
  mobile_number: string
  whatsapp_number: string
  address: string
  requirements: string
}

export interface UpdateCustomerRequest {
  customer_name?: string
  mobile_number?: string
  whatsapp_number?: string
  address?: string
  requirements?: string
  status?: 'cold' | 'warm' | 'hot' | 'converted' | 'lost'
}

export interface Order {
  id: number
  customer_id: number
  category?: string
  project_committed_on?: string
  start_on?: string
  completion_date?: string
  completed_on?: string
  status?: string
  amount?: number
  description?: string
  created_on: string
  updated_on?: string
  created_by: number
  created_by_staff_name?: string

  // ✅ NEW FIELDS FROM BACKEND
  order_type?: string
  quantity?: number
  payment_status?: string
  amount_payed?: number
  payment_method?: string
  delivery_type?: string
  delivery_address?: string
  product_name?: string
  additional_amount?: number
  total_amount?: number
  account_name?: string
}

export interface OrderById {
  id: number
  customer_id: number
  category?: string
  project_committed_on?: string
  start_on?: string
  completion_date?: string
  completed_on?: string
  status?: string
  amount?: number
  description?: string
  created_on: string
  updated_on?: string
  created_by: number
  created_by_staff_name?: string

  // ✅ Added customer details
  customer_name?: string
  mobile_number?: string
  whatsapp_number?: string
  address?: string

  // ✅ NEW FIELDS FROM BACKEND (include for consistency)
  order_type?: string
  quantity?: number
  payment_status?: string
  amount_payed?: number
  payment_method?: string
  delivery_type?: string
  delivery_address?: string
  product_name?: string
  additional_amount?: number
  total_amount?: number
  account_name?: string
  design_amount?: number;
}

export interface CreateOrderRequest {
  customer_id: number
  category?: string
  project_commit?: string // Maps to project_committed_on in DB
  start_on?: string
  completion_date?: string
  status?: string
  amount?: number
  description?: string

  // ✅ NEW FIELDS FOR CREATION
  order_type?: string
  quantity?: number
  payment_status?: string
  amount_payed?: number
  payment_method?: string
  delivery_type?: string
  delivery_address?: string
  product_name?: string
  additional_amount?: number
  total_amount?: number
  account_name?: string
}

export interface UpdateOrderRequest {
  customer_id?: number
  category?: string
  project_commit?: string // Maps to project_committed_on in DB
  start_on?: string
  completion_date?: string
  completed_on?: string
  status?: string
  amount?: number
  description?: string

  // ✅ NEW FIELDS FOR UPDATE
  order_type?: string
  quantity?: number
  payment_status?: string
  amount_payed?: number
  payment_method?: string
  delivery_type?: string
  delivery_address?: string
  product_name?: string
  additional_amount?: number
  total_amount?: number
  account_name?: string
}


// API Client functions
export class ApiClient {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = getAuthHeaders()
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Staff Management API calls
  static async getStaff(): Promise<StaffMember[]> {
    return this.makeRequest<StaffMember[]>(API_ENDPOINTS.STAFF, {
      method: 'GET',
    })
  }

  static async getStaffById(id: string | number): Promise<StaffMember> {
    return this.makeRequest<StaffMember>(API_ENDPOINTS.STAFF_BY_ID(id), {
      method: 'GET',
    })
  }

  static async createStaff(staffData: CreateStaffRequest): Promise<StaffMember> {
    return this.makeRequest<StaffMember>(API_ENDPOINTS.STAFF, {
      method: 'POST',
      body: JSON.stringify(staffData),
    })
  }

  static async updateStaff(id: string | number, staffData: UpdateStaffRequest): Promise<StaffMember> {
    return this.makeRequest<StaffMember>(API_ENDPOINTS.STAFF_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(staffData),
    })
  }

  static async deleteStaff(id: string | number): Promise<void> {
    return this.makeRequest<void>(API_ENDPOINTS.STAFF_BY_ID(id), {
      method: 'DELETE',
    })
  }

  // Customer Management API calls
  static async getCustomers(): Promise<Customer[]> {
    return this.makeRequest<Customer[]>(API_ENDPOINTS.CUSTOMERS, {
      method: 'GET',
    })
  }

  static async getCustomerById(id: string | number): Promise<Customer> {
    return this.makeRequest<Customer>(API_ENDPOINTS.CUSTOMER_BY_ID(id), {
      method: 'GET',
    })
  }

  static async createCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
    return this.makeRequest<Customer>(API_ENDPOINTS.CUSTOMERS, {
      method: 'POST',
      body: JSON.stringify(customerData),
    })
  }

  static async updateCustomer(id: string | number, customerData: UpdateCustomerRequest): Promise<Customer> {
    return this.makeRequest<Customer>(API_ENDPOINTS.CUSTOMER_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(customerData),
    })
  }

  static async deleteCustomer(id: string | number): Promise<void> {
    return this.makeRequest<void>(API_ENDPOINTS.CUSTOMER_BY_ID(id), {
      method: 'DELETE',
    })
  }

  // Order Management API calls
  static async getOrders(): Promise<Order[]> {
    return this.makeRequest<Order[]>(API_ENDPOINTS.ORDERS, {
      method: 'GET',
    })
  }

  static async getOrderById(id: string | number): Promise<OrderById> {
    return this.makeRequest<Order>(API_ENDPOINTS.ORDER_BY_ID(id), {
      method: 'GET',
    })
  }

  static async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    return this.makeRequest<Order>(API_ENDPOINTS.ORDERS, {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  }

  static async updateOrder(id: string | number, orderData: UpdateOrderRequest): Promise<Order> {
    return this.makeRequest<Order>(API_ENDPOINTS.ORDER_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(orderData),
    })
  }

  static async deleteOrder(id: string | number): Promise<void> {
    return this.makeRequest<void>(API_ENDPOINTS.ORDER_BY_ID(id), {
      method: 'DELETE',
    })
  }
}
