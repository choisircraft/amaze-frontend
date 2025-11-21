// FILE: src/components/admin/admin-tabs/project-management-page.tsx
import React, { useMemo, useState, useEffect } from 'react'; // Added useState and useEffect
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";


import { 
    type Order, 
    type DetailedTask, 
    type OrderById, 
    getActiveStaffs // Added staff fetching function
} from "@/lib/admin"; 

import {
    FolderOpen, Package, Edit, Trash2, Plus, Search, Filter, Eye, Calendar, User, UserPlus, IndianRupee, Phone, MessageSquare, CreditCard, Truck, Image as ImageIcon, Repeat2, Loader2, CheckSquare, ChevronDown
} from "lucide-react";

// --- Type Definitions ---
// Define a simple Staff type for the filter prop
type Staff = {
    id: number;
    name: string;
};

type OrderWithGeneratedId = Order & { 
    generated_order_id?: string | null; 
    product_name?: string | null;
    total_amount?: number | null;
    amount?: number | null;
    completion_date?: string | null;
    created_by_staff_name?: string | null;
    created_on?: string;
    customer_name?: string | null;
    category?: string | null; // Added for category filtering
};

// --- Constants for Filters ---
const ORDER_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
const PROJECT_CATEGORIES = [
    { value: 'crystal_wall_art', label: 'Crystal Wall Art' },
    { value: 'amaze_ads', label: 'Amaze Ads' },
    { value: 'crystal_glass_art', label: 'Crystal Glass Art' },
    { value: 'sign_board_amaze', label: 'Sign Board Amaze' },
];


// --- Utility Functions (Moved from AdminDashboard) ---

