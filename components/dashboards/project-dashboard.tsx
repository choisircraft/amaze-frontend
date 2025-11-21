"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "../dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog" 

// API client and types (Assumed to be correctly exported from "@/lib/printing"):
import { 
  getAllTasks, 
  editTask, 
  getOrderById,
  type DetailedTask, 
  type EditTaskPayload,
  type OrderDetails, 
  type ApiResponse
} from "@/lib/printing" // Ensure this path is correct for your project

import {
  Printer,       // Main icon for printing
  Package,       // Daily Output / Delivery Type
  CheckCircle,   // Completion / Quality Rate
  Clock,         // Assigned On
  TrendingUp,
  Filter,        // Filter icon
  Eye,           // View Order
  Settings,
  Zap,           // In Progress
  UserPlus,      // Assigned By
  Calendar,      // Project Target Date
  FolderOpen,    // Order ID
  Loader2,       // Loading state
  AlertCircle,   // Error/Filter miss
  CheckSquare,   // No Tasks state
  MessageSquare, // WhatsApp
  IndianRupee, 
  Phone,       
  CreditCard,  
  Truck,       
  XCircle,     
  Hourglass,     // Task Completion Due Date
  Check as CheckIcon, // Actual Completed Date
} from "lucide-react"


// --- Helper Functions ---

/**
 * Checks if the given date string corresponds to today's date (ignoring time).
 */
const isDateToday = (dateString?: string | null): boolean => {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;

    const today = new Date();
    
    // Normalize both to start of day for accurate comparison
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return date.getTime() === today.getTime();
};

/**
 * Helper for task status badge colors
 */
const getTaskStatusColor = (status?: string | null) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "printing":
    case "in_progress":
      return "bg-blue-100 text-blue-800"
    case "queued":
    case "pending":
    case "assigned":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Helper for payment status badge
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

// Helper for Order Status Color
const getProjectStatusColor = (status?: string | null) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-orange-100 text-orange-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
}


// --- PRINTING METRICS ---
const printingMetrics = [
    { name: "Active Print Jobs", value: "8", change: "+2", icon: Printer },
    { name: "Daily Output", value: "24", change: "+6", icon: Package },
    { name: "Quality Rate", value: "96%", change: "+2%", icon: CheckCircle },
    { name: "Equipment Uptime", value: "94%", change: "+1%", icon: Settings },
]

// --- Reusable Filter Controls Component ---
interface FilterControlsProps {
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    filterAssignedDateFrom: string;
    setFilterAssignedDateFrom: (date: string) => void;
    filterCompletionDateTo: string;
    setFilterCompletionDateTo: (date: string) => void;
    filterProjectTargetDateTo: string;
    setFilterProjectTargetDateTo: (date: string) => void;
    
    handleClearFilters: () => void;
    isFilterActive: boolean;
    isMobile?: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({
    filterStatus, setFilterStatus,
    filterAssignedDateFrom, setFilterAssignedDateFrom,
    filterCompletionDateTo, setFilterCompletionDateTo,
    filterProjectTargetDateTo, setFilterProjectTargetDateTo,
    handleClearFilters, isFilterActive, isMobile = false
}) => (
    <div className={`flex flex-wrap items-end gap-3 ${isMobile ? 'flex-col items-stretch' : ''}`}>
        
        {/* Status Filter */}
        <div className={`flex flex-col gap-1 ${isMobile ? 'w-full' : 'w-[150px] flex-shrink-0'}`}>
            <label className="text-xs font-medium text-gray-600">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="assigned">Queued / Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress / Printing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {/* Assigned Date Filter (FROM) */}
        <div className={`flex flex-col gap-1 ${isMobile ? 'w-full' : 'w-[180px] flex-shrink-0'}`}>
            <label className="text-xs font-medium text-gray-600">Task Assigned After</label>
            <Input 
                type="date" 
                value={filterAssignedDateFrom} 
                onChange={(e) => setFilterAssignedDateFrom(e.target.value)} 
            />
        </div>

        {/* Task Completion Date Filter (TO) */}
        <div className={`flex flex-col gap-1 ${isMobile ? 'w-full' : 'w-[180px] flex-shrink-0'}`}>
            <label className="text-xs font-medium text-gray-600">Task Completed Before</label>
            <Input 
                type="date" 
                value={filterCompletionDateTo} 
                onChange={(e) => setFilterCompletionDateTo(e.target.value)} 
            />
        </div>
        
        {/* Project Target Date Filter (TO) */}
        <div className={`flex flex-col gap-1 ${isMobile ? 'w-full' : 'w-[180px] flex-shrink-0'}`}>
            <label className="text-xs font-medium text-red-700 font-semibold">Project Due Before</label>
            <Input 
                type="date" 
                value={filterProjectTargetDateTo} 
                onChange={(e) => setFilterProjectTargetDateTo(e.target.value)} 
            />
        </div>
        
        {/* Clear Button */}
        {(isFilterActive || isMobile) && (
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearFilters} 
                className={`${isMobile ? 'w-full mt-4' : 'mt-auto h-9'} text-red-600 border-red-200 hover:bg-red-50`}
            >
                <XCircle className="h-4 w-4 mr-1" />
                Clear Filters
            </Button>
        )}
    </div>
);


