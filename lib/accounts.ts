// accounts.ts
// API client for interacting with Accounts endpoints
import { getAuthHeaders } from './auth'; // Assuming this utility exists
import { API_BASE_URL } from './api'; // Assuming this constant exists

// --- Generic Interfaces ---

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// --- Daily Sales Report Interfaces ---

/**
 * Interface representing a full Daily Sales Report record from the database.
 * Corresponds to the `DailySalesReport` Pydantic model.
 */
 export interface DailySalesReport {
  id: number;
  total_sales_order?: number | null;
  total_sale_order_amount?: number | null;
  sale_order_collection?: number | null;
  sale_order_balance_amount?: number | null;
  total_day_collection?: number | null;
  total_amount_on_cash?: number | null;
  total_amount_on_ac?: number | null;

  // Updated Column Names (Matches backend Pydantic models)
  ibo_420?: number | null;
  decor_uj?: number | null;     // UPDATED: lowercase to match backend
  anil_fed?: number | null;
  remya_fed?: number | null;
  kdb_186?: number | null;
  kgb_070?: number | null;
  
  // New Column
  kiran_uj?: number | null;

  cheque?: number | null;
  date?: string | null; // YYYY-MM-DD
  created_by?: number | null;
  updated_by?: number | null;
  status?: string | null;
  created_on?: string | null; // ISO 8601 DateTime string
  expense?: number | null;     
  category?: string | null;    
}

/**
 * Payload for creating a new daily sales report.
 */
 export interface DailySalesReportCreatePayload {
  total_sales_order?: number | null;
  date: string; // YYYY-MM-DD

  total_sale_order_amount?: number | null;
  sale_order_collection?: number | null;
  sale_order_balance_amount?: number | null;
  total_day_collection?: number | null;
  total_amount_on_cash?: number | null;
  total_amount_on_ac?: number | null;

  // Updated Column Names
  ibo_420?: number | null;
  decor_uj?: number | null;     // UPDATED: lowercase
  anil_fed?: number | null;
  remya_fed?: number | null;
  kdb_186?: number | null;
  kgb_070?: number | null;

  // New Column
  kiran_uj?: number | null;

  cheque?: number | null;
  status?: string | null;

  expense?: number | null;
  category?: string | null;
}

/**
 * Payload for partially updating a daily sales report.
 */
 export interface DailySalesReportUpdatePayload {
  total_sales_order?: number;
  total_sale_order_amount?: number;
  sale_order_collection?: number;
  sale_order_balance_amount?: number;
  total_day_collection?: number;
  total_amount_on_cash?: number;
  total_amount_on_ac?: number;

  // Updated Column Names
  ibo_420?: number;
  decor_uj?: number;     // UPDATED: lowercase
  anil_fed?: number;
  remya_fed?: number;
  kdb_186?: number;
  kgb_070?: number;

  // New Column
  kiran_uj?: number;

  cheque?: number;
  date?: string; // YYYY-MM-DD
  status?: string;

  expense?: number;
  category?: string;
}

// --- API Functions ---

export async function createDailySalesReport(
  payload: DailySalesReportCreatePayload,
): Promise<ApiResponse<{ message: string; report: DailySalesReport }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/accounts/daily_sales_report`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create daily sales report');
    }

    const data: { message: string; report: DailySalesReport } = await response.json();
    return { data };
  } catch (error: any) {
    console.error('Error creating daily sales report:', error.message);
    return { error: error.message };
  }
}

export async function getAllDailySalesReports(): Promise<ApiResponse<DailySalesReport[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/accounts/daily_sales_report`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch daily sales reports');
    }

    const data: DailySalesReport[] = await response.json();
    return { data };
  } catch (error: any) {
    console.error('Error fetching all daily sales reports:', error.message);
    return { error: error.message };
  }
}

export async function getDailySalesReportById(id: number): Promise<ApiResponse<DailySalesReport>> {
  try {
    const response = await fetch(`${API_BASE_URL}/accounts/daily_sales_report/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Failed to fetch daily sales report ${id}`);
    }

    const data: DailySalesReport = await response.json();
    return { data };
  } catch (error: any) {
    console.error(`Error fetching daily sales report ${id}:`, error.message);
    return { error: error.message };
  }
}

export async function updateDailySalesReport(
  id: number,
  payload: DailySalesReportUpdatePayload,
): Promise<ApiResponse<{ message: string; report: DailySalesReport }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/accounts/daily_sales_report/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Failed to update daily sales report ${id}`);
    }

    const data: { message: string; report: DailySalesReport } = await response.json();
    return { data };
  } catch (error: any) {
    console.error(`Error updating daily sales report ${id}:`, error.message);
    return { error: error.message };
  }
}

export async function deleteDailySalesReport(
  id: number,
): Promise<ApiResponse<{ message: string; id: number }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/accounts/daily_sales_report/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Failed to delete daily sales report ${id}`);
    }

    const data: { message: string; id: number } = await response.json();
    return { data };
  } catch (error: any) {
    console.error(`Error deleting daily sales report ${id}:`, error.message);
    return { error: error.message };
  }
}
