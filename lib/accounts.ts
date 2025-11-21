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
 * Note: Dates and DateTimes are handled as ISO 8601 strings in TypeScript.
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
  iob?: number | null;
  cd?: number | null;
  anil?: number | null;
  remya?: number | null;
  rgb_186_swiping_machine?: number | null;
  amaze_ac?: number | null;
  cheque?: number | null;
  date?: string | null; // YYYY-MM-DD
  created_by?: number | null;
  updated_by?: number | null;
  status?: string | null;
  created_on?: string | null; // ISO 8601 DateTime string
  expense?: number | null;     // NEW
  category?: string | null;    // NEW
}

/**
 * Payload for creating a new daily sales report.
 * Corresponds to the `DailySalesReportCreate` Pydantic model.
 */
 export interface DailySalesReportCreatePayload {
  total_sales_order: number;
  date: string; // YYYY-MM-DD

  total_sale_order_amount?: number | null;
  sale_order_collection?: number | null;
  sale_order_balance_amount?: number | null;
  total_day_collection?: number | null;
  total_amount_on_cash?: number | null;
  total_amount_on_ac?: number | null;
  iob?: number | null;
  cd?: number | null;
  anil?: number | null;
  remya?: number | null;
  rgb_186_swiping_machine?: number | null;
  amaze_ac?: number | null;
  cheque?: number | null;
  status?: string | null;

  expense?: number | null;   // NEW
  category?: string | null;  // NEW
}

/**
 * Payload for partially updating a daily sales report.
 * Corresponds to the `DailySalesReportBase` Pydantic model used in the PATCH endpoint.
 */
 export interface DailySalesReportUpdatePayload {
  total_sales_order?: number;
  total_sale_order_amount?: number;
  sale_order_collection?: number;
  sale_order_balance_amount?: number;
  total_day_collection?: number;
  total_amount_on_cash?: number;
  total_amount_on_ac?: number;
  iob?: number;
  cd?: number;
  anil?: number;
  remya?: number;
  rgb_186_swiping_machine?: number;
  amaze_ac?: number;
  cheque?: number;
  date?: string; // YYYY-MM-DD
  status?: string;

  expense?: number;     // NEW
  category?: string;    // NEW
}

// --- API Functions ---

/**
 * Creates a new daily sales report.
 * Corresponds to: POST /accounts/daily_sales_report
 */
export async function createDailySalesReport(
  payload: DailySalesReportCreatePayload,
): Promise<ApiResponse<{ message: string; report: DailySalesReport }>> {
  try {
    console.log(payload);
    
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

/**
 * Fetches all daily sales reports.
 * Corresponds to: GET /accounts/daily_sales_report
 */
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

/**
 * Fetches a single daily sales report by its ID.
 * Corresponds to: GET /accounts/daily_sales_report/{id}
 */
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

/**
 * Updates an existing daily sales report.
 * Corresponds to: PATCH /accounts/daily_sales_report/{id}
 */
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

/**
 * Deletes a daily sales report by its ID.
 * Corresponds to: DELETE /accounts/daily_sales_report/{id}
 */
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