// --- MAIN COMPONENT ---
export function PrintingDashboard() {
  const { toast } = useToast()

  // --- STATE MANAGEMENT ---
  const [tasks, setTasks] = useState<DetailedTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null)
  
  const [viewingOrder, setViewingOrder] = useState<OrderDetails | null>(null)
  const [isOrderDetailsLoading, setIsOrderDetailsLoading] = useState(false)
  
  // --- STATE MANAGEMENT FOR FILTERS ---
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignedDateFrom, setFilterAssignedDateFrom] = useState<string>(''); 
  const [filterCompletionDateTo, setFilterCompletionDateTo] = useState<string>(''); 
  const [filterProjectTargetDateTo, setFilterProjectTargetDateTo] = useState<string>(''); 
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false); 


  // --- DATA FETCHING FOR TASKS ---
  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setIsLoading(true)
    setError(null)
    // NOTE: Using getAllTasks from "@/lib/printing"
    const response = await getAllTasks()

    if (response.error) {
      setError(response.error)
      toast({ variant: "destructive", title: "Failed to load tasks", description: response.error })
    } else if (response.data) {
      setTasks(response.data)
    }
    setIsLoading(false)
  }
  
  // --- HANDLER FOR VIEWING ORDER DETAILS ---
  const handleViewOrder = async (orderId: number) => {
    setViewingOrder(null);
    setIsOrderDetailsLoading(true);
    
    // NOTE: Using getOrderById from "@/lib/printing"
    const response = await getOrderById(orderId);
    
    if (response.data) {
        setViewingOrder(response.data);
    } else {
        console.error("Failed to load detailed order view:", response.error);
        toast({
            title: "Error",
            description: response.error || "Failed to load detailed order information.",
            variant: "destructive",
        });
    }
    
    setIsOrderDetailsLoading(false);
  }

  // --- HANDLER FOR TASK STATUS UPDATE ---
  const handleStatusChange = async (taskId: number, newStatus: string) => {
    setUpdatingTaskId(taskId)
    const payload: EditTaskPayload = { status: newStatus }
    
    // Auto-set completion time if marking as complete
    if (newStatus === "completed") {
      payload.completion_time = new Date().toISOString(); 
      // The backend should handle setting completed_on if completion_time is provided upon completion
    }
    
    // NOTE: Using editTask from "@/lib/printing"
    const response = await editTask(taskId, payload)

    if (response.error) {
      toast({ variant: "destructive", title: "Update Failed", description: response.error })
    } else {
      toast({ title: "Status Updated", description: `Task status changed to ${newStatus.replace(/_/g, ' ')}.` })
      loadTasks() // Refresh data to show changes
    }
    setUpdatingTaskId(null)
  }

  // --- FILTERING LOGIC ---
  const getFilteredTasks = useMemo(() => {
    if (!tasks) return [];
    let filtered = tasks;

    // 1. Status Filter
    if (filterStatus !== 'all') {
        filtered = filtered.filter(task => task.status === filterStatus);
    }

    // 2. Assigned Date 
    if (filterAssignedDateFrom) {
        const filterDate = new Date(filterAssignedDateFrom);
        filterDate.setHours(0, 0, 0, 0); 
        
        filtered = filtered.filter(task => {
            if (!task.assigned_on) return false;
            const taskDate = new Date(task.assigned_on);
            // Ignore time components
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() >= filterDate.getTime();
        });
    }
    
    // 3. Task Completion Date 
    if (filterCompletionDateTo) {
        const filterDate = new Date(filterCompletionDateTo);
        filterDate.setHours(23, 59, 59, 999); 

        filtered = filtered.filter(task => {
            // Check against completion_time (the target deadline) or completed_on (actual finish date)
            const completionDateStr = task.completion_time || task.completed_on; 
            
            if (task.status !== 'completed' || !completionDateStr) return false;
            const taskCompletionDate = new Date(completionDateStr);
            return taskCompletionDate.getTime() <= filterDate.getTime();
        });
    }

    // 4. Project Target Completion Date Filter
    if (filterProjectTargetDateTo) {
        const filterDate = new Date(filterProjectTargetDateTo);
        filterDate.setHours(23, 59, 59, 999); 

        filtered = filtered.filter(task => {
            if (!task.order_completion_date) return false;
            
            const projectTargetDate = new Date(task.order_completion_date);
            return projectTargetDate.getTime() <= filterDate.getTime();
        });
    }

    return filtered;
  }, [tasks, filterStatus, filterAssignedDateFrom, filterCompletionDateTo, filterProjectTargetDateTo]);

  // --- CLEAR FILTERS HANDLER ---
  const handleClearFilters = () => {
      setFilterStatus('all');
      setFilterAssignedDateFrom('');
      setFilterCompletionDateTo('');
      setFilterProjectTargetDateTo(''); 
      toast({ description: "Filters cleared." });
  }

  // Determine if any filter is active
  const isFilterActive = filterStatus !== 'all' 
    || filterAssignedDateFrom 
    || filterCompletionDateTo
    || filterProjectTargetDateTo;


  return (
    <DashboardLayout title="Printing Dashboard" role="printing">

      <Tabs defaultValue="tasks" className="space-y-6"> 
        
        {/* --- TABS LIST (Simplified) --- */}
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">Print Tasks</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* ==================================================================== */}
        {/* REPORTS SECTION */}
        {/* ==================================================================== */}
        <TabsContent value="reports" className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Performance Overview</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {printingMetrics.map((metric) => {
                    const Icon = metric.icon
                    return (
                        <Card key={metric.name}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{metric.value}</div>
                                <p className="text-xs text-green-600 flex items-center">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    {metric.change} this month
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
            
            <Card>
                <CardHeader><CardTitle>Detailed Analytics</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">Further charts and analytical reports will be displayed here.</p>
                </CardContent>
            </Card>
        </TabsContent>


        {/* ==================================================================== */}
        {/* LIVE TASK SECTION (Print Tasks) - REFACTORED TO MATCH DESIGNER DASHBOARD */}
        {/* ==================================================================== */}
        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center">
                      <Printer className="h-5 w-5 mr-2" />Print Queue Management
                    </CardTitle>
                    <CardDescription>
                      Monitor and manage printing jobs. Update status from Queued -> In Progress -> Completed.
                    </CardDescription>
                  </div>
              </div>
            </CardHeader>
            <CardContent>

              {/* --- DESKTOP FILTER BAR --- */}
              <div className="hidden md:flex items-end gap-3 mb-6 p-4 border rounded-lg bg-gray-50 overflow-x-auto">
                  <Filter className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" />
                  <FilterControls 
                      filterStatus={filterStatus}
                      setFilterStatus={setFilterStatus}
                      filterAssignedDateFrom={filterAssignedDateFrom}
                      setFilterAssignedDateFrom={setFilterAssignedDateFrom}
                      filterCompletionDateTo={filterCompletionDateTo}
                      setFilterCompletionDateTo={setFilterCompletionDateTo}
                      filterProjectTargetDateTo={filterProjectTargetDateTo} 
                      setFilterProjectTargetDateTo={setFilterProjectTargetDateTo} 
                      handleClearFilters={handleClearFilters}
                      isFilterActive={isFilterActive}
                      isMobile={false}
                  />
              </div>

              {/* --- MOBILE FILTER BUTTON --- */}
              <div className="md:hidden flex justify-between items-center mb-4">
                  <Button 
                      variant="outline" 
                      onClick={() => setIsMobileFilterOpen(true)}
                      className="w-full"
                  >
                      <Filter className="h-4 w-4 mr-2" />
                      {isFilterActive ? `Filters Active (${isFilterActive ? 'On' : 'Off'})` : "Filter Tasks"}
                  </Button>
              </div>


              {isLoading ? (
                // ... Loading State ...
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                        <p className="mt-2 text-sm text-gray-500">Loading print tasks...</p>
                    </div>
                </div>
              ) : error ? (
                // ... Error State ...
                <div className="text-center py-20 text-red-600">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p className="font-semibold">Failed to load print queue</p>
                    <p className="text-sm">{error}</p>
                </div>
              ) : tasks.length === 0 ? (
                // ... No Tasks State ...
                <div className="text-center py-20">
                    <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">The print queue is empty. No tasks to show.</p>
                </div>
              ) : getFilteredTasks.length === 0 ? (
                // ... No Filter Match State ...
                <div className="text-center py-20">
                    <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                    <p className="text-gray-500">No print tasks match the current filter criteria.</p>
                </div>
              ) : (
                // --- Task List ---
                <div className="space-y-4">
                  {getFilteredTasks.map((task) => {
                    
                    // Determine styling for Project Target Date
                    const isTargetToday = isDateToday(task.order_completion_date);
                    const targetClass = isTargetToday 
                        ? 'font-bold text-red-700 bg-red-100 p-1 rounded' 
                        : 'text-gray-600';

                    // --- NEW LOGIC: Check for Overdue Task ---
                    const isCompleted = task.status === 'completed';
                    let isOverdue = false;
                    
                    if (!isCompleted && task.completion_time) {
                        const dueDate = new Date(task.completion_time);
                        // Compare against the end of the due day
                        dueDate.setHours(23, 59, 59, 999); 
                        const now = new Date();
                        
                        if (now.getTime() > dueDate.getTime()) {
                            isOverdue = true;
                        }
                    }

                    // Conditional styling for the task card
                    const cardClass = isOverdue 
                        ? "border-4 border-red-500 rounded-lg p-3 sm:p-4 bg-red-50" 
                        : "border rounded-lg p-3 sm:p-4";
                        
                    return (
                        <div key={task.id} className={cardClass}>
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                                
                                {/* Task Details (Left side, takes up space) */}
                                <div className="flex-1 min-w-0">
                                    
                                    {/* 1. Customer Name as Main Title (Blue/Large) */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 border-b pb-2">
                                        <h2 className="font-bold text-lg text-blue-700 truncate max-w-full">
                                            Customer: {task.customer?.name || "N/A"} 
                                        </h2>
                                        
                                        {/* Show Task ID explicitly */}
                                        <p className="text-sm text-gray-500 flex-shrink-0">
                                            Task ID: <span className="font-semibold text-gray-800">#{task.id}</span>
                                        </p>
                                    </div>

                                    {/* 2. Product Name / Order ID Block (Highlighted) */}
                                    <div className="mb-3">
                                        <h3 className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                                            <Package className="h-3 w-3 mr-1 text-blue-600" /> Project / Product Details:
                                        </h3>
                                        <div className="text-sm text-gray-700 p-2 bg-blue-50/70 border border-blue-200 rounded whitespace-pre-wrap max-h-20 overflow-y-auto">
                                            <p className="font-semibold text-base text-blue-800 mb-1">
                                                {task.order?.product_name || "Product Name N/A"}
                                            </p>
                                            <p className="text-xs text-blue-600">
                                                Order ID: {task.order?.generated_order_id || `PRJ-${task.order_id}`}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* 3. Metadata block (Condensed) */}
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                                        
                                        {/* Project ID */}
                                        <span className="flex items-center">
                                            <FolderOpen className="h-3 w-3 mr-1 text-gray-400" />
                                            Order Id: {task.order_id}
                                        </span>
                                        
                                        {/* Task Assigned On Date */}
                                        <span className="flex items-center">
                                            <Clock className="h-3 w-3 mr-1 text-gray-400" />
                                            Assigned On: {new Date(task.assigned_on).toLocaleDateString()}
                                        </span>
                                        
                                        {/* Task Completion Due (Styled based on overdue status) */}
                                        {task.completion_time && (
                                            <span className={`flex items-center font-medium ${isOverdue ? 'text-red-700 font-bold' : 'text-gray-600'}`}>
                                                <Hourglass className={`h-3 w-3 mr-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`} />
                                                Due: {new Date(task.completion_time).toLocaleDateString()}
                                                {isOverdue && <Badge variant="destructive" className="ml-1 h-3 text-xs p-1">OVERDUE</Badge>}
                                            </span>
                                        )}

                                        {/* Actual Completion Date */}
                                        {task.status === 'completed' && task.completed_on && (
                                            <span className="flex items-center text-green-700 font-medium">
                                                <CheckIcon className="h-3 w-3 mr-1 text-green-500" />
                                                Printed: {new Date(task.completed_on).toLocaleDateString()}
                                            </span>
                                        )}

                                        {/* Project Target Completion Date */}
                                        <span className={`flex items-center ${targetClass}`}>
                                            <Calendar className={`h-3 w-3 mr-1 ${isTargetToday ? 'text-red-600' : 'text-gray-400'}`} />
                                            Target: {task.order_completion_date ? new Date(task.order_completion_date).toLocaleDateString() : "TBD"}
                                            {isTargetToday && <Badge variant="destructive" className="ml-1 h-3 text-xs p-1">DUE TODAY</Badge>}
                                        </span>
                                        
                                        {/* Assigned By */}
                                        <span className="flex items-center">
                                            <UserPlus className="h-3 w-3 mr-1 text-gray-400" />
                                            Assigned By: {task.assigned_by?.staff_name || "N/A"}
                                        </span>

                                        {/* Assigned To (Printer) */}
                                        <span className="flex items-center">
                                            <Printer className="h-3 w-3 mr-1 text-gray-400" />
                                            Assigned To: {task.assigned_to?.staff_name || "N/A"}
                                        </span>
                                        
                                        {/* Task Description Snippet */}
                                        <div className="mt-2 w-full pt-2 border-t text-xs text-gray-500">
                                            <span className="font-semibold text-gray-700 mr-2">Task Description:</span>
                                            <span className="italic">{task.task_description?.substring(0, 100) || "No specific task note provided."}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Editor & Actions (Right side, wraps below on mobile) */}
                                <div className="w-full sm:w-auto flex flex-col items-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0">
                                
                                    {/* Conditional Status Action Buttons */}
                                    {task.status === 'assigned' && (
                                        <Button 
                                            onClick={() => handleStatusChange(task.id, 'in_progress')}
                                            disabled={updatingTaskId === task.id}
                                            className="w-full sm:min-w-[180px] h-9 text-sm"
                                            variant="default" 
                                        >
                                            {updatingTaskId === task.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                                            Start Printing
                                        </Button>
                                    )}

                                    {task.status === 'in_progress' && (
                                        <Button 
                                            onClick={() => handleStatusChange(task.id, 'completed')}
                                            disabled={updatingTaskId === task.id}
                                            className="w-full sm:min-w-[180px] h-9 text-sm bg-blue-600 hover:bg-blue-700"
                                            variant="default"
                                        >
                                            {updatingTaskId === task.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                            Finish Printing
                                        </Button>
                                    )}

                                    {task.status === 'completed' && (
                                        <div className="w-full sm:min-w-[180px] p-2 bg-green-50 text-green-700 rounded-md border border-green-200 text-center text-sm font-medium">
                                            Task Finished / Closed
                                        </div>
                                    )}
                                    
                                    {/* Current Status Badge and View Order Button */}
                                    <div className="flex justify-between items-center w-full sm:w-auto gap-2">
                                        <Badge variant="secondary" className={`capitalize ${getTaskStatusColor(task.status)} text-xs`}>
                                            {task.status.replace(/_/g, ' ')}
                                        </Badge>
                                        
                                        {/* ACTION: View Order Details Button */}
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            className="h-8 text-xs"
                                            onClick={() => handleViewOrder(task.order_id)}
                                            disabled={isOrderDetailsLoading}
                                        >
                                            <Eye className="h-3 w-3 mr-1" />View Order
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
      </Tabs>
      
      {/* ==================================================================== */}
      {/* MOBILE FILTER DIALOG (Unchanged) */}
      {/* ==================================================================== */}
      <Dialog open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle className="flex items-center">
                      <Filter className="h-5 w-5 mr-2" /> Print Task Filters
                  </DialogTitle>
                  <DialogDescription>
                      Apply filters to narrow down your task list.
                  </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                  <FilterControls 
                      filterStatus={filterStatus}
                      setFilterStatus={setFilterStatus}
                      filterAssignedDateFrom={filterAssignedDateFrom}
                      setFilterAssignedDateFrom={setFilterAssignedDateFrom}
                      filterCompletionDateTo={filterCompletionDateTo}
                      setFilterCompletionDateTo={setFilterCompletionDateTo}
                      filterProjectTargetDateTo={filterProjectTargetDateTo} 
                      setFilterProjectTargetDateTo={setFilterProjectTargetDateTo} 
                      handleClearFilters={handleClearFilters}
                      isFilterActive={isFilterActive}
                      isMobile={true} 
                  />
              </div>

              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="default" className="w-full">
                          Apply & Close
                      </Button>
                  </DialogClose>
              </DialogFooter>
          </DialogContent>
      </Dialog>


      {/* ==================================================================== */}
      {/* ORDER DETAILS VIEW DIALOG (Unchanged) */}
      {/* ==================================================================== */}
      <Dialog open={!!viewingOrder || isOrderDetailsLoading} onOpenChange={(open) => { 
          if (!open) { 
              setViewingOrder(null);
              setIsOrderDetailsLoading(false);
          } 
      }}>
          <DialogContent className="sm:max-w-[425px] md:max-w-xl flex flex-col max-h-[90vh]">
              
              <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Order Details #{viewingOrder?.id || '...'}</DialogTitle>
                  <DialogDescription>
                      Comprehensive information about the parent customer order.
                  </DialogDescription>
              </DialogHeader>
              
              {isOrderDetailsLoading && !viewingOrder ? (
                  <div className="py-10 flex flex-col items-center flex-grow">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <p className="mt-2 text-sm text-gray-500">Loading order details...</p>
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
                                      <a href={`tel:${viewingOrder.mobile_number}`} className="col-span-2 flex items-center text-blue-600 hover:text-blue-800 transition duration-150">
                                          <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                          {viewingOrder.mobile_number}
                                      </a>
                                  ) : (<span className="col-span-2 text-gray-500">N/A</span>)}
                              </div>
                              <div className="grid grid-cols-3 items-center gap-4">
                                  <span className="font-medium text-gray-500">WhatsApp</span>
                                  {viewingOrder.whatsapp_number ? (
                                      <a href={`https://wa.me/91${viewingOrder.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="col-span-2 flex items-center text-green-600 hover:text-green-800 transition duration-150">
                                          <MessageSquare className="h-3 w-3 mr-2 text-gray-400" />
                                          {viewingOrder.whatsapp_number}
                                      </a>
                                  ) : (<span className="col-span-2 text-gray-500">N/A</span>)}
                              </div>
                          </div>
                          
                          {/* NOTE: Image Manager Dialog functionality from Designer Dashboard is intentionally omitted here as it depends on separate API imports not available in printing dashboard context. */}

                          {/* ORDER CORE DETAILS */}
                          <h4 className="font-bold text-gray-700 mt-2 border-t pt-3">Product & Order Details</h4>
                          
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
                          
                          <div className="grid grid-cols-3 items-center gap-4">
                              <span className="font-medium text-gray-500 flex items-center"><CreditCard className="h-4 w-4 mr-1" /> Payment Method</span>
                              <span className="col-span-2 capitalize">{viewingOrder.payment_method?.replace(/_/g, ' ') || 'N/A'}</span>
                          </div>

                          <div className="grid grid-cols-3 items-center gap-4">
                              <span className="font-medium text-gray-500">Account Name</span>
                              <span className="col-span-2">{viewingOrder.account_name || 'N/A'}</span>
                          </div>
                          
                          {/* DATE DETAILS */}
                          <h4 className="font-bold text-gray-700 mt-4 border-t pt-3">Timeline</h4>

                          <div className="grid grid-cols-3 items-center gap-4">
                              <span className="font-medium text-gray-500">Start Date</span>
                              <span className="col-span-2">{viewingOrder.start_on ? new Date(viewingOrder.start_on).toLocaleDateString() : 'N/A'}</span>
                          </div>

                          <div className="grid grid-cols-3 items-center gap-4">
                              <span className="font-medium text-gray-500">Completion Target</span>
                              <span className="col-span-2 font-semibold text-red-500">{viewingOrder.completion_date ? new Date(viewingOrder.completion_date).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          
                          {/* DELIVERY DETAILS */}
                          <h4 className="font-bold text-gray-700 mt-4 border-t pt-3 flex items-center"><Truck className="h-4 w-4 mr-2" /> Delivery</h4>

                          <div className="grid grid-cols-3 items-center gap-4">
                              <span className="font-medium text-gray-500">Delivery Type</span>
                              <span className="col-span-2 capitalize">{viewingOrder.delivery_type?.replace(/_/g, ' ') || 'N/A'}</span>
                          </div>

                          {viewingOrder.delivery_type?.toLowerCase() !== 'pickup' && viewingOrder.delivery_address && (
                              <div className="pt-2">
                                  <p className="font-medium text-gray-500 mb-2">Delivery Address</p>
                                  <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border">{viewingOrder.delivery_address}</p>
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
          </DialogContent>
      </Dialog>
      
      <Toaster />
    </DashboardLayout>
  )
}