const getProjectStatusColor = (status?: string | null) => {
    const s = status?.toLowerCase();
    switch (s) {
        case 'completed': return 'bg-green-100 text-green-800'
        case 'in_progress': case 'inprogress': return 'bg-blue-100 text-blue-800'
        case 'pending': return 'bg-orange-100 text-orange-800'
        case 'cancelled': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}
const getTaskStatusColor = (status?: string | null) => {
    const s = status?.toLowerCase();
    switch (s) {
        case 'completed': return 'bg-green-100 text-green-800'
        case 'inprogress': case 'assigned': return 'bg-blue-100 text-blue-800'
        case 'pending': return 'bg-yellow-100 text-yellow-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}
const canAssignTasksToOrder = (order: Order) => order.status === 'in_progress' || order.status === 'inprogress'; 

const getPaymentStatusBadge = (status: string) => {
    const lowerStatus = status.toLowerCase();
    let color = 'bg-gray-100 text-gray-800';
    let label = status;

    if (lowerStatus === 'paid' || lowerStatus === 'completed') {
        color = 'bg-green-100 text-green-800';
    } else if (lowerStatus === 'pending' || lowerStatus === 'unpaid') {
        color = 'bg-red-100 text-red-800';
    } else if (lowerStatus === 'partial') {
        color = 'bg-yellow-100 text-yellow-800';
    }

    return <Badge className={`capitalize ${color}`}>{label.replace(/_/g, ' ')}</Badge>;
};


// --- Dialog Component (Moved and Renamed for Clarity) ---
interface ProjectDetailsDialogProps {
    viewingOrder: OrderById | null;
    viewingOrderTasks: DetailedTask[];
    isOrderDetailsLoading: boolean;
    onClose: () => void;
    onEditTask: (task: DetailedTask) => void; 
}

export const ProjectDetailsDialog: React.FC<ProjectDetailsDialogProps> = ({
    viewingOrder,
    viewingOrderTasks,
    isOrderDetailsLoading,
    onClose,
    onEditTask
}) => {
    // Content structure remains identical to the original OrderDetailsDialog
    // ... (Dialog Content as previously defined) ...
    // [Implementation details are omitted here for brevity, assuming the full code for OrderDetailsDialog is moved.]
    
    return (
        <Dialog open={!!viewingOrder} onOpenChange={(open) => { 
            if (!open) { 
                onClose();
            } 
        }}>
            <DialogContent className="sm:max-w-[425px] md:max-w-xl flex flex-col max-h-[90vh]">
                
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Project Details #{viewingOrder?.id}</DialogTitle>
                    <DialogDescription>
                        Comprehensive information about this customer project.
                    </DialogDescription>
                </DialogHeader>
                
                {isOrderDetailsLoading ? (
                    <div className="py-10 flex flex-col items-center flex-grow">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <p className="mt-2 text-sm text-gray-500">Loading project details...</p>
                    </div>
                ) : viewingOrder && (
                    <div className="overflow-y-auto flex-grow pr-2">
                        <div className="grid gap-4 py-4 text-sm">
                            
                            {/* CUSTOMER INFO SECTION */}
                            <div className="p-3 bg-gray-50 rounded-lg border">
                                <h4 className="font-bold text-gray-700 mb-2">Customer Information</h4>
                                
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">Customer Name</span>
                                    <span className="col-span-2 font-semibold text-blue-700">{viewingOrder.customer_name || 'N/A'}</span>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">Mobile Number</span>
                                    {viewingOrder.mobile_number ? (
                                        <a
                                            href={`tel:${viewingOrder.mobile_number}`}
                                            className="col-span-2 flex items-center text-blue-600 hover:text-blue-800 transition duration-150"
                                        >
                                            <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                            {viewingOrder.mobile_number}
                                        </a>
                                    ) : (
                                        <span className="col-span-2 text-gray-500">N/A</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">WhatsApp</span>
                                    {viewingOrder.whatsapp_number ? (
                                        <a
                                            href={`https://wa.me/${viewingOrder.whatsapp_number}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="col-span-2 flex items-center text-green-600 hover:text-green-800 transition duration-150"
                                        >
                                            <MessageSquare className="h-3 w-3 mr-2 text-gray-400" />
                                            {viewingOrder.whatsapp_number}
                                        </a>
                                    ) : (
                                        <span className="col-span-2 text-gray-500">N/A</span>
                                    )}
                                </div>
                            </div>
                            
                            {/* PROJECT CORE DETAILS */}
                            <h4 className="font-bold text-gray-700 mt-2 border-t pt-3">Product & Project Details</h4>
                            
                            {/* Generated Order ID Display */}
                            {viewingOrder.generated_order_id && (
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">Generated ID</span>
                                    <span className="col-span-2 font-bold text-red-600">{viewingOrder.generated_order_id}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-medium text-gray-500">Product Name</span>
                                <span className="col-span-2">{viewingOrder.product_name || 'N/A'}</span>
                            </div>
                            
                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-medium text-gray-500 flex items-center"><Package className="h-4 w-4 mr-1" /> Type</span>
                                <span className="col-span-2 font-medium text-purple-700 capitalize">{viewingOrder.order_type?.replace(/_/g, ' ') || 'N/A'}</span>
                            </div>
                            
                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-medium text-gray-500">Category</span>
                                <span className="col-span-2">{viewingOrder.category || 'N/A'}</span>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-medium text-gray-500">Quantity</span>
                                <span className="col-span-2">{viewingOrder.quantity || 0}</span>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-medium text-gray-500">Status</span>
                                <Badge className={getProjectStatusColor(viewingOrder.status || 'pending')}>{viewingOrder.status || 'Pending'}</Badge>
                            </div>
                            
                            {/* FINANCIAL DETAILS */}
                            <h4 className="font-bold text-gray-700 mt-4 border-t pt-3 flex items-center"><IndianRupee className="h-4 w-4 mr-2" /> Financials</h4>
                            
                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-medium text-gray-500">Total Billed Amount</span>
                                <span className="col-span-2 flex items-center text-blue-700 font-bold">
                                    ₹ {(viewingOrder.total_amount || viewingOrder.amount)?.toLocaleString('en-IN') || '0.00'} 
                                </span>
                            </div>
                            
                            {/* ... other financial details ... */}
                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-medium text-gray-500">Amount Paid</span>
                                <span className="col-span-2 flex items-center text-orange-700 font-medium">
                                    ₹ {viewingOrder.amount_payed ? viewingOrder.amount_payed.toLocaleString('en-IN') : '0.00'}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-medium text-gray-500">Payment Status</span>
                                <span className="col-span-2">{getPaymentStatusBadge(viewingOrder.payment_status || 'pending')}</span>
                            </div>

                            {/* Tasks for this Order */}
                            <h4 className="font-bold text-gray-700 mt-4 border-t pt-3 flex items-center"><CheckSquare className="h-4 w-4 mr-2" /> Assigned Tasks ({viewingOrderTasks.length})</h4>

                            {viewingOrderTasks.length === 0 ? (
                                <p className="text-gray-500 italic">No tasks currently assigned to this project.</p>
                            ) : (
                                <div className="space-y-3">
                                    {viewingOrderTasks.map((task) => (
                                        <div key={task.id} className="p-3 border rounded-lg bg-white shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold">{task.task_description || `Task #${task.id}`}</p>
                                                <Badge variant="secondary" className={`capitalize flex-shrink-0 ${getTaskStatusColor(task.status)}`}>
                                                    {task.status}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1 space-y-1">
                                                <p className="flex items-center"><User className="h-3 w-3 mr-1" /> Assigned to: {task.assigned_to?.staff_name || 'N/A'}</p>
                                            </div>
                                            <div className="mt-2 text-right">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-7 px-2 text-xs" 
                                                    onClick={() => onEditTask(task)}
                                                >
                                                    <Edit className="h-3 w-3 mr-1" />Edit Task
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* DESCRIPTION */}
                            <div className="pt-4 border-t mt-4">
                                <p className="font-medium text-gray-500 mb-2">Description / Notes</p>
                                <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border">{viewingOrder.description || 'No description provided.'}</p>
                            </div>

                            {/* FOOTER */}
                            <div className="mt-4 pt-4 text-xs text-gray-500 text-right flex-shrink-0">
                                <p>Created by: {viewingOrder.created_by_staff_name || 'Staff'} on {new Date(viewingOrder.created_on).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <DialogFooter className="flex-shrink-0">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// --- Main Project Management Component ---

interface ProjectManagementProps {
    orders: OrderWithGeneratedId[];
    tasks: DetailedTask[];
    isLoading: boolean;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    
    // Actions
    handleOpenAssignModal: (order: OrderWithGeneratedId) => void;
    handleOpenStatusUpdateModal: (order: OrderWithGeneratedId) => void;
    handleOpenImageModal: (order: OrderWithGeneratedId) => void;
    handleDeleteProject: (id: number) => void;
    handleOpenEditTaskModal: (task: DetailedTask) => void; 
    
    // View Details State and Handlers
    handleViewProject: (order: Order) => void;
    viewingOrder: OrderById | null;
    viewingOrderTasks: DetailedTask[];
    isOrderDetailsLoading: boolean;
    onCloseViewProject: () => void;
}


export const ProjectManagementPage: React.FC<ProjectManagementProps> = ({
    orders,
    isLoading,
    searchTerm,
    setSearchTerm,
    handleOpenAssignModal,
    handleViewProject, 
    handleOpenStatusUpdateModal,
    handleOpenImageModal,
    handleDeleteProject,
    handleOpenEditTaskModal,
    
    viewingOrder,
    viewingOrderTasks,
    isOrderDetailsLoading,
    onCloseViewProject
}) => {
    
    // --- State for self-fetched data ---
    const [staff, setStaff] = useState<Staff[]>([]);

    // --- Filter States ---
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [staffFilter, setStaffFilter] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // --- Data Fetching Effect for Staff ---
    useEffect(() => {
        const fetchStaff = async () => {
            const response = await getActiveStaffs();
            // Assuming the response structure is { data: { staffs: Staff[] } }
            if (response.data && response.data.staffs) {
                setStaff(response.data.staffs);
            } else {
                console.error("Failed to fetch staff list:", response.error);
            }
        };

        fetchStaff();
    }, []); // Empty dependency array ensures this runs only once on mount
    
    const filteredOrders = useMemo(() => orders.filter(order => {
        // Search Term Check
        const matchesSearch =
            (order.description && order.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.product_name && order.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.id && order.id.toString().includes(searchTerm)) ||
            (order.generated_order_id && order.generated_order_id.toLowerCase().includes(searchTerm.toLowerCase()));

        // Status Filter Check
        const matchesStatus = statusFilter === 'all' || order.status?.toLowerCase() === statusFilter.toLowerCase();
        
        // Staff Filter Check
        const matchesStaff = staffFilter === 'all' || order.created_by_staff_name === staffFilter;

        // Category Filter Check
        const matchesCategory = categoryFilter === 'all' || order.category?.toLowerCase() === categoryFilter.toLowerCase();

        // Date Filter Check
        let matchesDate = true;
        const projectCompletionDate = order.completion_date ? new Date(order.completion_date).getTime() : null;
        const hasDateFilters = fromDate || toDate;

        if (hasDateFilters) {
            if (projectCompletionDate === null) {
                matchesDate = false;
            } else {
                if (fromDate) {
                    const fromDateTime = new Date(fromDate);
                    fromDateTime.setHours(0, 0, 0, 0);
                    matchesDate = matchesDate && projectCompletionDate >= fromDateTime.getTime();
                }
                if (toDate) {
                    const toDateTime = new Date(toDate);
                    toDateTime.setHours(23, 59, 59, 999);
                    matchesDate = matchesDate && projectCompletionDate <= toDateTime.getTime();
                }
            }
        }

        return matchesSearch && matchesStatus && matchesStaff && matchesCategory && matchesDate;

    }), [orders, searchTerm, statusFilter, staffFilter, categoryFilter, fromDate, toDate]);

    const activeFilterCount = [statusFilter, staffFilter, categoryFilter, fromDate, toDate].filter(f => f !== 'all' && f !== '').length;

    const renderFilters = () => (
        <>
            <div className="relative flex-1 min-w-[150px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search by ID, name, product..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px] flex-shrink-0">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {ORDER_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={staffFilter} onValueChange={setStaffFilter} disabled={isLoading || staff.length === 0}>
                <SelectTrigger className="w-full md:w-[150px] flex-shrink-0">
                    <SelectValue placeholder="Staff" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {staff.map(s => (<SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>))}
                </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px] flex-shrink-0">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {PROJECT_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Input
                type="date"
                placeholder="Target From Date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full md:w-[150px] flex-shrink-0"
            />
            <Input
                type="date"
                placeholder="Target To Date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full md:w-[150px] flex-shrink-0"
            />
        </>
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center">
                            <FolderOpen className="h-5 w-5 mr-2" /> 
                            Project Management 
                        </CardTitle>
                        <CardDescription>Track and manage all customer projects</CardDescription>
                    </div>
                    <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        New Project
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* --- SEARCH AND FILTER SECTION (Desktop) --- */}
                <div className="hidden md:flex items-center space-x-2 mb-6 gap-2 flex-wrap">
                    {renderFilters()}
                </div>

                {/* --- SEARCH AND FILTER SECTION (Mobile) --- */}
                <Collapsible 
                    open={isFilterOpen} 
                    onOpenChange={setIsFilterOpen}
                    className="md:hidden mb-4 border rounded-lg bg-gray-50"
                >
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start text-sm text-gray-700 p-3 h-auto">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters ({activeFilterCount})
                            <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isFilterOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 p-3 pt-0">
                        <div className="flex flex-col gap-3">
                            {renderFilters()}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
                
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading projects...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8">
                        <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                           {searchTerm || activeFilterCount > 0
                                ? 'No projects found matching your criteria.'
                                : 'No projects found.'
                           }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4"> 
                        {filteredOrders.map((project) => {
                            const canAssign = canAssignTasksToOrder(project)
                            
                            const totalAmountDisplay = (project.total_amount || project.amount)?.toLocaleString('en-IN') || 'N/A';
                            const completionDateDisplay = project.completion_date 
                                ? new Date(project.completion_date).toLocaleDateString()
                                : 'N/A';
                                
                            const generatedIdDisplay = project.generated_order_id 
                                ? <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-semibold text-xs">{project.generated_order_id}</Badge>
                                : null;

                            return (
                                <div key={project.id} className="border rounded-lg p-4 transition-shadow hover:shadow-md bg-white">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        
                                        {/* LEFT SIDE: Project ID, Customer Name, and Staff Info */}
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center">
                                                <FolderOpen className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {project.customer_name || `Project PRJ-${project.id}`}
                                                </h3> 
                                                <div className="flex items-center space-x-2">
                                                    <p className="text-gray-600">Project ID: #{project.id}</p>
                                                    {generatedIdDisplay}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 space-y-1">
                                                    <p>
                                                        Created by {project.created_by_staff_name || 'Staff'} 
                                                        {project.created_on && ` on ${new Date(project.created_on).toLocaleDateString()}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* CENTER SECTION: Key Project Metrics */}
                                        <div className="grid grid-cols-2 gap-4 md:flex md:space-x-8 md:items-center text-sm border-t md:border-t-0 pt-3 md:pt-0">
                                            
                                            <div className="flex flex-col items-start">
                                                <span className="text-xs text-gray-500 flex items-center"><Package className="h-3 w-3 mr-1" /> Product</span>
                                                <span className="font-medium text-gray-800 break-words max-w-[150px]">{project.product_name || 'N/A'}</span>
                                            </div>

                                            <div className="flex flex-col items-start">
                                                <span className="text-xs text-gray-500 flex items-center"><IndianRupee className="h-3 w-3 mr-1" /> Total Budget</span>
                                                <span className="font-bold text-blue-700">₹ {totalAmountDisplay}</span>
                                            </div>
                                            
                                            <div className="flex flex-col items-start">
                                                <span className="text-xs text-gray-500 flex items-center"><Calendar className="h-3 w-3 mr-1" /> Target Date</span>
                                                <span className="font-medium text-gray-800">{completionDateDisplay}</span>
                                            </div>
                                        </div>


                                        {/* RIGHT SIDE: Status and Actions */}
                                        <div className="text-left md:text-right flex flex-col md:items-end">
                                            
                                            <div className="flex items-center justify-start md:justify-end space-x-2 mb-2"> 
                                                <Badge variant="default" className={`capitalize ${getProjectStatusColor(project.status || 'pending')}`}>
                                                    {project.status?.replace(/_/g, ' ') || 'pending'} 
                                                </Badge>
                                            </div>
                                            
                                            {/* ACTION BUTTONS */}
                                            <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                                                
                                                <Button variant="secondary" size="sm" onClick={() => handleViewProject(project)}>
                                                    <Eye className="h-3 w-3 mr-1" />View Details
                                                </Button>
                                                
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="bg-purple-50 hover:bg-purple-100 text-purple-600"
                                                    onClick={() => handleOpenImageModal(project)}
                                                >
                                                    <ImageIcon className="h-3 w-3 mr-1" />Images
                                                </Button>

                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleOpenStatusUpdateModal(project)}
                                                >
                                                    <Repeat2 className="h-3 w-3 mr-1" />
                                                    Status
                                                </Button>
                                                
                                                {canAssign && (
                                                    <Button 
                                                        variant="default" 
                                                        size="sm"
                                                        onClick={() => handleOpenAssignModal(project)}
                                                        disabled={isLoading}
                                                    >
                                                        <UserPlus className="h-3 w-3 mr-1" /> Assign Task
                                                    </Button>
                                                )}

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                                            <Trash2 className="h-3 w-3 mr-1" />Delete
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Project</AlertDialogTitle>
                                                            <AlertDialogDescription>Are you sure you want to delete Project PRJ-#{project.id}? This action cannot be undone.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteProject(project.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>


            {/* RENDER THE PROJECT DETAILS DIALOG */}
            <ProjectDetailsDialog 
                viewingOrder={viewingOrder}
                viewingOrderTasks={viewingOrderTasks}
                isOrderDetailsLoading={isOrderDetailsLoading}
                onClose={onCloseViewProject}
                onEditTask={handleOpenEditTaskModal} 
            />
        </Card>
    );
};
