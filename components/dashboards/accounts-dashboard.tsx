"use client"

import React, { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "../dashboard-layout" 

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"

// --- API Client Imports ---
import {
  createDailySalesReport,
  getAllDailySalesReports,
  updateDailySalesReport,
  deleteDailySalesReport,
  DailySalesReport,
  DailySalesReportCreatePayload,
  DailySalesReportUpdatePayload,
} from "@/lib/accounts"

// --- Icons ---
import {
  Landmark, FileUp, ListOrdered, DollarSign, Loader2, Calendar, ChevronDown, Info,
  Banknote, Calculator, Laptop, Pencil, Trash2, XCircle // Removed CheckCircle
} from "lucide-react"

// =============================================================
// TYPES & HELPERS
// =============================================================

// --- Financial Report UI Type ---
type AccountDetails = { [key: string]: number; }
type DailyReportEntry = {
    id: number;
    date: string;
    totalSaleOrder: number;
    totalSaleOrderAmount: number;
    saleOrderCollection: number;
    saleOrderBalAmount: number;
    totalDayCollection: number;
    totalCash: number;
    totalAC: number;
    acDetails: AccountDetails;
};

// --- Helper Functions ---
const formatRupee = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

const mapApiToComponent = (apiReport: DailySalesReport): DailyReportEntry => {
    const displayDate = apiReport.date
        ? new Date(apiReport.date + 'T00:00:00').toLocaleDateString('en-GB').replace(/\//g, '-')
        : 'N/A';

    return {
        id: apiReport.id,
        date: displayDate,
        totalSaleOrder: apiReport.total_sales_order ?? 0,
        totalSaleOrderAmount: apiReport.total_sale_order_amount ?? 0,
        saleOrderCollection: apiReport.sale_order_collection ?? 0,
        saleOrderBalAmount: apiReport.sale_order_balance_amount ?? 0,
        totalDayCollection: apiReport.total_day_collection ?? 0,
        totalCash: apiReport.total_amount_on_cash ?? 0,
        totalAC: apiReport.total_amount_on_ac ?? 0,
        acDetails: {
            IOB: apiReport.iob ?? 0, CD: apiReport.cd ?? 0, ANIL: apiReport.anil ?? 0, REMYA: apiReport.remya ?? 0,
            'RGB-186 SWIPING MACHINE': apiReport.rgb_186_swiping_machine ?? 0, 'AMAZE A/C': apiReport.amaze_ac ?? 0, CHEQUE: apiReport.cheque ?? 0,
        },
    };
};

// =============================================================
// CHILD COMPONENT: DailyReportUpload
// =============================================================
interface DailyReportUploadProps {
  onReportCreate: (payload: DailySalesReportCreatePayload) => Promise<boolean>;
  onReportUpdate: (id: number, payload: DailySalesReportUpdatePayload) => Promise<boolean>;
  reportToEdit: DailySalesReport | null;
  onCancelEdit: () => void;
}

const DailyReportUpload = ({ onReportCreate, onReportUpdate, reportToEdit, onCancelEdit }: DailyReportUploadProps) => {
    const { toast } = useToast();
    const isEditMode = !!reportToEdit;
    
    const initialFormState = {
        date: new Date().toISOString().split('T')[0], total_sales_order: '', total_sale_order_amount: '', sale_order_collection: '',
        sale_order_balance_amount: '', total_day_collection: '', total_amount_on_cash: '', total_amount_on_ac: '', iob: '',
        cd: '', anil: '', remya: '', rgb_186_swiping_machine: '', amaze_ac: '', cheque: ''
    };

    const [formData, setFormData] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        if (reportToEdit) {
            setFormData({
                date: reportToEdit.date?.split('T')[0] ?? '',
                total_sales_order: String(reportToEdit.total_sales_order ?? ''),
                total_sale_order_amount: String(reportToEdit.total_sale_order_amount ?? ''),
                sale_order_collection: String(reportToEdit.sale_order_collection ?? ''),
                sale_order_balance_amount: String(reportToEdit.sale_order_balance_amount ?? ''),
                total_day_collection: String(reportToEdit.total_day_collection ?? ''),
                total_amount_on_cash: String(reportToEdit.total_amount_on_cash ?? ''),
                total_amount_on_ac: String(reportToReport.total_amount_on_ac ?? ''),
                iob: String(reportToEdit.iob ?? ''), cd: String(reportToEdit.cd ?? ''), anil: String(reportToEdit.anil ?? ''),
                remya: String(reportToEdit.remya ?? ''), rgb_186_swiping_machine: String(reportToEdit.rgb_186_swiping_machine ?? ''),
                amaze_ac: String(reportToEdit.amaze_ac ?? ''), cheque: String(reportToEdit.cheque ?? ''),
            });
        } else {
            setFormData(initialFormState);
        }
    }, [reportToEdit]);
    
    useEffect(() => {
        const saleCollection = parseFloat(formData.sale_order_collection) || 0;
        const saleBalance = parseFloat(formData.sale_order_balance_amount) || 0;
        const newTotalDayCollection = saleCollection + saleBalance;
        const iob = parseFloat(formData.iob) || 0;
        const cd = parseFloat(formData.cd) || 0;
        const anil = parseFloat(formData.anil) || 0;
        const remya = parseFloat(formData.remya) || 0;
        const swiping = parseFloat(formData.rgb_186_swiping_machine) || 0;
        const amaze = parseFloat(formData.amaze_ac) || 0;
        const cheque = parseFloat(formData.cheque) || 0;
        const newTotalAC = iob + cd + anil + remya + swiping + amaze + cheque;
        setFormData(prev => ({ ...prev, total_day_collection: newTotalDayCollection > 0 ? String(newTotalDayCollection) : '', total_amount_on_ac: newTotalAC > 0 ? String(newTotalAC) : '' }));
    }, [
        formData.sale_order_collection, formData.sale_order_balance_amount, formData.iob, formData.cd, formData.anil, formData.remya,
        formData.rgb_186_swiping_machine, formData.amaze_ac, formData.cheque
    ]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.date || !formData.total_sales_order) {
            toast({ title: "Validation Error", description: "Date and Total Sale Orders are required.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        const payload = {
            date: formData.date, total_sales_order: parseInt(formData.total_sales_order) || 0,
            total_sale_order_amount: parseFloat(formData.total_sale_order_amount) || null,
            sale_order_collection: parseFloat(formData.sale_order_collection) || null,
            sale_order_balance_amount: parseFloat(formData.sale_order_balance_amount) || null,
            total_day_collection: parseFloat(formData.total_day_collection) || null,
            total_amount_on_cash: parseFloat(formData.total_amount_on_cash) || null,
            total_amount_on_ac: parseFloat(formData.total_amount_on_ac) || null,
            iob: parseFloat(formData.iob) || null, cd: parseFloat(formData.cd) || null, anil: parseFloat(formData.anil) || null,
            remya: parseFloat(formData.remya) || null, rgb_186_swiping_machine: parseFloat(formData.rgb_186_swiping_machine) || null,
            amaze_ac: parseFloat(formData.amaze_ac) || null, cheque: parseFloat(formData.cheque) || null,
        };
        let success = false;
        if (isEditMode) {
            success = await onReportUpdate(reportToEdit!.id, payload);
        } else {
            success = await onReportCreate(payload);
        }
        if (success) { setFormData(initialFormState); }
        setIsSubmitting(false);
    };
    
    const readOnlyInputClass = "bg-muted focus:ring-0 focus:ring-offset-0 cursor-not-allowed font-semibold";
    const labelClass = "text-sm font-medium text-muted-foreground";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-4">
                <label htmlFor="date" className={labelClass}>Report Date</label>
                <Input id="date" type="date" name="date" value={formData.date} onChange={handleChange} required />
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-4">
                    <CardTitle className="text-lg mb-4 flex items-center"><ListOrdered className="w-5 h-5 mr-2" /> Sale Order Details</CardTitle>
                    <div className="space-y-4">
                        <div className="space-y-1"><label htmlFor="total_sales_order" className={labelClass}>Total Sale Orders (NO'S)</label><Input id="total_sales_order" type="number" name="total_sales_order" placeholder="e.g., 10" value={formData.total_sales_order} onChange={handleChange} required /></div>
                        <div className="space-y-1"><label htmlFor="total_sale_order_amount" className={labelClass}>Total Sale Order Amount (₹)</label><Input id="total_sale_order_amount" type="number" name="total_sale_order_amount" placeholder="₹ 25000" value={formData.total_sale_order_amount} onChange={handleChange} /></div>
                        <div className="space-y-1"><label htmlFor="sale_order_collection" className={labelClass}>Sale Order Collection (₹)</label><Input id="sale_order_collection" type="number" name="sale_order_collection" placeholder="₹ 20000" value={formData.sale_order_collection} onChange={handleChange} /></div>
                        <div className="space-y-1"><label htmlFor="sale_order_balance_amount" className={labelClass}>Sale Order Balance Amount (₹)</label><Input id="sale_order_balance_amount" type="number" name="sale_order_balance_amount" placeholder="₹ 5000" value={formData.sale_order_balance_amount} onChange={handleChange} /></div>
                    </div>
                </Card>
                <Card className="p-4">
                    <CardTitle className="text-lg mb-4 flex items-center"><Calculator className="w-5 h-5 mr-2" /> Cash Book & Totals</CardTitle>
                    <div className="space-y-4">
                        <div className="space-y-1"><label className="text-sm font-medium flex items-center text-green-700">TOTAL DAY COLLECTION (₹) <Info className="w-3 h-3 ml-1" /></label><Input type="number" name="total_day_collection" placeholder="Auto-calculated..." value={formData.total_day_collection} className={readOnlyInputClass} readOnly /></div>
                        <div className="space-y-1 pt-2"><label htmlFor="total_amount_on_cash" className={`${labelClass} flex items-center`}><Banknote className="w-4 h-4 mr-1"/>Total CASH (₹)</label><Input id="total_amount_on_cash" type="number" name="total_amount_on_cash" placeholder="₹ 10000" value={formData.total_amount_on_cash} onChange={handleChange} /></div>
                        <div className="space-y-1"><label className="text-sm font-medium flex items-center"><Laptop className="w-4 h-4 mr-1"/>Total A/C (₹) <Info className="w-3 h-3 ml-1" /></label><Input type="number" name="total_amount_on_ac" placeholder="Auto-calculated..." value={formData.total_amount_on_ac} className={readOnlyInputClass} readOnly /></div>
                    </div>
                </Card>
                <Card className="p-4">
                    <CardTitle className="text-lg mb-4 flex items-center"><DollarSign className="w-5 h-5 mr-2" /> A/C Specifics</CardTitle>
                    <div className="space-y-3">
                        <div className="space-y-1"><label htmlFor="iob" className={labelClass}>IOB (₹)</label><Input id="iob" type="number" name="iob" placeholder="₹ 5000" value={formData.iob} onChange={handleChange} /></div>
                        <div className="space-y-1"><label htmlFor="cd" className={labelClass}>CD (₹)</label><Input id="cd" type="number" name="cd" placeholder="₹ 3000" value={formData.cd} onChange={handleChange} /></div>
                        <div className="space-y-1"><label htmlFor="rgb_186_swiping_machine" className={labelClass}>RGB-186 Swiping Machine (₹)</label><Input id="rgb_186_swiping_machine" type="number" name="rgb_186_swiping_machine" placeholder="₹ 1500" value={formData.rgb_186_swiping_machine} onChange={handleChange} /></div>
                        <div className="space-y-1"><label htmlFor="anil" className={labelClass}>Anil (₹)</label><Input id="anil" type="number" name="anil" placeholder="₹ 1000" value={formData.anil} onChange={handleChange} /></div>
                        <div className="space-y-1"><label htmlFor="remya" className={labelClass}>Remya (₹)</label><Input id="remya" type="number" name="remya" placeholder="₹ 2000" value={formData.remya} onChange={handleChange} /></div>
                        <div className="space-y-1"><label htmlFor="amaze_ac" className={labelClass}>Amaze A/C (₹)</label><Input id="amaze_ac" type="number" name="amaze_ac" placeholder="₹ 1000" value={formData.amaze_ac} onChange={handleChange} /></div>
                        <div className="space-y-1"><label htmlFor="cheque" className={labelClass}>Cheque (₹)</label><Input id="cheque" type="number" name="cheque" placeholder="₹ 500" value={formData.cheque} onChange={handleChange} /></div>
                    </div>
                </Card>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="w-full sm:flex-1" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : 
                     isEditMode ? <><Pencil className="mr-2 h-4 w-4" />Update Report</> : 
                                   <><FileUp className="mr-2 h-4 w-4" />Submit Daily Report</>}
                </Button>
                {isEditMode && (<Button type="button" variant="outline" className="w-full sm:flex-1" onClick={onCancelEdit}><XCircle className="mr-2 h-4 w-4" /> Cancel Edit</Button>)}
            </div>
        </form>
    );
};

