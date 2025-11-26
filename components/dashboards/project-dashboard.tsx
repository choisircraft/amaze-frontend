"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { DashboardLayout } from "../dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
// import { Progress } from "@/components/ui/progress" // Not used in this context
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Import the API client, types, and the form components
import { 
  getOrders, 
  getActiveStaffs, 
  getAllTasks,
  getOrder,
  updateOrder, 
  deleteOrder, // <--- ADDED THIS IMPORT
  getTasksByOrder, 
  type Order, 
  type Staff,
  type DetailedTask,
  type OrderById,
  type OrderImage, 
  getOrderImages 
} from "@/lib/project"
import { AssignTaskForm } from "@/components/assign-task-form"
import { EditTaskForm } from "@/components/edit-task-form"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"

import {
  FolderOpen,
  CheckSquare,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  User,
  UserPlus,
  BarChart,
  IndianRupee, 
  Package, 
  Trash2, 
  Phone,          
  MessageSquare,  
  CreditCard,     
  Truck,          
  Loader2,        
  Repeat2, 
  ChevronDown,
  Image as ImageIcon,
  Hourglass, // Added for Due Date/Overdue
  XCircle, 
} from "lucide-react"

type OrderWithGeneratedId = Order & { generated_order_id?: string | null };


// =============================================================
// 1. IMAGE MANAGER DIALOG (Keep as is)
// =============================================================

interface ProjectImageManagerProps {
    order: OrderWithGeneratedId;
    onClose: () => void;
}

