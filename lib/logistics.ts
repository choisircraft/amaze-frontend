// projectManager.ts
// API client for interacting with project manager and staff tasking endpoints
import { getAuthHeaders } from './auth';
import { API_BASE_URL } from './api';


// Interface for API response (generic for success/error handling)
interface ApiResponse<T> {
  data?: T;
  error?: string;
}


/**
 * Interface for a detailed task object from the GET /projects/tasks endpoint.
 * This includes nested objects for staff details.
 */

  export interface Task {
    id: number;
    assigned_by: number;
    assigned_to: number;
    assigned_on: string; // Typically an ISO 8601 timestamp string
    completion_time?: string | null;
    completed_on?: string | null; // ADDED: New field for completion date
    order_id: number;
    description?: string | null;
    status: string;
    order_completion_date?: string | null;
  }
  
   export interface TaskStaffInfo {
    id: number | null;
    staff_name: string | null;
    role: string | null;
  }
  
  export interface CustomerInfo {
    id: number | null;
    name: string | null;
  }
  
  // 👇 New interface for order details
  export interface OrderInfo {
    id: number | null;
    generated_order_id: string | null;
    product_name: string | null;
  }
   export interface DetailedTask {
    id: number;
    order_id: number;
    task_description: string | null;
    status: string;
    assigned_on: string;
    completion_time: string | null;
    completed_on: string | null; // ADDED: New field for completion date
    assigned_by: TaskStaffInfo;
    assigned_to: TaskStaffInfo;
  
    updated_by: TaskStaffInfo | null;
    order_completion_date?: string | null;
    // 👇 NEW: customer info included in detailed task view
    customer?: CustomerInfo | null;
    order?: OrderInfo | null;
  }
  
  /**
   * Fetches all tasks with detailed, nested information about the staff involved.
   * Corresponds to: GET /tasks
   */
   export async function getAllTasks(): Promise<ApiResponse<DetailedTask[]>> {
    try {
      // Note: The endpoint is /projects/tasks based on the existing pattern in this file.
      const response = await fetch(`${API_BASE_URL}/logistics/tasks`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch tasks');
      }
  
      const data: DetailedTask[] = await response.json();
      return { data };
    } catch (error: any) {
      console.error('Error fetching all tasks:', error.message);
      return { error: error.message };
    }
  }
  
  
  export interface EditTaskPayload {
    completion_time?: string | null; // e.g., "2024-12-31T23:59:59"
    task_description?: string | null;
    status?: string | null; // e.g., "in_progress", "completed"
  }
  
  export async function editTask(
    taskId: number,
    payload: EditTaskPayload
  ): Promise<ApiResponse<{ message: string; task: Task }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/logistics/tasks/${taskId}`, {
        method: 'PATCH', // Use PATCH for partial updates
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update task');
      }
  
      // The API returns { message: string, task: Task }, we extract the whole object
      const data: { message: string; task: Task } = await response.json();
      return { data };
    } catch (error: any) {
      console.error(`Error updating task ${taskId}:`, error.message);
      return { error: error.message };
    }
  }
  
  
  export interface OrderDetails {
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
    generated_order_id?: string
  }
  
  
  export async function getOrderById(orderId: number): Promise<ApiResponse<OrderDetails>> {
    try {
      const response = await fetch(`${API_BASE_URL}/logistics/orders/${orderId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch order details');
      }
  
      const data: OrderDetails = await response.json();
      return { data };
    } catch (error: any) {
      console.error(`Error fetching order ${orderId}:`, error.message);
      return { error: error.message };
    }
  }


  export interface OrderImage {
    id: number;
    order_id: number;
    image_url: string;
    status: string; // e.g., 'active', 'inactive'
    created_at: string; // ISO 8601 date string
    description?: string; // Optional field
    uploaded_by: number;
  }
  
  /**
   * Fetches all images for a specific order.
   * Corresponds to: GET /orders/images/{order_id}
   * 
   * @param orderId The ID of the order to fetch images for.
   * @returns A promise that resolves to an array of OrderImage objects.
   * @throws Will throw an error if the request fails.
   */
   export const getOrderImages = async (orderId: number): Promise<OrderImage[]> => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/logistics/orders/images/${orderId}`, {
        method: 'GET',
        headers,
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch order images: ${response.status} ${response.statusText}`);
      }
  
      const data: OrderImage[] = await response.json();
      return data;
    } catch (error) {
      console.error(`Error in getOrderImages for order ${orderId}:`, error);
      throw error;
    }
  };
