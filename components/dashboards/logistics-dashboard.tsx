"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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

// API client and types for logistics tasks (including image imports)
import {
  getAllTasks,
  editTask,
  getOrderById,
  type DetailedTask,
  type EditTaskPayload,
  type OrderDetails,
  type ApiResponse,
  // Assuming these are imported from "@/lib/logistics"
  type OrderImage, 
  getOrderImages 
} from "@/lib/logistics" 

import {
  Truck,
  Package,
  Clock,
  CheckCircle,
  Calendar,
  User,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckSquare,
  ClipboardList,
  TrendingUp,
  Filter,
  Eye,
  Settings,
  XCircle,
  Hourglass,
  FolderOpen,
  MessageSquare,
  IndianRupee,
  Phone,
  CreditCard,
  Check as CheckIcon,
  Image as ImageIcon, 
} from "lucide-react"

// =============================================================
// 1. IMAGE MANAGEMENT DIALOG (Unchanged)
// =============================================================

interface ProjectImageManagerProps {
    order: OrderDetails; 
    onClose: () => void;
}

const ProjectImageManagerDialog: React.FC<ProjectImageManagerProps> = ({ order, onClose }) => {
    // State uses the imported OrderImage type
    const [images, setImages] = useState<OrderImage[]>([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const orderId = order.id;

    const fetchImages = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            // Use the imported API function
            const fetchedImages = await getOrderImages(orderId); 
            setImages(fetchedImages);
        } catch (err) {
            setError(`Failed to load images: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    const handleDownload = (imageUrl: string, description: string | null, index: number) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        const filename = `${order.generated_order_id || `Order-${order.id}`}-${(description || `Image-${index + 1}`).replace(/\s/g, '_')}.jpg`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <ImageIcon className="w-5 h-5 mr-2" /> 
                        Images for Order #{order.id} {order.generated_order_id ? `(${order.generated_order_id})` : ''}
                    </DialogTitle>
                    <DialogDescription>
                        View and download images associated with this order.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>
                )}
                
                <div className="mt-2">
                    <h4 className="font-semibold mb-3">Order Images ({images.length})</h4>

                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading images...</p>
                        </div>
                    ) : images.length === 0 ? (
                        <p className="text-center text-gray-500 p-8 border rounded-lg">No images found for this order.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map((img, index) => (
                                <Card key={img.id} className="relative group overflow-hidden shadow-sm">
                                    <div className="aspect-square w-full bg-gray-200">
                                        <img 
                                            src={img.image_url} 
                                            alt={img.description || `Order Image ${img.id}`} 
                                            className="w-full h-full object-cover" 
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                                            <a href={img.image_url} target="_blank" rel="noopener noreferrer">
                                                <Button variant="secondary" size="icon" title="View Image">
                                                    <Eye className="h-5 w-5" />
                                                </Button>
                                            </a>
                                            <Button 
                                                variant="secondary" 
                                                size="icon" 
                                                title="Download Image"
                                                onClick={() => handleDownload(img.image_url, img.description || null, index)}
                                            >
                                                {/* Download Icon */}
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-3 text-sm">
                                        <p className="font-medium truncate">{img.description || `Image ${img.id}`}</p>
                                        <p className="text-xs text-gray-500 mt-1">Uploaded: {new Date(img.created_at).toLocaleDateString()}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// --- Helper Functions (Standardized) ---

const isDateToday = (dateString?: string | null): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
};

const getTaskStatusColor = (status?: string | null) => {
  switch (status) {
    case "delivered":
    case "completed":
      return "bg-green-100 text-green-800"
    case "in_transit":
    case "in_progress":
      return "bg-blue-100 text-blue-800"
    case "preparing":
    case "assigned":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

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

const getProjectStatusColor = (status?: string | null) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-orange-100 text-orange-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
}

// --- Reusable Filter Controls Component (Unchanged) ---
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
                    <SelectItem value="assigned">Assigned / Preparing</SelectItem>
                    <SelectItem value="in_progress">In Transit</SelectItem>
                    <SelectItem value="completed">Delivered / Completed</SelectItem>
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
            <label className="text-xs font-medium text-gray-600">Task Delivered Before</label>
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


export function LogisticsDashboard() {
  const { toast } = useToast()

  // --- STATE MANAGEMENT ---
  const [tasks, setTasks] = useState<DetailedTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null)
  
  const [viewingOrder, setViewingOrder] = useState<OrderDetails | null>(null)
  const [isOrderDetailsLoading, setIsOrderDetailsLoading] = useState(false)
  
  // NEW STATE for Image Management
  const [selectedOrderForImages, setSelectedOrderForImages] = useState<OrderDetails | null>(null);

  // --- STATE MANAGEMENT FOR FILTERS ---
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignedDateFrom, setFilterAssignedDateFrom] = useState<string>(''); 
  const [filterCompletionDateTo, setFilterCompletionDateTo] = useState<string>(''); 
  const [filterProjectTargetDateTo, setFilterProjectTargetDateTo] = useState<string>(''); 
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false); 


  // --- DATA FETCHING ---
  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setIsLoading(true)
    setError(null)
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
  
  // Handler for opening Image Manager
  const handleOpenImageModal = (order: OrderDetails) => {
    setSelectedOrderForImages(order);
  };


  // --- EVENT HANDLERS (Unchanged) ---
  const handleStatusChange = async (taskId: number, newStatus: string) => {
    setUpdatingTaskId(taskId)
    const payload: EditTaskPayload = { status: newStatus }
    if (newStatus === "completed") {
      // Use "completed" status for delivery confirmation
      payload.completion_time = new Date().toISOString()
    }
    const response = await editTask(taskId, payload)
    if (response.error) {
      toast({ variant: "destructive", title: "Update Failed", description: response.error })
    } else {
      toast({ title: "Status Updated", description: "The logistics task status has been saved." })
      loadTasks()
    }
    setUpdatingTaskId(null)
  }
  
  // --- FILTERING LOGIC (Unchanged) ---
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
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() >= filterDate.getTime();
        });
    }
    
    // 3. Task Completion Date 
    if (filterCompletionDateTo) {
        const filterDate = new Date(filterCompletionDateTo);
        filterDate.setHours(23, 59, 59, 999); 

        filtered = filtered.filter(task => {
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

  // --- CLEAR FILTERS HANDLER (Unchanged) ---
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


  // --- DYNAMIC METRICS CALCULATION (Unchanged) ---
  const taskCounts = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        if (task.status === "assigned" || task.status === "preparing") {
          acc.pending += 1
        } else if (task.status === "in_progress" || task.status === "in_transit") {
          acc.inTransit += 1
        } else if (task.status === "completed" || task.status === "delivered") {
          acc.delivered += 1
        }
        return acc
      },
      { pending: 0, inTransit: 0, delivered: 0 }
    )
  }, [tasks])

  const logisticsMetrics = [
    { name: "Tasks Awaiting Action", value: taskCounts.pending, change: "+2", icon: Clock },
    { name: "Currently In Transit", value: taskCounts.inTransit, change: "+6", icon: Truck },
    { name: "Total Completed Tasks", value: taskCounts.delivered, change: "+5%", icon: CheckCircle },
    { name: "Delivery Success Rate", value: "98%", change: "+1%", icon: Settings }, 
  ]


  return (
    <DashboardLayout title="Logistics Dashboard" role="logistics">

      <Tabs defaultValue="tasks" className="space-y-6"> 
        
        {/* --- TABS LIST --- */}
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* ==================================================================== */}
        {/* REPORTS SECTION (Unchanged) */}
        {/* ==================================================================== */}
        <TabsContent value="reports" className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Logistics Performance Overview</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {logisticsMetrics.map((metric) => {
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
                                    {metric.change} this month/week
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
        {/* LIVE TASK SECTION (REFACTORED)                                     */}
        {/* ==================================================================== */}
        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center">
                        <ClipboardList className="h-5 w-5 mr-2" />My Logistics Tasks
                        </CardTitle>
                        <CardDescription>
                        Update task status as packages move from preparation to delivery.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>

              {/* --- DESKTOP FILTER BAR (Unchanged) --- */}
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

              {/* --- MOBILE FILTER BUTTON (Unchanged) --- */}
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
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                        <p className="mt-2 text-sm text-gray-500">Loading logistics tasks...</p>
                    </div>
                </div>
              ) : error ? (
                <div className="text-center py-20 text-red-600">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p className="font-semibold">Failed to load tasks</p>
                    <p className="text-sm">{error}</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-20">
                    <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">You have no tasks assigned. Time to relax!</p>
                </div>
              ) : getFilteredTasks.length === 0 ? (
                <div className="text-center py-20">
                    <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tasks match the current filter criteria.</p>
                </div>
              ) : (
                // --- Task List ---
                <div className="space-y-4">
                  {getFilteredTasks.map((task) => {
                    
                    const isTargetToday = isDateToday(task.order_completion_date);
                    const targetClass = isTargetToday 
                        ? 'font-bold text-red-700 bg-red-100 p-1 rounded' 
                        : 'text-gray-600';

                    // --- NEW LOGIC: Check for Overdue Task ---
                    const isCompleted = task.status === 'completed' || task.status === 'delivered';
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
                                                Target Delivery: {new Date(task.completion_time).toLocaleDateString()}
                                                {isOverdue && <Badge variant="destructive" className="ml-1 h-3 text-xs p-1">OVERDUE</Badge>}
                                            </span>
                                        )}

                                        {/* Actual Completion Date */}
                                        {(task.status === 'completed' || task.status === 'delivered') && task.completed_on && (
                                            <span className="flex items-center text-green-700 font-medium">
                                                <CheckIcon className="h-3 w-3 mr-1 text-green-500" />
                                                Delivered: {new Date(task.completed_on).toLocaleDateString()}
                                            </span>
                                        )}

                                        {/* Project Target Completion Date */}
                                        <span className={`flex items-center ${targetClass}`}>
                                            <Calendar className={`h-3 w-3 mr-1 ${isTargetToday ? 'text-red-600' : 'text-gray-400'}`} />
                                            Order Deadline: {task.order_completion_date ? new Date(task.order_completion_date).toLocaleDateString() : "TBD"}
                                            {isTargetToday && <Badge variant="destructive" className="ml-1 h-3 text-xs p-1">DUE TODAY</Badge>}
                                        </span>
                                        
                                        {/* Assigned By (who created the task) */}
                                        <span className="flex items-center">
                                            <UserPlus className="h-3 w-3 mr-1 text-gray-400" />
                                            Assigned By: {task.assigned_by?.staff_name || "N/A"}
                                        </span>
                                        
                                        {/* Assigned To (the logistics staff/driver) */}
                                        <span className="flex items-center">
                                            <User className="h-3 w-3 mr-1 text-gray-400" />
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
                                    {(task.status === 'assigned' || task.status === 'preparing') && (
                                        <Button 
                                            onClick={() => handleStatusChange(task.id, 'in_progress')}
                                            disabled={updatingTaskId === task.id}
                                            className="w-full sm:min-w-[180px] h-9 text-sm"
                                            variant="default" 
                                        >
                                            {updatingTaskId === task.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
                                            Mark as In Transit
                                        </Button>
                                    )}

                                    {(task.status === 'in_progress' || task.status === 'in_transit') && (
                                        <Button 
                                            onClick={() => handleStatusChange(task.id, 'completed')}
                                            disabled={updatingTaskId === task.id}
                                            className="w-full sm:min-w-[180px] h-9 text-sm bg-green-600 hover:bg-green-700"
                                            variant="default"
                                        >
                                            {updatingTaskId === task.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                            Mark as Delivered
                                        </Button>
                                    )}

                                    {(task.status === 'completed' || task.status === 'delivered') && (
                                        <div className="w-full sm:min-w-[180px] p-2 bg-green-50 text-green-700 rounded-md border border-green-200 text-center text-sm font-medium">
                                            Delivery Completed
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
                      <Filter className="h-5 w-5 mr-2" /> Logistics Task Filters
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
                          
                          {/* *** IMAGE BUTTON INTEGRATION *** */}
                          <div className="flex justify-center pt-2">
                              <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="bg-purple-50 hover:bg-purple-100 text-purple-600 w-full"
                                  onClick={() => viewingOrder && handleOpenImageModal(viewingOrder)}
                              >
                                  <ImageIcon className="h-4 w-4 mr-2" />View Project Images ({viewingOrder.id})
                              </Button>
                          </div>
                          {/* *** END IMAGE BUTTON *** */}

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
      
      {/* RENDER THE IMAGE MANAGER DIALOG */}
      {selectedOrderForImages && (
          <ProjectImageManagerDialog 
              order={selectedOrderForImages} 
              onClose={() => setSelectedOrderForImages(null)} 
          />
      )}

      <Toaster />
    </DashboardLayout>
  )
}