const ProjectImageManagerDialog: React.FC<ProjectImageManagerProps> = ({ order, onClose }) => {
    // State now uses the imported OrderImage type
    const [images, setImages] = useState<OrderImage[]>([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const orderId = order.id;

    const fetchImages = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
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
        // Attempt to generate a clean filename
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
                        Images for Project PRJ-{order.id} {order.generated_order_id ? `(${order.generated_order_id})` : ''}
                    </DialogTitle>
                    <DialogDescription>
                        View and download images associated with this project.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>
                )}
                
                {/* Image Gallery Section */}
                <div className="mt-2">
                    <h4 className="font-semibold mb-3">Project Images ({images.length})</h4>

                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading images...</p>
                        </div>
                    ) : images.length === 0 ? (
                        <p className="text-center text-gray-500 p-8 border rounded-lg">No images found for this project.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map((img, index) => (
                                <Card key={img.id} className="relative group overflow-hidden shadow-sm">
                                    <div className="aspect-square w-full bg-gray-200">
                                        <img 
                                            src={img.image_url} 
                                            alt={img.description || `Project Image ${img.id}`} 
                                            className="w-full h-full object-cover" 
                                        />
                                        {/* VIEW/DOWNLOAD OVERLAY */}
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
                                                onClick={() => handleDownload(img.image_url, img.description, index)}
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


// --- Helper Functions and Constants ---

const isDateToday = (dateString?: string | null): boolean => {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;

    const today = new Date();
    
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return date.getTime() === today.getTime();
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

const getTaskStatusColor = (status?: string | null) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800'
    case 'in_progress': case 'assigned': return 'bg-blue-100 text-blue-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Available Project/Order statuses for filtering and updating
const ORDER_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled']; 
const TASK_STATUSES = ['pending', 'assigned', 'in_progress', 'completed']; // Defined task statuses

// NEW: Project Categories
const PROJECT_CATEGORIES = [
    { value: 'crystal_wall_art', label: 'Crystal Wall Art' },
    { value: 'amaze_ads', label: 'Amaze Ads' },
    { value: 'crystal_glass_art', label: 'Crystal Glass Art' },
    { value: 'sign_board_amaze', label: 'Sign Board Amaze' },
];

export function ProjectDashboard() {
  const { toast } = useToast()
    
  // --- State Management ---
  const [projects, setProjects] = useState<OrderWithGeneratedId[]>([]) 
  const [staff, setStaff] = useState<Staff[]>([])
  const [tasks, setTasks] = useState<DetailedTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // --- Filter States (Orders) ---
  const [orderSearchTerm, setOrderSearchTerm] = useState("")
  const [orderStaffFilterName, setOrderStaffFilterName] = useState("all")
  const [orderStatusFilter, setOrderStatusFilter] = useState("all")
  const [orderCategoryFilter, setOrderCategoryFilter] = useState("all") // NEW: Category Filter State
  const [orderFromDate, setOrderFromDate] = useState("")
  const [orderToDate, setOrderToDate] = useState("")
  const [isOrderFilterOpen, setIsOrderFilterOpen] = useState(false); 

  // --- Filter States (Tasks) ---
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [taskStaffFilterName, setTaskStaffFilterName] = useState("all");
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskFromDate, setTaskFromDate] = useState("");
  const [taskToDate, setTaskToDate] = useState("");
  const [isTaskFilterOpen, setIsTaskFilterOpen] = useState(false); 

  // --- Task/Assignment Modals ---
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Order | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<DetailedTask | null>(null)

  // --- View Detail States ---
  const [viewingOrder, setViewingOrder] = useState<OrderById | null>(null)
  const [isOrderDetailsLoading, setIsOrderDetailsLoading] = useState(false)
  const [viewingOrderTasks, setViewingOrderTasks] = useState<DetailedTask[]>([]); 
  const [isViewingOrderTasksLoading, setIsViewingOrderTasksLoading] = useState(false);
  
  // NEW STATE for Image Management
  const [selectedProjectForImages, setSelectedProjectForImages] = useState<OrderWithGeneratedId | null>(null);

  // --- Status Update States ---
  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false)
  const [selectedProjectForStatusUpdate, setSelectedProjectForStatusUpdate] = useState<OrderWithGeneratedId | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')
  const [isStatusUpdating, setIsStatusUpdating] = useState(false)
  const [generatedOrderIdInput, setGeneratedOrderIdInput] = useState<string>('') 


  // --- PROJECT LOOKUP MAP (NEW) ---
  const projectLookup = useMemo(() => {
    return projects.reduce((acc, project) => {
        if (project.id) { 
            acc[project.id] = project;
        }
        return acc;
    }, {} as Record<number, OrderWithGeneratedId>);
  }, [projects]);


  // --- Data Fetching Effect ---
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setIsLoading(true)
    setError(null)
    const [projectResponse, staffResponse, tasksResponse] = await Promise.all([
        getOrders(), 
        getActiveStaffs(),
        getAllTasks()
    ])

    let errors: string[] = [];

    if (projectResponse.error) errors.push(projectResponse.error);
    else if (projectResponse.data) setProjects(projectResponse.data as OrderWithGeneratedId[]); 

    if (staffResponse.error) errors.push(staffResponse.error);
    else if (staffResponse.data) setStaff(staffResponse.data.staffs); 

    if (tasksResponse.error) errors.push(tasksResponse.error);
    else if (tasksResponse.data) setTasks(tasksResponse.data);

    if (errors.length > 0) setError(errors.join(', '));
    setIsLoading(false)
  }
  
  const reloadData = async () => {
    const [projectResponse, tasksResponse] = await Promise.all([
        getOrders(), getAllTasks()
    ]);
    if(projectResponse.data) setProjects(projectResponse.data as OrderWithGeneratedId[]);
    if(tasksResponse.data) setTasks(tasksResponse.data);
  }

  // --- Modal Handlers ---
  const handleOpenAssignModal = (project: Order) => {
    setSelectedProject(project)
    setIsAssignModalOpen(true)
  }

  const handleAssignSuccess = () => {
    setIsAssignModalOpen(false)
    setSelectedProject(null)
    reloadData()
  }

  const handleOpenEditModal = (task: DetailedTask) => {
    setSelectedTaskForEdit(task)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    setIsEditModalOpen(false)
    setSelectedTaskForEdit(null)
    reloadData() // Reload tasks to see the update
    
    if (viewingOrder?.id) {
        handleViewProject({ id: viewingOrder.id } as Order);
    }
  }

  // Handler for opening Image Manager
  const handleOpenImageModal = (project: OrderWithGeneratedId) => {
      setSelectedProjectForImages(project);
  };


  // 3. UPDATED handleViewProject
  const handleViewProject = async (project: Order) => {
    setViewingOrder(null);
    setViewingOrderTasks([]); 
    setIsOrderDetailsLoading(true);
    setIsViewingOrderTasksLoading(true);
    
    const orderId = project.id;

    const [orderResponse, tasksResponse] = await Promise.all([
        getOrder(orderId), 
        getTasksByOrder(orderId) 
    ]); 

    if (orderResponse.data) {
        setViewingOrder(orderResponse.data as OrderById);
    } else {
        console.error("Failed to load detailed order view:", orderResponse.error);
        toast({
            title: "Error",
            description: "Failed to load detailed project information.",
            variant: "destructive",
        });
    }
    
    if (tasksResponse.data) {
        setViewingOrderTasks(tasksResponse.data);
    } else {
        console.error("Failed to load tasks for order:", tasksResponse.error);
    }

    setIsOrderDetailsLoading(false);
    setIsViewingOrderTasksLoading(false);
  }

  // --- UPDATED DELETE HANDLER ---
  const handleDeleteProject = async (id: number) => {
    const response = await deleteOrder(id);

    if (response.error) {
        toast({
            title: "Delete Failed",
            description: response.error,
            variant: "destructive",
        });
    } else {
        toast({
            title: "Project Deleted",
            description: `Project PRJ-${id} has been successfully deleted.`,
        });
        // Reload data to reflect deletion
        reloadData();
    }
  }
  
  // --- Status Update Handlers ---

  const handleOpenStatusUpdateModal = (project: OrderWithGeneratedId) => {
    setSelectedProjectForStatusUpdate(project);
    setNewStatus(project.status || 'pending');
    setGeneratedOrderIdInput(project.generated_order_id || ''); 
    setIsStatusUpdateModalOpen(true);
  }

  const handleStatusUpdate = async () => {
    if (!selectedProjectForStatusUpdate || !newStatus) return;

    const isStartingInProgress = 
        newStatus === 'in_progress' && 
        !selectedProjectForStatusUpdate.generated_order_id;
        
    if (isStartingInProgress && !generatedOrderIdInput.trim()) {
        toast({
            title: "Validation Required",
            description: "Please provide the Generated Order ID before starting the project ('in progress').",
            variant: "destructive",
        });
        return;
    }

    setIsStatusUpdating(true);
    
    const projectId = selectedProjectForStatusUpdate.id;
    let payload: { 
        status: string; 
        completed_on?: string | null; 
        generated_order_id?: string | null; 
    } = { status: newStatus };

    // Set/Clear Completion Date
    if (newStatus === 'completed') {
        payload.completed_on = new Date().toISOString();
    } else {
        payload.completed_on = null;
    }
    
    // Include generated_order_id in payload if it was just entered or if we are confirming 'in_progress'
    if (newStatus === 'in_progress' && generatedOrderIdInput.trim()) {
        payload.generated_order_id = generatedOrderIdInput.trim();
    }
    
    const response = await updateOrder(projectId, payload); 

    if (response.error) {
        toast({
            title: "Status Update Failed",
            description: response.error,
            variant: "destructive",
        });
    } else {
        toast({
            title: "Status Updated Successfully",
            description: `Project PRJ-${projectId} status is now: ${newStatus.toUpperCase()}`,
        });
        setIsStatusUpdateModalOpen(false);
        setSelectedProjectForStatusUpdate(null);
        setGeneratedOrderIdInput('');
        reloadData(); 
    }
    setIsStatusUpdating(false);
  }
  
  // --- Helper for Payment Status Badge ---
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


  // --- Filtering Logic (Projects) ---
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
        (project.description?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        project.product_name?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        project.customer_name?.toLowerCase().includes(orderSearchTerm.toLowerCase()) || 
        project.id?.toString().includes(orderSearchTerm) ||
        project.generated_order_id?.toLowerCase().includes(orderSearchTerm.toLowerCase()));

    const matchesStatus = 
        orderStatusFilter === 'all' || 
        project.status?.toLowerCase() === orderStatusFilter.toLowerCase();
        
    const matchesStaff = 
        orderStaffFilterName === 'all' || 
        project.created_by_staff_name === orderStaffFilterName; 
        
    // NEW: Category Filter Logic
    const matchesCategory = 
        orderCategoryFilter === 'all' ||
        project.category?.toLowerCase() === orderCategoryFilter.toLowerCase();


    // --- DATE FILTERING ---
    let matchesDate = true;
    
    const projectCompletionDate = project.completion_date 
        ? new Date(project.completion_date).getTime() 
        : null; 
    
    const hasDateFilters = orderFromDate || orderToDate;

    if (hasDateFilters) {
        if (projectCompletionDate === null) {
            matchesDate = false;
        } else {
            if (orderFromDate) {
                const fromDate = new Date(orderFromDate);
                fromDate.setHours(0, 0, 0, 0);
                matchesDate = matchesDate && projectCompletionDate >= fromDate.getTime();
            }
            if (orderToDate) {
                const toDate = new Date(orderToDate);
                toDate.setDate(toDate.getDate() + 1); 
                const toDateTime = toDate.getTime();
                matchesDate = matchesDate && projectCompletionDate < toDateTime;
            }
        }
    }

    return matchesSearch && matchesStatus && matchesStaff && matchesCategory && matchesDate;
  })
  
  // --- Filtering Logic (Tasks) ---
  const filteredTasks = tasks.filter(task => {
    // ... existing filtering logic ...
    
    const matchesSearch =
        (task.task_description?.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.assigned_to?.staff_name?.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        projectLookup[task.order_id]?.customer_name?.toLowerCase().includes(taskSearchTerm.toLowerCase()) || // Search by Customer Name
        task.order_id?.toString().includes(taskSearchTerm));

    const matchesStatus =
        taskStatusFilter === 'all' ||
        task.status?.toLowerCase() === taskStatusFilter.toLowerCase();

    const matchesStaff =
        taskStaffFilterName === 'all' ||
        task.assigned_to?.staff_name === taskStaffFilterName;

    let matchesDate = true;
    const taskCompletionTime = task.completion_time
        ? new Date(task.completion_time).getTime()
        : null;

    const hasDateFilters = taskFromDate || taskToDate;

    if (hasDateFilters) {
        if (taskCompletionTime === null) {
            matchesDate = false;
        } else {
            if (taskFromDate) {
                const fromDate = new Date(taskFromDate);
                fromDate.setHours(0, 0, 0, 0);
                matchesDate = matchesDate && taskCompletionTime >= fromDate.getTime();
            }
            if (taskToDate) {
                const toDate = new Date(taskToDate);
                toDate.setDate(toDate.getDate() + 1);
                const toDateTime = toDate.getTime();
                matchesDate = matchesDate && taskCompletionTime < toDateTime;
            }
        }
    }

    return matchesSearch && matchesStatus && matchesStaff && matchesDate;
  });
  
  // --- Dynamic Metrics ---
  const activeProjects = projects.filter(p => p.status === 'in_progress').length
  const completedProjects = projects.filter(p => p.status === 'completed').length
  const projectMetrics = [
    { name: "Active Projects", value: activeProjects.toString(), change: "+2", icon: FolderOpen },
    { name: "Completed This Month", value: completedProjects.toString(), change: "+5", icon: CheckSquare },
    { name: "Total Projects", value: projects.length.toString(), change: "+10", icon: TrendingUp },
    { name: "Team Utilization", value: "87%", change: "+5%", icon: Users },
  ]


  // --- Filter Components ---

  const renderOrderFilters = (isMobile: boolean) => (
    <>
        <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
                placeholder="Search by name, ID, or product..." 
                className="pl-10" 
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
            />
        </div>

        {/* STAFF FILTER */}
        <Select value={orderStaffFilterName} onValueChange={setOrderStaffFilterName} disabled={isLoading}>
            <SelectTrigger className="w-full md:w-[150px] flex-shrink-0">
                <SelectValue placeholder="Staff" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staff.map(s => (<SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>))}
            </SelectContent>
        </Select>

        {/* STATUS FILTER */}
        <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
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
        
        {/* NEW: CATEGORY FILTER */}
        <Select value={orderCategoryFilter} onValueChange={setOrderCategoryFilter}>
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

        {/* DATE INPUTS */}
        <Input
            type="date"
            placeholder="Completion From Date"
            value={orderFromDate}
            onChange={(e) => setOrderFromDate(e.target.value)}
            className="w-full md:w-[150px] flex-shrink-0"
        />
        <Input
            type="date"
            placeholder="Completion To Date"
            value={orderToDate}
            onChange={(e) => setOrderToDate(e.target.value)}
            className="w-full md:w-[150px] flex-shrink-0"
        />
    </>
  );

  const renderTaskFilters = (isMobile: boolean) => (
    <>
        {/* Task filters remain unchanged */}
        <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
                placeholder="Search tasks, staff, or order ID..." 
                className="pl-10" 
                value={taskSearchTerm}
                onChange={(e) => setTaskSearchTerm(e.target.value)}
            />
        </div>

        {/* STAFF FILTER */}
        <Select value={taskStaffFilterName} onValueChange={setTaskStaffFilterName} disabled={isLoading}>
            <SelectTrigger className="w-full md:w-[150px] flex-shrink-0">
                <SelectValue placeholder="Assigned Staff" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staff.map(s => (<SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>))}
            </SelectContent>
        </Select>

        {/* STATUS FILTER */}
        <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
            <SelectTrigger className="w-full md:w-[150px] flex-shrink-0">
                <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {TASK_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>

        {/* DATE INPUTS */}
        <Input
            type="date"
            placeholder="Due From Date"
            value={taskFromDate}
            onChange={(e) => setTaskFromDate(e.target.value)}
            className="w-full md:w-[150px] flex-shrink-0"
        />
        <Input
            type="date"
            placeholder="Due To Date"
            value={taskToDate}
            onChange={(e) => setTaskToDate(e.target.value)}
            className="w-full md:w-[150px] flex-shrink-0"
        />
    </>
  );

  return (
    <DashboardLayout title="Project Dashboard" role="project">
      <main className="flex-1 space-y-6 p-4 md:p-6 overflow-y-auto">

        <Tabs defaultValue="projects" className="space-y-6">
          
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto p-1 bg-gray-200 rounded-lg gap-1">
            {[
                { value: 'projects', label: 'Projects' },
                { value: 'tasks', label: 'Tasks' },
                { value: 'timeline', label: 'Timeline' },
                { value: 'resources', label: 'Resources' },
                { value: 'reports', label: 'Reports' }, 
            ].map(tab => (
                <TabsTrigger 
                    key={tab.value}
                    value={tab.value} 
                    className="py-1 px-3 transition-all duration-200 
                            data-[state=active]:bg-black 
                            data-[state=active]:text-white
                            data-[state=active]:shadow-md
                            bg-white text-gray-700 rounded-md
                            hover:bg-gray-100 text-sm"
                >
                    {tab.label}
                </TabsTrigger>
            ))}
          </TabsList>
          
          {/* PROJECTS TAB (Order List) */}
          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center">
                      <FolderOpen className="h-5 w-5 mr-2" />
                      Project Management
                    </CardTitle>
                    <CardDescription>Track and manage all active projects</CardDescription>
                  </div>
                 
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                   <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                     <p className="text-sm text-red-600">Error: {error}</p>
                   </div>
                )}
                
                {/* --- ORDER SEARCH AND FILTER SECTION (Desktop) --- */}
                <div className="hidden md:flex items-center space-x-2 mb-6 gap-2 flex-wrap">
                    {renderOrderFilters(false)}
                </div>

                {/* --- ORDER SEARCH AND FILTER SECTION (Mobile) --- */}
                <Collapsible 
                    open={isOrderFilterOpen} 
                    onOpenChange={setIsOrderFilterOpen}
                    className="md:hidden mb-4 border rounded-lg bg-gray-50"
                >
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start text-sm text-gray-700 p-3 h-auto">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters ({[orderStatusFilter, orderStaffFilterName, orderCategoryFilter, orderFromDate, orderToDate].filter(f => f !== 'all' && f !== '').length})
                            <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isOrderFilterOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 p-3 pt-0">
                        <div className="flex flex-col gap-3">
                            {renderOrderFilters(true)}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
                {/* END OF FILTERS */}

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading projects...</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                    {filteredProjects.length === 0 ? (
                        <div className="text-center py-8">
                            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {orderSearchTerm || orderStatusFilter !== 'all' || orderStaffFilterName !== 'all' || orderCategoryFilter !== 'all' || orderFromDate || orderToDate ? 'No projects found matching criteria.' : 'No projects found.'}
                            </p>
                        </div>
                    ) : (
                        filteredProjects.map((project) => {
                            
                            const totalAmountDisplay = (project.total_amount || project.amount)?.toLocaleString() || 'N/A';
                            const completionDateDisplay = project.completion_date 
                                ? new Date(project.completion_date).toLocaleDateString()
                                : 'N/A';
                            
                            const isInProgress = project.status?.toLowerCase() === 'in_progress';

                            const generatedIdDisplay = project.generated_order_id 
                                ? <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-semibold text-xs">{project.generated_order_id}</Badge>
                                : null;


                            return (
                                <div key={project.id} className="border rounded-lg p-4 transition-shadow hover:shadow-md bg-white">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        
                                        {/* LEFT SIDE: Project ID, Customer, and Staff Info */}
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center">
                                                <FolderOpen className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl text-blue-700">
                                                    {project.customer_name || `Customer N/A`}
                                                </h3> 
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <p className="text-gray-600 text-sm font-medium">Order ID: PRJ-{project.id}</p>
                                                    {generatedIdDisplay}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 space-y-1">
                                                    <p>Created by {project.created_by_staff_name || 'Staff'} on {new Date(project.created_on).toLocaleDateString()}</p>
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
                                                <span className="font-bold text-blue-700">{totalAmountDisplay}</span>
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
                                                    {project.status || 'pending'}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                                                
                                                <Button variant="secondary" size="sm" onClick={() => handleViewProject(project)}>
                                                    <Eye className="h-3 w-3 mr-1" />View Details
                                                </Button>
                                                
                                                {/* IMAGE BUTTON */}
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="bg-purple-50 hover:bg-purple-100 text-purple-600"
                                                    onClick={() => handleOpenImageModal(project)}
                                                >
                                                    <ImageIcon className="h-3 w-3 mr-1" />Images
                                                </Button>

                                                {/* Status Update Button */}
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleOpenStatusUpdateModal(project)}
                                                >
                                                    <Repeat2 className="h-3 w-3 mr-1" />
                                                    Status
                                                </Button>
                                                
                                                {/* Restriction: Only allow task assignment if status is 'in_progress' */}
                                                {isInProgress && (
                                                    <Button 
                                                        variant="default" 
                                                        size="sm"
                                                        onClick={() => handleOpenAssignModal(project)}
                                                    >
                                                        <UserPlus className="h-3 w-3 mr-1" />
                                                        Assign Task
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
                        })
                    )}
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================================================================== */}
          {/* REFACTORED TASKS TAB (To match the detailed design)                  */}
          {/* ==================================================================== */}
          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center"><CheckSquare className="h-5 w-5 mr-2" />Task Management</CardTitle>
                    <CardDescription>Track individual tasks and assignments across all projects.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* --- TASK SEARCH AND FILTER SECTION (Desktop) --- */}
                <div className="hidden md:flex items-center space-x-2 mb-6 gap-2 flex-wrap">
                    {renderTaskFilters(false)}
                </div>

                {/* --- TASK SEARCH AND FILTER SECTION (Mobile) --- */}
                <Collapsible 
                    open={isTaskFilterOpen} 
                    onOpenChange={setIsTaskFilterOpen}
                    className="md:hidden mb-4 border rounded-lg bg-gray-50"
                >
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start text-sm text-gray-700 p-3 h-auto">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters ({[taskStatusFilter, taskStaffFilterName, taskFromDate, taskToDate].filter(f => f !== 'all' && f !== '').length})
                            <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isTaskFilterOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 p-3 pt-0">
                        <div className="flex flex-col gap-3">
                            {renderTaskFilters(true)}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
                {/* END OF FILTERS */}

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading tasks...</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                    {filteredTasks.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {taskSearchTerm || taskStatusFilter !== 'all' || taskStaffFilterName !== 'all' || taskFromDate || taskToDate ? 'No tasks found matching criteria.' : 'No tasks assigned yet.'}
                            </p>
                        </div>
                    ) : (
                        filteredTasks.map((task) => {
                            const associatedProject = projectLookup[task.order_id];
                            const customerName = associatedProject?.customer_name || `Order PRJ-${task.order_id}`;
                            const productName = associatedProject?.product_name || "Product Name N/A";
                            const generatedOrderId = associatedProject?.generated_order_id;
                            const projectCompletionDate = associatedProject?.completion_date;

                            // --- Task Overdue Check ---
                            const isCompleted = task.status === 'completed';
                            let isOverdue = false;
                            
                            if (!isCompleted && task.completion_time) {
                                const dueDate = new Date(task.completion_time);
                                dueDate.setHours(23, 59, 59, 999); 
                                const now = new Date();
                                
                                if (now.getTime() > dueDate.getTime()) {
                                    isOverdue = true;
                                }
                            }

                            // --- Project Target Styling ---
                            const isTargetToday = isDateToday(projectCompletionDate);
                            const targetClass = isTargetToday 
                                ? 'font-bold text-red-700 bg-red-100 p-1 rounded' 
                                : 'text-gray-600';

                            // Conditional styling for the task card
                            const cardClass = isOverdue 
                                ? "border-4 border-red-500 rounded-lg p-3 sm:p-4 bg-red-50" 
                                : "border rounded-lg p-3 sm:p-4 bg-white";
                                
                            return (
                                <div key={task.id} className={cardClass}>
                                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                                        
                                        {/* Task Details (Left side, takes up space) */}
                                        <div className="flex-1 min-w-0">
                                            
                                            {/* 1. Customer Name as Main Title */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 border-b pb-2">
                                                <h2 className="font-bold text-lg text-blue-700 truncate max-w-full">
                                                    Customer: {customerName} 
                                                </h2>
                                                
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
                                                        {productName}
                                                    </p>
                                                    <p className="text-xs text-blue-600">
                                                        Order ID: {generatedOrderId || `PRJ-${task.order_id}`}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* 3. Metadata block (Condensed) */}
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                                                
                                                {/* Assigned To */}
                                                <span className="flex items-center">
                                                    <User className="h-3 w-3 mr-1 text-gray-400" />
                                                    Assigned To: <span className="font-medium text-gray-800 ml-1">{task.assigned_to?.staff_name || "Unassigned"}</span>
                                                    {task.assigned_to?.role && <span className="text-gray-500 ml-1">({task.assigned_to.role})</span>}
                                                </span>

                                                {/* Task Completion Due (MODIFIED for Overdue styling) */}
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
                                                        <CheckSquare className="h-3 w-3 mr-1 text-green-500" />
                                                        Done: {new Date(task.completed_on).toLocaleDateString()}
                                                    </span>
                                                )}

                                                {/* Project Target Completion Date */}
                                                {projectCompletionDate && (
                                                    <span className={`flex items-center ${targetClass}`}>
                                                        <Calendar className={`h-3 w-3 mr-1 ${isTargetToday ? 'text-red-600' : 'text-gray-400'}`} />
                                                        Project Due: {new Date(projectCompletionDate).toLocaleDateString()}
                                                        {isTargetToday && <Badge variant="destructive" className="ml-1 h-3 text-xs p-1">PRJ DUE TODAY</Badge>}
                                                    </span>
                                                )}
                                                
                                                {/* Task Description Snippet */}
                                                <div className="mt-2 w-full pt-2 border-t text-xs text-gray-500">
                                                    <span className="font-semibold text-gray-700 mr-2">Task Description:</span>
                                                    <span className="italic">{task.task_description?.substring(0, 100) || "No specific task note provided."}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Actions (Right side) */}
                                        <div className="w-full sm:w-auto flex flex-col items-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0">
                                            
                                            {/* Status Badge */}
                                            <Badge variant="secondary" className={`capitalize ${getTaskStatusColor(task.status)} text-xs`}>
                                                {task.status}
                                            </Badge>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex justify-start sm:justify-end space-x-2 mt-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => handleOpenEditModal(task)}
                                                >
                                                <Edit className="h-3 w-3 mr-1" />Edit
                                                </Button>
                                                
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm"
                                                    onClick={() => handleViewProject({ id: task.order_id } as Order)}
                                                >
                                                <Eye className="h-3 w-3 mr-1" />View Order
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* TIMELINE, RESOURCES, REPORTS tabs (Unchanged) */}
          <TabsContent value="timeline" className="space-y-6">
             <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Calendar className="h-5 w-5 mr-2" />Project Timeline & Milestones</CardTitle>
                <CardDescription>Track important project milestones and deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { project: "PRJ-001", milestone: "Design Review", date: "2024-01-20", status: "upcoming" },
                    { project: "PRJ-002", milestone: "Concept Presentation", date: "2024-01-24", status: "upcoming" },
                  ].map((milestone, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">{milestone.status === "completed" ? <CheckCircle className="h-6 w-6 text-green-600" /> : <Clock className="h-6 w-6 text-blue-600" />}</div>
                      <div className="flex-1"><h3 className="font-semibold">{milestone.milestone}</h3><p className="text-sm text-gray-600">Project: {milestone.project}</p><p className="text-sm text-gray-500">Date: {milestone.date}</p></div>
                      <Badge variant={milestone.status === "completed" ? "default" : "secondary"} className={`capitalize ${milestone.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>{milestone.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Users className="h-5 w-5 mr-2" />Team Allocation</CardTitle>
                  <CardDescription>Current team member assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div><p className="font-medium">Lead Designer</p><p className="text-sm text-gray-500">3 active projects</p></div>
                      <Badge className="bg-yellow-100 text-yellow-800">Busy</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div><p className="font-medium">Project Manager</p><p className="text-sm text-gray-500">2 active projects</p></div>
                      <Badge className="bg-green-100 text-green-800">Available</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><AlertTriangle className="h-5 w-5 mr-2" />Project Alerts</CardTitle>
                  <CardDescription>Issues requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div><p className="font-medium text-red-800">Budget Overrun Alert</p><p className="text-sm text-red-600">PRJ-001 is 5% over budget</p></div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <div><p className="font-medium text-yellow-800">Deadline Approaching</p><p className="text-sm text-yellow-600">TSK-003 due in 2 days</p></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><BarChart className="h-5 w-5 mr-2" />Project Reports & Metrics</CardTitle>
                <CardDescription>Key performance indicators and detailed summaries.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {projectMetrics.map((metric) => {
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
                                        <TrendingUp className="h-3 w-3 mr-1" /> {metric.change} this month
                                    </p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
                
                <h3 className="text-lg font-semibold border-t pt-4">Resource Breakdown</h3>
                <p className="text-sm text-gray-600">Detailed reports on resource allocation would go here.</p>

              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>

      {/* MODALS & TOASTER */}
      <AssignTaskForm 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={handleAssignSuccess}
        project={selectedProject}
        staffList={staff}
      />
      
      <EditTaskForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        task={selectedTaskForEdit}
        // Note: Staff list may be required here if the form allows reassignment
        staffList={staff} 
      />

      {/* STATUS UPDATE DIALOG */}
      <Dialog open={isStatusUpdateModalOpen} onOpenChange={setIsStatusUpdateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Status for Project PRJ-{selectedProjectForStatusUpdate?.id}</DialogTitle>
            <DialogDescription>
              Change the current status of the project. If setting to 'Completed', the completion date will be recorded.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="status" className="text-sm font-medium">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus} disabled={isStatusUpdating}>
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CONDITIONAL GENERATED ORDER ID INPUT */}
            {(
              newStatus === 'in_progress' && 
              !selectedProjectForStatusUpdate?.generated_order_id
            ) && (
                 <div className="flex flex-col space-y-2 mt-4 p-3 bg-red-50 rounded-md border border-red-200">
                    <label htmlFor="generated-id" className="text-sm font-medium text-red-700">
                        <AlertTriangle className="h-4 w-4 inline mr-1" /> Generated Order ID (Required to start project)
                    </label>
                    <Input
                        id="generated-id"
                        value={generatedOrderIdInput}
                        onChange={(e) => setGeneratedOrderIdInput(e.target.value)}
                        placeholder="Enter external system order ID (e.g., SO-1234)"
                        disabled={isStatusUpdating}
                    />
                 </div>
            )}
            
            {/* Show existing ID if status is 'in_progress' and it exists */}
            {(newStatus === 'in_progress' && selectedProjectForStatusUpdate?.generated_order_id) && (
                <div className="text-sm text-gray-600 mt-4">
                    Current Generated ID: <span className="font-semibold text-blue-700">{selectedProjectForStatusUpdate.generated_order_id}</span>
                </div>
            )}

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusUpdateModalOpen(false)} disabled={isStatusUpdating}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={isStatusUpdating}>
              {isStatusUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* ORDER DETAILS VIEW DIALOG */}
      <Dialog open={!!viewingOrder} onOpenChange={(open) => { 
          if (!open) { 
              setViewingOrder(null);
              setIsOrderDetailsLoading(false);
              setViewingOrderTasks([]); // Clear tasks on close
          } 
      }}>
          <DialogContent className="sm:max-w-[425px] md:max-w-xl flex flex-col max-h-[90vh]">
              
              <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Order Details #{viewingOrder?.id}</DialogTitle>
                  <DialogDescription>
                      Comprehensive information about this customer order.
                  </DialogDescription>
              </DialogHeader>
              
              {isOrderDetailsLoading ? (
                  <div className="py-10 flex flex-col items-center flex-grow">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <p className="mt-2 text-sm text-gray-500">Loading order details...</p>
                  </div>
              ) : viewingOrder && (
                  <div className="overflow-y-auto flex-grow pr-2">
                      <div className="grid gap-4 py-4 text-sm">
                          
                          {/* CUSTOMER INFO SECTION (omitted for brevity) */}
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
                          
                          {/* FINANCIAL DETAILS (omitted for brevity) */}
                          <h4 className="font-bold text-gray-700 mt-4 border-t pt-3 flex items-center"><IndianRupee className="h-4 w-4 mr-2" /> Financials</h4>
                          
                          <div className="grid grid-cols-3 items-center gap-4">
                              <span className="font-medium text-gray-500">Total Billed Amount</span>
                              <span className="col-span-2 flex items-center text-blue-700 font-bold">
                                  ₹ {(viewingOrder.total_amount || viewingOrder.amount)?.toLocaleString('en-IN') || '0.00'} 
                              </span>
                          </div>
                          
                          <div className="grid grid-cols-3 items-center gap-4">
                              <span className="font-medium text-gray-500">Additional Charges</span>
                              <span className="col-span-2 flex items-center text-gray-700 font-medium">
                                  ₹ {viewingOrder.additional_amount ? viewingOrder.additional_amount.toLocaleString('en-IN') : '0.00'} 
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
                          
                          {/* DATE DETAILS (omitted for brevity) */}
                          <h4 className="font-bold text-gray-700 mt-4 border-t pt-3">Timeline</h4>

                          <div className="grid grid-cols-3 items-center gap-4">
                              <span className="font-medium text-gray-500">Project Commitment</span>
                              <span className="col-span-2">{viewingOrder.project_committed_on || 'N/A'}</span>
                          </div>

                          <div className="grid grid-cols-3 items-center gap-4">
                              <span className="font-medium text-gray-500">Start Date</span>
                              <span className="col-span-2">{viewingOrder.start_on ? new Date(viewingOrder.start_on).toLocaleDateString() : 'N/A'}</span>
                          </div>

                          <div className="grid grid-cols-3 items-center gap-4">
                              <span className="font-medium text-gray-500">Completion Target</span>
                              <span className="col-span-2">{viewingOrder.completion_date ? new Date(viewingOrder.completion_date).toLocaleDateString() : 'N/A'}</span>
                          </div>

                          <div className="grid grid-cols-3 items-center gap-4">
                              <span className="font-medium text-gray-500">Completed On</span>
                              <span className="col-span-2">{viewingOrder.completed_on ? new Date(viewingOrder.completed_on).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          
                          {/* DELIVERY DETAILS (omitted for brevity) */}
                          <h4 className="font-bold text-gray-700 mt-4 border-t pt-3 flex items-center"><Truck className="h-4 w-4 mr-2" /> Delivery</h4>

                          <div className="grid grid-cols-3 items-center gap-4">
                              <span className="font-medium text-gray-500">Delivery Type</span>
                              <span className="col-span-2 capitalize">{viewingOrder.delivery_type?.replace(/_/g, ' ') || 'N/A'}</span>
                          </div>

                          {/* Conditionally show delivery address if it's NOT pickup AND an address exists */}
                          {viewingOrder.delivery_type?.toLowerCase() !== 'pickup' && viewingOrder.delivery_address && (
                              <div className="pt-2">
                                  <p className="font-medium text-gray-500 mb-2">Delivery Address</p>
                                  <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border">{viewingOrder.delivery_address}</p>
                              </div>
                          )}
                          
                          {/* Optional warning if Home Delivery is selected but address is missing */}
                          {viewingOrder.delivery_type?.toLowerCase() === 'home_delivery' && !viewingOrder.delivery_address && (
                              <div className="pt-2 text-red-500 italic">
                                  Delivery selected, but no address recorded.
                              </div>
                          )}

                          
                          {/* 4. NEW SECTION: Tasks for this Order (omitted for brevity) */}
                          <h4 className="font-bold text-gray-700 mt-4 border-t pt-3 flex items-center"><CheckSquare className="h-4 w-4 mr-2" /> Assigned Tasks ({viewingOrderTasks.length})</h4>

                          {isViewingOrderTasksLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span className="text-sm text-gray-500">Loading tasks...</span>
                            </div>
                          ) : viewingOrderTasks.length === 0 ? (
                            <p className="text-gray-500 italic">No tasks currently assigned to this order.</p>
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
                                            <p className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> Due: {task.completion_time ? new Date(task.completion_time).toLocaleDateString() : "TBD"}</p>
                                        </div>
                                        <div className="mt-2 text-right">
                                             <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-7 px-2 text-xs"
                                                onClick={() => handleOpenEditModal(task)}
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
          </DialogContent>
      </Dialog>

      {/* RENDER THE NEW IMAGE MANAGER DIALOG */}
      {selectedProjectForImages && (
          <ProjectImageManagerDialog 
              order={selectedProjectForImages} 
              onClose={() => setSelectedProjectForImages(null)} 
          />
      )}

      <Toaster />
    </DashboardLayout>
  )
}