// =============================================================
// CHILD COMPONENT: DailyReportRegister
// =============================================================
interface DailyReportRegisterProps {
  reports: DailySalesReport[];
  isLoading: boolean;
  onEdit: (report: DailySalesReport) => void;
  onDelete: (id: number) => void;
}

const DailyReportRegister = ({ reports, isLoading, onEdit, onDelete }: DailyReportRegisterProps) => {
    const sortedReports = useMemo(() => {
        return [...reports].sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });
    }, [reports]);

    if (isLoading) { return <div className="space-y-4">{[...Array(3)].map((_, i) => (<Card key={i}><CardHeader className="py-3 px-4"><Skeleton className="h-6 w-3/4" /></CardHeader><div className="px-4 py-3 border-t"><Skeleton className="h-5 w-1/4" /></div></Card>))}</div>; }
    
    return (
        <div className="space-y-4">
            {sortedReports.map((report) => {
                const displayReport = mapApiToComponent(report);
                return (
                    <Card key={report.id}>
                        <CardHeader className="py-3 px-4 border-b">
                            <div className="flex justify-between items-center gap-2">
                                <CardTitle className="text-lg font-bold text-gray-800 flex items-center"><Calendar className="w-5 h-5 mr-3 text-blue-600" />Report Date: {displayReport.date}</CardTitle>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                     <Badge className="bg-green-600 hover:bg-green-700 hidden sm:block">Total: {formatRupee(displayReport.totalDayCollection)}</Badge>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onEdit(report)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => onDelete(report.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </CardHeader>
                        <Collapsible>
                            <CollapsibleTrigger asChild><Button variant="ghost" className="w-full justify-between px-4 py-2 text-sm font-medium"><span>View Details</span><ChevronDown className="h-4 w-4 collapsible-icon" /></Button></CollapsibleTrigger>
                            <CollapsibleContent className="p-4 border-t">
                                <h4 className="font-semibold text-md mb-3 border-b pb-1">Sale Order Summary</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div><span className="text-gray-500">Total Orders:</span> <p className="font-medium">{displayReport.totalSaleOrder} NO'S</p></div>
                                    <div><span className="text-gray-500">Order Amount:</span> <p className="font-medium">{formatRupee(displayReport.totalSaleOrderAmount)}</p></div>
                                    <div><span className="text-gray-500">Order Collected:</span> <p className="font-medium text-green-700">{formatRupee(displayReport.saleOrderCollection)}</p></div>
                                    <div><span className="text-gray-500">Order Balance:</span> <p className="font-medium text-red-600">{formatRupee(displayReport.saleOrderBalAmount)}</p></div>
                                </div>
                                <h4 className="font-semibold text-md mt-6 mb-3 border-b pb-1">Cash Book Breakdown</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div><span className="text-gray-500">Total Cash:</span> <p className="font-medium">{formatRupee(displayReport.totalCash)}</p></div>
                                    <div><span className="text-gray-500">Total A/C:</span> <p className="font-medium">{formatRupee(displayReport.totalAC)}</p></div>
                                </div>
                                <h5 className="font-semibold text-sm mt-4 mb-2">A/C Specifics (Online Work)</h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-gray-50 p-3 rounded">
                                    {Object.entries(displayReport.acDetails).filter(([, amount]) => amount > 0).map(([key, amount]) => (<div key={key}><span className="text-gray-600">{key}:</span> <p className="font-medium">{formatRupee(amount)}</p></div>))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>
                )
            })}
             {!isLoading && reports.length === 0 && (<div className="text-center py-10"><Info className="h-10 w-10 text-gray-400 mx-auto mb-3" /><p className="text-gray-500">No daily reports have been submitted yet.</p></div>)}
        </div>
    );
};

// =============================================================
// MAIN PAGE COMPONENT (EXPENSE SECTION REMOVED)
// =============================================================
export function AccountantDashboard() {
  const { toast } = useToast()
  
  // --- State for Sales Reports ---
  const [reportHistory, setReportHistory] = useState<DailySalesReport[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [editingReport, setEditingReport] = useState<DailySalesReport | null>(null);
  
  // Initialize tab to 'upload' since 'expenses' is removed
  const [activeTab, setActiveTab] = useState("upload"); 

  const fetchReports = async () => {
    setIsLoading(true);
    const response = await getAllDailySalesReports();
    if (response.data) { setReportHistory(response.data); } 
    else { toast({ title: "Error Fetching Reports", description: response.error, variant: "destructive" }); }
    setIsLoading(false);
  };

  useEffect(() => { 
    fetchReports(); 
  }, []);

  const handleCreateReport = async (payload: DailySalesReportCreatePayload): Promise<boolean> => {
    const response = await createDailySalesReport(payload);
    if (response.data) {
      toast({ title: "Success", description: `Report for ${payload.date} created.` });
      fetchReports(); // Refresh data
      setActiveTab("register"); // Switch to register tab to see the new entry
      return true;
    }
    toast({ title: "Submission Failed", description: response.error, variant: "destructive" });
    return false;
  };

  const handleUpdateReport = async (id: number, payload: DailySalesReportUpdatePayload): Promise<boolean> => {
    const response = await updateDailySalesReport(id, payload);
    if (response.data) {
      toast({ title: "Success", description: `Report for ${payload.date} updated.` });
      setEditingReport(null);
      fetchReports(); // Refresh data
      setActiveTab("register"); // Switch to register tab to see changes
      return true;
    }
    toast({ title: "Update Failed", description: response.error, variant: "destructive" });
    return false;
  };

  const handleDeleteReport = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
        const response = await deleteDailySalesReport(id);
        if (response.data) {
            toast({ title: "Success", description: "Report has been deleted." });
            fetchReports();
        } else {
            toast({ title: "Deletion Failed", description: response.error, variant: "destructive" });
        }
    }
  };
  
  const handleEditClick = (report: DailySalesReport) => {
    setEditingReport(report);
    setActiveTab("upload"); // Switch to the upload tab to edit
  };
  const handleCancelEdit = () => {
    setEditingReport(null);
  };
  
  return (
    <DashboardLayout title="Accounts Dashboard" role="accountant">
        <main className="flex-1 overflow-y-auto">
            <div className="space-y-6 p-4 md:p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6"> 
                    <div className="flex justify-center">
                      <TabsList className="grid w-full grid-cols-2 md:w-auto">
                        {/* Removed: Expense Management Tab Trigger */}
                        <TabsTrigger value="upload" className="flex items-center"><FileUp className="w-4 h-4 mr-2" /> Upload Sales Report</TabsTrigger>
                        <TabsTrigger value="register" className="flex items-center"><ListOrdered className="w-4 h-4 mr-2" /> Sales Report Register</TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Removed: TAB 1: EXPENSE MANAGEMENT (TabsContent value="expenses") */}

                    {/* TAB 1 (Now): UPLOAD SALES REPORT */}
                    <TabsContent value="upload">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><Landmark className="h-5 w-5 mr-2 text-indigo-600" />
                                  {editingReport ? `Editing Report for ${new Date(editingReport.date + 'T00:00:00').toLocaleDateString('en-GB')}` : "Submit Financial Day End Report"}
                                </CardTitle>
                                <CardDescription>
                                  {editingReport ? "Modify the details below and click 'Update Report'." : "Enter key figures from the daily sales and collection summaries."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <DailyReportUpload 
                                onReportCreate={handleCreateReport} 
                                onReportUpdate={handleUpdateReport}
                                reportToEdit={editingReport}
                                onCancelEdit={handleCancelEdit}
                              />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    {/* TAB 2 (Now): SALES REPORT REGISTER */}
                    <TabsContent value="register">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><ListOrdered className="w-5 w-5 mr-2 text-green-600" />Historical Daily Financial Reports</CardTitle>
                                <CardDescription>Review, edit, or delete previously submitted reports.</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <DailyReportRegister 
                                reports={reportHistory} 
                                isLoading={isLoading} 
                                onEdit={handleEditClick}
                                onDelete={handleDeleteReport}
                              />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
        <Toaster />
    </DashboardLayout>
  )
}
