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
  Banknote, Calculator, Laptop, Pencil, Trash2, XCircle, Filter, X, ShoppingBag
} from "lucide-react"

// =============================================================
// CONFIGURATION
// =============================================================

const EXPENSE_CATEGORIES = [
    { value: 'crystal_wall_art', label: 'Crystal Wall Art' },
    { value: 'amaze_ads', label: 'Amaze Ads' },
    { value: 'crystal_glass_art', label: 'Crystal Glass Art' },
    { value: 'sign_board_amaze', label: 'Sign Board Amaze' }
];

// =============================================================
// TYPES & HELPERS
// =============================================================

type AccountDetails = { [key: string]: number; }
type DailyReportEntry = {
    id: number;
    date: string;
    rawDate: string; 
    totalSaleOrder: number;
    totalSaleOrderAmount: number;
    saleOrderCollection: number;
    saleOrderBalAmount: number;
    totalDayCollection: number;
    totalCash: number;
    totalAC: number;
    expense: number;
    category: string;
    acDetails: AccountDetails;
};

const formatRupee = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

const getCategoryLabel = (val: string | null) => {
    if (!val) return 'N/A';
    const found = EXPENSE_CATEGORIES.find(c => c.value === val);
    return found ? found.label : val;
}

const mapApiToComponent = (apiReport: DailySalesReport): DailyReportEntry => {
    const rawDate = apiReport.date ? apiReport.date.split('T')[0] : '';
    const displayDate = apiReport.date
        ? new Date(apiReport.date + 'T00:00:00').toLocaleDateString('en-GB').replace(/\//g, '-')
        : 'N/A';

    return {
        id: apiReport.id,
        date: displayDate,
        rawDate: rawDate,
        totalSaleOrder: apiReport.total_sales_order ?? 0,
        totalSaleOrderAmount: apiReport.total_sale_order_amount ?? 0,
        saleOrderCollection: apiReport.sale_order_collection ?? 0,
        saleOrderBalAmount: apiReport.sale_order_balance_amount ?? 0,
        totalDayCollection: apiReport.total_day_collection ?? 0,
        totalCash: apiReport.total_amount_on_cash ?? 0,
        totalAC: apiReport.total_amount_on_ac ?? 0,
        expense: apiReport.expense ?? 0,
        category: apiReport.category ?? '',
        acDetails: {
            'IBO 420': apiReport.ibo_420 ?? 0,
            'Decor UJ': apiReport.decor_uj ?? 0, // UPDATED: decor_uj (lowercase)
            'Anil Fed': apiReport.anil_fed ?? 0,
            'Remya Fed': apiReport.remya_fed ?? 0,
            'KDB 186': apiReport.kdb_186 ?? 0,
            'KGB 070': apiReport.kgb_070 ?? 0,
            'Kiran UJ': apiReport.kiran_uj ?? 0, 
            'Cheque': apiReport.cheque ?? 0,
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
    
    // Updated initial state with new column names
    const initialFormState = {
        date: new Date().toISOString().split('T')[0], 
        total_sales_order: '', 
        total_sale_order_amount: '', 
        sale_order_collection: '',
        sale_order_balance_amount: '', 
        total_day_collection: '', 
        total_amount_on_cash: '', 
        total_amount_on_ac: '', 
        
        // Updated Accounts
        ibo_420: '', 
        decor_uj: '', // UPDATED: decor_uj (lowercase)
        anil_fed: '', 
        remya_fed: '', 
        kdb_186: '', 
        kgb_070: '', 
        kiran_uj: '', 
        cheque: '',
        
        expense: '', 
        category: '' 
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
                total_amount_on_ac: String(reportToEdit.total_amount_on_ac ?? ''),
                
                // Map existing data to state
                ibo_420: String(reportToEdit.ibo_420 ?? ''), 
                decor_uj: String(reportToEdit.decor_uj ?? ''), // UPDATED: decor_uj
                anil_fed: String(reportToEdit.anil_fed ?? ''),
                remya_fed: String(reportToEdit.remya_fed ?? ''), 
                kdb_186: String(reportToEdit.kdb_186 ?? ''),
                kgb_070: String(reportToEdit.kgb_070 ?? ''), 
                kiran_uj: String(reportToEdit.kiran_uj ?? ''),
                cheque: String(reportToEdit.cheque ?? ''),
                
                expense: String(reportToEdit.expense ?? ''),
                category: reportToEdit.category ?? ''
            });
        } else {
            setFormData(initialFormState);
        }
    }, [reportToEdit]);
    
    // Auto-calculate Total AC
    useEffect(() => {
        const saleCollection = parseFloat(formData.sale_order_collection) || 0;
        const saleBalance = parseFloat(formData.sale_order_balance_amount) || 0;
        const newTotalDayCollection = saleCollection + saleBalance;
        
        const ibo = parseFloat(formData.ibo_420) || 0;
        const decor = parseFloat(formData.decor_uj) || 0; // UPDATED: decor_uj
        const anil = parseFloat(formData.anil_fed) || 0;
        const remya = parseFloat(formData.remya_fed) || 0;
        const kdb = parseFloat(formData.kdb_186) || 0;
        const kgb = parseFloat(formData.kgb_070) || 0;
        const kiran = parseFloat(formData.kiran_uj) || 0; 
        const cheque = parseFloat(formData.cheque) || 0;
        
        const newTotalAC = ibo + decor + anil + remya + kdb + kgb + kiran + cheque;
        
        setFormData(prev => ({ 
            ...prev, 
            total_day_collection: newTotalDayCollection > 0 ? String(newTotalDayCollection) : '', 
            total_amount_on_ac: newTotalAC > 0 ? String(newTotalAC) : '' 
        }));
    }, [
        formData.sale_order_collection, formData.sale_order_balance_amount, 
        formData.ibo_420, formData.decor_uj, formData.anil_fed, formData.remya_fed,
        formData.kdb_186, formData.kgb_070, formData.kiran_uj, formData.cheque
    ]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // --- VALIDATION ---
        if (!formData.date) {
            toast({ title: "Validation Error", description: "Date is required.", variant: "destructive" });
            return;
        }
        
        // Added Category Validation
        if (!formData.category) {
            toast({ title: "Validation Error", description: "Please select a Category.", variant: "destructive" });
            return;
        }
        // ------------------

        setIsSubmitting(true);
        
        const payload: DailySalesReportCreatePayload = {
            date: formData.date, 
            total_sales_order: formData.total_sales_order ? parseInt(formData.total_sales_order) : null,
            total_sale_order_amount: parseFloat(formData.total_sale_order_amount) || null,
            sale_order_collection: parseFloat(formData.sale_order_collection) || null,
            sale_order_balance_amount: parseFloat(formData.sale_order_balance_amount) || null,
            total_day_collection: parseFloat(formData.total_day_collection) || null,
            total_amount_on_cash: parseFloat(formData.total_amount_on_cash) || null,
            total_amount_on_ac: parseFloat(formData.total_amount_on_ac) || null,
            
            // Updated Payload keys
            ibo_420: parseFloat(formData.ibo_420) || null, 
            decor_uj: parseFloat(formData.decor_uj) || null, // UPDATED: decor_uj
            anil_fed: parseFloat(formData.anil_fed) || null,
            remya_fed: parseFloat(formData.remya_fed) || null, 
            kdb_186: parseFloat(formData.kdb_186) || null,
            kgb_070: parseFloat(formData.kgb_070) || null, 
            kiran_uj: parseFloat(formData.kiran_uj) || null, 
            
            cheque: parseFloat(formData.cheque) || null,
            expense: parseFloat(formData.expense) || null,
            category: formData.category || null,
        };
        
        let success = false;
        if (isEditMode) {
            success = await onReportUpdate(reportToEdit!.id, payload as DailySalesReportUpdatePayload);
        } else {
            success = await onReportCreate(payload);
        }
        if (success) { setFormData(initialFormState); }
        setIsSubmitting(false);
    };
    
    const inputClass = "h-8 text-sm"; 
    const selectClass = "flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
    const readOnlyInputClass = "h-8 text-sm bg-muted focus:ring-0 focus:ring-offset-0 cursor-not-allowed font-bold";
    const labelClass = "text-xs font-medium text-muted-foreground truncate block mb-0.5";

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex items-end justify-between gap-4 border-b pb-1">
                <div className="flex gap-4 w-full max-w-2xl">
                    <div className="w-40">
                        <label htmlFor="date" className={labelClass}>Report Date</label>
                        <Input id="date" type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div className="w-56">
                        <label htmlFor="category" className={labelClass}>Category <span className="text-red-500">*</span></label>
                        <select 
                            id="category" 
                            name="category" 
                            value={formData.category} 
                            onChange={handleChange} 
                            required // Added HTML5 validation
                            className={selectClass}
                        >
                            <option value="">Select Category...</option>
                            {EXPENSE_CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2">
                    {isEditMode && (
                        <Button type="button" variant="outline" size="sm" onClick={onCancelEdit} className="h-8">
                            <XCircle className="mr-2 h-3 w-3" /> Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting} size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 min-w-[130px]">
                        {isSubmitting ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Saving...</> : 
                         isEditMode ? <><Pencil className="mr-2 h-3 w-3" />Update</> : 
                                       <><FileUp className="mr-2 h-3 w-3" />Submit</>}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 h-full">
                <Card className="p-2 shadow-sm">
                    <CardTitle className="text-sm mb-1 flex items-center text-gray-700"><ListOrdered className="w-3 h-3 mr-2" /> Sale Order Details</CardTitle>
                    <div className="space-y-2">
                        <div>
                            <label htmlFor="total_sales_order" className={labelClass}>Total Sale Orders (NO'S)</label>
                            <Input id="total_sales_order" type="number" name="total_sales_order" placeholder="" value={formData.total_sales_order} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="total_sale_order_amount" className={labelClass}>Total Sale Order Amount (₹)</label>
                            <Input id="total_sale_order_amount" type="number" name="total_sale_order_amount" placeholder="" value={formData.total_sale_order_amount} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="sale_order_collection" className={labelClass}>Sale Order Collection (₹)</label>
                            <Input id="sale_order_collection" type="number" name="sale_order_collection" placeholder="" value={formData.sale_order_collection} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="sale_order_balance_amount" className={labelClass}>Sale Order Balance Amount (₹)</label>
                            <Input id="sale_order_balance_amount" type="number" name="sale_order_balance_amount" placeholder="" value={formData.sale_order_balance_amount} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                </Card>

                <Card className="p-2 shadow-sm">
                    <CardTitle className="text-sm mb-1 flex items-center text-gray-700"><Calculator className="w-3 h-3 mr-2" /> Cash Book & Expenses</CardTitle>
                    <div className="space-y-2">
                        <div className="p-2 bg-green-50 rounded border border-green-100">
                            <label className="text-xs font-bold flex items-center text-green-700 uppercase mb-1">Total Day Collection (₹)</label>
                            <Input type="number" name="total_day_collection" placeholder="Auto-calculated..." value={formData.total_day_collection} className={`${readOnlyInputClass} border-green-200 text-green-800`} readOnly />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label htmlFor="total_amount_on_cash" className={labelClass}>Total CASH (₹)</label>
                                <Input id="total_amount_on_cash" type="number" name="total_amount_on_cash" placeholder="" value={formData.total_amount_on_cash} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Total A/C (₹)</label>
                                <Input type="number" name="total_amount_on_ac" placeholder="Auto..." value={formData.total_amount_on_ac} className={readOnlyInputClass} readOnly />
                            </div>
                        </div>

                        <div className="pt-1 border-t border-dashed">
                            <label htmlFor="expense" className={labelClass}>Expense Amount (₹)</label>
                            <Input id="expense" type="number" name="expense" placeholder="" value={formData.expense} onChange={handleChange} className={`${inputClass} text-red-600`} />
                        </div>
                    </div>
                </Card>

                <Card className="p-2 shadow-sm">
                    <CardTitle className="text-sm mb-1 flex items-center text-gray-700"><DollarSign className="w-3 h-3 mr-2" /> A/C Specifics</CardTitle>
                    <div className="grid grid-cols-2 gap-2">
                        <div><label htmlFor="ibo_420" className={labelClass}>IBO 420 (₹)</label><Input id="ibo_420" type="number" name="ibo_420" placeholder="" value={formData.ibo_420} onChange={handleChange} className={inputClass} /></div>
                        
                        {/* UPDATED: decor_uj */}
                        <div><label htmlFor="decor_uj" className={labelClass}>Decor UJ (₹)</label><Input id="decor_uj" type="number" name="decor_uj" placeholder="" value={formData.decor_uj} onChange={handleChange} className={inputClass} /></div>
                        
                        <div><label htmlFor="anil_fed" className={labelClass}>Anil Fed (₹)</label><Input id="anil_fed" type="number" name="anil_fed" placeholder="" value={formData.anil_fed} onChange={handleChange} className={inputClass} /></div>
                        <div><label htmlFor="remya_fed" className={labelClass}>Remya Fed (₹)</label><Input id="remya_fed" type="number" name="remya_fed" placeholder="" value={formData.remya_fed} onChange={handleChange} className={inputClass} /></div>
                        
                        <div><label htmlFor="kdb_186" className={labelClass}>KDB 186 (₹)</label><Input id="kdb_186" type="number" name="kdb_186" placeholder="" value={formData.kdb_186} onChange={handleChange} className={inputClass} /></div>
                        <div><label htmlFor="kgb_070" className={labelClass}>KGB 070 (₹)</label><Input id="kgb_070" type="number" name="kgb_070" placeholder="" value={formData.kgb_070} onChange={handleChange} className={inputClass} /></div>
                        
                        <div><label htmlFor="kiran_uj" className={labelClass}>Kiran UJ (₹)</label><Input id="kiran_uj" type="number" name="kiran_uj" placeholder="" value={formData.kiran_uj} onChange={handleChange} className={inputClass} /></div>
                        <div><label htmlFor="cheque" className={labelClass}>Cheque (₹)</label><Input id="cheque" type="number" name="cheque" placeholder="" value={formData.cheque} onChange={handleChange} className={inputClass} /></div>
                    </div>
                </Card>
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
    const [dateFilter, setDateFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");

    const filteredReports = useMemo(() => {
        let data = [...reports];
        if (dateFilter) {
            data = data.filter(r => r.date && r.date.startsWith(dateFilter));
        }
        if (categoryFilter) {
            data = data.filter(r => r.category === categoryFilter);
        }
        return data.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });
    }, [reports, dateFilter, categoryFilter]);

    const clearFilters = () => {
        setDateFilter("");
        setCategoryFilter("");
    };

    if (isLoading) { return <div className="space-y-4">{[...Array(3)].map((_, i) => (<Card key={i}><CardHeader className="py-2 px-4"><Skeleton className="h-6 w-3/4" /></CardHeader><div className="px-4 py-2 border-t"><Skeleton className="h-5 w-1/4" /></div></Card>))}</div>; }
    
    return (
        <div className="space-y-2">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2 mb-2 p-2 bg-gray-50 rounded-md border">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-600">Filters:</span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto flex-1">
                    <Input 
                        type="date" 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)} 
                        className="h-7 text-xs w-full sm:w-36 bg-white" 
                    />
                    <select 
                        value={categoryFilter} 
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="h-7 text-xs w-full sm:w-40 rounded-md border border-input bg-white px-3 py-1 focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="">All Categories</option>
                        {EXPENSE_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>
                {(dateFilter || categoryFilter) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs px-2 hover:bg-gray-200 text-red-600">
                        <X className="w-3 h-3 mr-1" /> Clear
                    </Button>
                )}
            </div>

            {/* List */}
            {filteredReports.map((report) => {
                const displayReport = mapApiToComponent(report);
                const categoryLabel = getCategoryLabel(displayReport.category);

                return (
                    <Card key={report.id} className="shadow-sm">
                        <CardHeader className="py-1 px-3 border-b bg-white">
                            <Collapsible className="group/collapsible"> 
                                <div className="flex justify-between items-center gap-2">
                                    {/* Left: Date & Category */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                                            <span className="text-sm font-bold text-gray-800">{displayReport.date}</span>
                                        </div>
                                        {displayReport.category && (
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal border-gray-200 bg-gray-100 text-gray-600">
                                                {categoryLabel}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Right: Actions & Toggle */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {/* Order Count Badge */}
                                        <Badge variant="outline" className="hidden sm:flex text-[10px] px-2 h-5 border-blue-200 text-blue-700 bg-blue-50">
                                            Orders: {displayReport.totalSaleOrder}
                                        </Badge>

                                        <Badge className="bg-green-600 hover:bg-green-700 hidden sm:flex text-[10px] px-2 h-5">
                                            Total: {formatRupee(displayReport.totalDayCollection)}
                                        </Badge>
                                        
                                        {/* View Details Button */}
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2 hover:bg-gray-100 text-gray-600 hover:text-gray-900 [&[data-state=open]>svg]:rotate-180">
                                                <span className="hidden sm:inline">View Details</span>
                                                <span className="sm:hidden">Details</span>
                                                <ChevronDown className="h-3 w-3 transition-transform duration-200" />
                                            </Button>
                                        </CollapsibleTrigger>

                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onEdit(report)}><Pencil className="h-3 w-3" /></Button>
                                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => onDelete(report.id)}><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                                
                                <CollapsibleContent className="p-3 border-t bg-gray-50/30 mt-1">
                                    <h4 className="font-semibold text-xs mb-2 border-b pb-1 text-gray-700">Sale Order Summary</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                        <div><span className="text-gray-500 block">Total Orders:</span> <span className="font-medium">{displayReport.totalSaleOrder} NO'S</span></div>
                                        <div><span className="text-gray-500 block">Order Amount:</span> <span className="font-medium">{formatRupee(displayReport.totalSaleOrderAmount)}</span></div>
                                        <div><span className="text-gray-500 block">Order Collected:</span> <span className="font-medium text-green-700">{formatRupee(displayReport.saleOrderCollection)}</span></div>
                                        <div><span className="text-gray-500 block">Order Balance:</span> <span className="font-medium text-red-600">{formatRupee(displayReport.saleOrderBalAmount)}</span></div>
                                    </div>
                                    
                                    <h4 className="font-semibold text-xs mt-3 mb-2 border-b pb-1 flex items-center justify-between text-gray-700">
                                        <span>Cash Book Breakdown</span>
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                        <div><span className="text-gray-500 block">Total Cash:</span> <span className="font-medium">{formatRupee(displayReport.totalCash)}</span></div>
                                        <div><span className="text-gray-500 block">Total A/C:</span> <span className="font-medium">{formatRupee(displayReport.totalAC)}</span></div>
                                        <div className="bg-red-50 p-1 rounded border border-red-100"><span className="text-gray-500 block">Expenses:</span> <span className="font-medium text-red-600">{formatRupee(displayReport.expense)}</span></div>
                                    </div>
                                    
                                    <h5 className="font-semibold text-[10px] uppercase text-gray-400 mt-3 mb-1">A/C Specifics</h5>
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-[10px] bg-white border p-2 rounded">
                                        {Object.entries(displayReport.acDetails).filter(([, amount]) => amount > 0).map(([key, amount]) => (<div key={key}><span className="text-gray-500 block truncate" title={key}>{key}</span> <span className="font-medium">{formatRupee(amount)}</span></div>))}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </CardHeader>
                    </Card>
                )
            })}
             {!isLoading && filteredReports.length === 0 && (
                <div className="text-center py-8 border border-dashed rounded-md">
                    <Info className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No reports match your filters.</p>
                </div>
             )}
        </div>
    );
};

