"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// --- API Client Imports for Financial Reports ---
import {
    getAllDailySalesReports,
    deleteDailySalesReport,
    DailySalesReport,
} from "@/lib/accounts";

// --- Icons ---
import {
    Trash2,
    ListOrdered,
    Calendar,
    ChevronDown,
    Info,
    Filter,
    X
} from "lucide-react";

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
    expense: number;
    category: string;
    acDetails: AccountDetails;
};

// --- Helper Functions ---
const formatRupee = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

const getCategoryLabel = (val: string | null) => {
    if (!val) return 'N/A';
    const found = EXPENSE_CATEGORIES.find(c => c.value === val);
    return found ? found.label : val;
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
        expense: apiReport.expense ?? 0,
        category: apiReport.category ?? '',
        acDetails: {
            // Updated Account Mapping
            'IBO 420': apiReport.ibo_420 ?? 0,
            'Decor UJ': apiReport.decor_uj ?? 0, // Lowercase per backend update
            'Anil Fed': apiReport.anil_fed ?? 0,
            'Remya Fed': apiReport.remya_fed ?? 0,
            'KDB 186': apiReport.kdb_186 ?? 0,
            'KGB 070': apiReport.kgb_070 ?? 0,
            'Kiran UJ': apiReport.kiran_uj ?? 0, // NEW
            'Cheque': apiReport.cheque ?? 0,
        },
    };
};

// =============================================================
// CHILD COMPONENT: DailyReportRegister
// =============================================================
interface DailyReportRegisterProps {
    reports: DailySalesReport[];
    isLoading: boolean;
    onDelete: (id: number) => void;
}

const DailyReportRegister = ({ reports, isLoading, onDelete }: DailyReportRegisterProps) => {
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
            return dateB - dateA; // Sort descending (newest first)
        });
    }, [reports, dateFilter, categoryFilter]);

    const clearFilters = () => {
        setDateFilter("");
        setCategoryFilter("");
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="py-2 px-4">
                            <Skeleton className="h-6 w-3/4" />
                        </CardHeader>
                        <div className="px-4 py-2 border-t">
                            <Skeleton className="h-5 w-1/4" />
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

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

                                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => onDelete(report.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                
                                <CollapsibleContent className="p-3 border-t bg-gray-50/30 mt-1">
                                    {/* --- Section 1: Sale Order Summary --- */}
                                    <h4 className="font-semibold text-xs mb-2 border-b pb-1 text-gray-700">Sale Order Summary</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                        <div><span className="text-gray-500 block">Total Orders:</span> <span className="font-medium">{displayReport.totalSaleOrder} NO'S</span></div>
                                        <div><span className="text-gray-500 block">Order Amount:</span> <span className="font-medium">{formatRupee(displayReport.totalSaleOrderAmount)}</span></div>
                                        <div><span className="text-gray-500 block">Order Collected:</span> <span className="font-medium text-green-700">{formatRupee(displayReport.saleOrderCollection)}</span></div>
                                        <div><span className="text-gray-500 block">Order Balance:</span> <span className="font-medium text-red-600">{formatRupee(displayReport.saleOrderBalAmount)}</span></div>
                                    </div>
                                    
                                    {/* --- Section 2: Cash Book Breakdown --- */}
                                    <h4 className="font-semibold text-xs mt-3 mb-2 border-b pb-1 flex items-center justify-between text-gray-700">
                                        <span>Cash Book Breakdown</span>
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                        <div><span className="text-gray-500 block">Total Cash:</span> <span className="font-medium">{formatRupee(displayReport.totalCash)}</span></div>
                                        <div><span className="text-gray-500 block">Total A/C:</span> <span className="font-medium">{formatRupee(displayReport.totalAC)}</span></div>
                                        <div className="bg-red-50 p-1 rounded border border-red-100"><span className="text-gray-500 block">Expenses:</span> <span className="font-medium text-red-600">{formatRupee(displayReport.expense)}</span></div>
                                    </div>
                                    
                                    {/* --- Section 3: A/C Specifics --- */}
                                    <h5 className="font-semibold text-[10px] uppercase text-gray-400 mt-3 mb-1">A/C Specifics</h5>
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-[10px] bg-white border p-2 rounded">
                                        {Object.entries(displayReport.acDetails)
                                            .filter(([, amount]) => amount > 0)
                                            .map(([key, amount]) => (
                                            <div key={key}>
                                                <span className="text-gray-500 block truncate" title={key}>{key}</span> 
                                                <span className="font-medium">{formatRupee(amount)}</span>
                                            </div>
                                        ))}
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
                    <p className="text-xs text-gray-400">No financial reports found matching your filters.</p>
                </div>
            )}
        </div>
    );
};

// =============================================================
// MAIN PAGE COMPONENT
// =============================================================
export const AdminFinancialsPage = () => {
    const { toast } = useToast();

    // --- State for Daily Financial Reports ---
    const [reportHistory, setReportHistory] = useState<DailySalesReport[]>([]);
    const [isLoadingReports, setIsLoadingReports] = useState(true);

    const fetchReports = async () => {
        setIsLoadingReports(true);
        const response = await getAllDailySalesReports();
        if (response.data) {
            setReportHistory(response.data);
        } else {
            toast({ title: "Error Fetching Reports", description: response.error, variant: "destructive" });
        }
        setIsLoadingReports(false);
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleDeleteReport = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this financial report? This action cannot be undone.")) {
            const response = await deleteDailySalesReport(id);
            if (response.data) {
                toast({ title: "Success", description: "Report has been deleted." });
                fetchReports(); // Refresh the list
            } else {
                toast({ title: "Deletion Failed", description: response.error, variant: "destructive" });
            }
        }
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <ListOrdered className="h-5 w-5 mr-2 text-green-600" />
                        Daily Financial Reports
                    </CardTitle>
                    <CardDescription>
                        Review or delete previously submitted end-of-day financial summaries.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DailyReportRegister
                        reports={reportHistory}
                        isLoading={isLoadingReports}
                        onDelete={handleDeleteReport}
                    />
                </CardContent>
            </Card>
            <Toaster />
        </div>
    )
}