// =============================================================
// MAIN PAGE COMPONENT
// =============================================================
export function AccountantDashboard() {
  const { toast } = useToast()
  const [reportHistory, setReportHistory] = useState<DailySalesReport[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [editingReport, setEditingReport] = useState<DailySalesReport | null>(null);
  const [activeTab, setActiveTab] = useState("upload"); 

  const fetchReports = async () => {
    setIsLoading(true);
    const response = await getAllDailySalesReports();
    if (response.data) { setReportHistory(response.data); } 
    else { toast({ title: "Error Fetching Reports", description: response.error, variant: "destructive" }); }
    setIsLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const handleCreateReport = async (payload: DailySalesReportCreatePayload): Promise<boolean> => {
    const response = await createDailySalesReport(payload);
    if (response.data) {
      toast({ title: "Success", description: `Report for ${payload.date} created.` });
      fetchReports(); 
      setActiveTab("register"); 
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
      fetchReports(); 
      setActiveTab("register");
      return true;
    }
    toast({ title: "Update Failed", description: response.error, variant: "destructive" });
    return false;
  };

  const handleDeleteReport = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
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
    setActiveTab("upload");
  };
  const handleCancelEdit = () => {
    setEditingReport(null);
  };
  
  return (
    <DashboardLayout title="Accounts Dashboard" role="accountant">
        <main className="flex-1 overflow-y-auto">
            <div className="px-2 pt-1 pb-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0"> 
                    
                    <div className="flex justify-center mb-1">
                      <TabsList className="grid w-full grid-cols-2 md:w-auto h-8">
                        <TabsTrigger value="upload" className="text-xs py-1"><FileUp className="w-3 h-3 mr-2" /> Upload Report</TabsTrigger>
                        <TabsTrigger value="register" className="text-xs py-1"><ListOrdered className="w-3 h-3 mr-2" /> Register</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="upload" className="mt-0">
                        <Card>
                            <CardHeader className="p-2 border-b">
                                <div className="flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Landmark className="h-4 w-4 text-indigo-600" />
                                        <span className="text-sm font-bold">
                                            {editingReport ? `Editing: ${new Date(editingReport.date + 'T00:00:00').toLocaleDateString('en-GB')}` : "Financial Day End Report"}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 hidden sm:inline">
                                        {editingReport ? "Update details below." : "Auto-calculated totals."}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-2">
                              <DailyReportUpload 
                                onReportCreate={handleCreateReport} 
                                onReportUpdate={handleUpdateReport}
                                reportToEdit={editingReport}
                                onCancelEdit={handleCancelEdit}
                              />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="register" className="mt-0">
                        <Card>
                            <CardHeader className="py-2 px-4 border-b">
                                <CardTitle className="flex items-center text-base"><ListOrdered className="w-4 h-4 mr-2 text-green-600" />Historical Reports</CardTitle>
                            </CardHeader>
                            <CardContent className="p-2">
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
