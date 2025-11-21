// app/dashboard/crm/page.tsx (CRMDashboard)

"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "../dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Import the new components
import { CRMModals } from "@/components/dashboards/modals/crm-modals"
import { LeadsTab } from "@/components/dashboards/crm-tabs/LeadsTab"
import { OrdersTab } from "@/components/dashboards/crm-tabs/OrdersTab"
import { CustomersTab } from "@/components/dashboards/crm-tabs/CustomersTab"

import { type CustomerFormData } from "@/components/customer-form" 

import { ApiClient, type Customer, type Order } from "@/lib/api"
import {
  Users,
  Calendar,
  TrendingUp,
  Target,
  ShoppingCart,
} from "lucide-react"

import {
  getRealCustomers,
  updateRealCustomer,
  type RealCustomer,
  getStaffByRoles,
  type StaffUser
} from "@/lib/crm"

// --- DEFINING THE ENHANCED ORDER TYPE ---
export interface OrderById {
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

  // Added customer details
  customer_name?: string
  mobile_number?: string
  whatsapp_number?: string
  address?: string
}

// --- Helper Data and Functions ---

const LEAD_STATUSES = ['cold', 'warm', 'hot', 'converted', 'lost']
const ORDER_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']

const isDateWithinCustomRange = (
    dateString: string | Date | undefined,
    fromDateStr: string | null, // YYYY-MM-DD
    toDateStr: string | null    // YYYY-MM-DD
): boolean => {
    if (!dateString) return false;

    const recordDate = new Date(dateString);
    let fromDate: Date | null = null;
    let toDate: Date | null = null;

    if (fromDateStr) {
        fromDate = new Date(fromDateStr);
        fromDate.setHours(0, 0, 0, 0);
    }
    
    if (toDateStr) {
        toDate = new Date(toDateStr);
        toDate.setHours(23, 59, 59, 999); 
    }

    let isAfterFrom = fromDate ? recordDate >= fromDate : true;
    let isBeforeTo = toDate ? recordDate <= toDate : true;

    return isAfterFrom && isBeforeTo;
};


// Helper function to get status color for leads
const getStatusColor = (status: string) => {
  switch (status) {
    case 'cold': return 'bg-blue-100 text-blue-800'
    case 'warm': return 'bg-orange-100 text-orange-800'
    case 'hot': return 'bg-red-100 text-red-800'
    case 'converted': return 'bg-green-100 text-green-800'
    case 'lost': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Helper function to get status color for orders
const getOrderStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'confirmed': return 'bg-blue-100 text-blue-800'
    case 'in_progress': return 'bg-orange-100 text-orange-800'
    case 'completed': return 'bg-green-100 text-green-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function CRMDashboard() {
  // =================================================================
  // === 1. CORE STATE ===============================================
  // =================================================================
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [realCustomers, setRealCustomers] = useState<RealCustomer[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isOrdersLoading, setIsOrdersLoading] = useState(true)
  const [isRealCustomersLoading, setIsRealCustomersLoading] = useState(true)
  const [error, setError] = useState('')

  // Search States
  const [searchTerm, setSearchTerm] = useState('')
  const [orderSearchTerm, setOrderSearchTerm] = useState('')
  const [realCustomerSearchTerm, setRealCustomerSearchTerm] = useState('')

  // Staff & Filters
  const [staffs, setStaffs] = useState<StaffUser[]>([])
  const [isStaffLoading, setIsStaffLoading] = useState(false)
  const [leadStaffFilterName, setLeadStaffFilterName] = useState<string>('all')
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all')
  const [leadFromDate, setLeadFromDate] = useState<string>('') 
  const [leadToDate, setLeadToDate] = useState<string>('')     
  const [orderStaffFilterName, setOrderStaffFilterName] = useState<string>('all')
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all')
  const [orderFromDate, setOrderFromDate] = useState<string>('')
  const [orderToDate, setOrderToDate] = useState<string>('')
  const [customerStaffFilterName, setCustomerStaffFilterName] = useState<string>('all')
  const [customerFromDate, setCustomerFromDate] = useState<string>('')
  const [customerToDate, setCustomerToDate] = useState<string>('')

  // Form & Modal States
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false)
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false)
  const [convertingCustomer, setConvertingCustomer] = useState<Customer | null>(null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingItem, setEditingItem] = useState<Customer | RealCustomer | null>(null)
  const [editingEntityType, setEditingEntityType] = useState<'lead' | 'customer' | null>(null)
  const [orderingForCustomer, setOrderingForCustomer] = useState<RealCustomer | null>(null)
  
  // Detail Viewing States
  const [viewingOrder, setViewingOrder] = useState<OrderById | null>(null)
  const [isOrderDetailsLoading, setIsOrderDetailsLoading] = useState(false) 
  const [viewingLead, setViewingLead] = useState<Customer | null>(null)
  const [viewingRealCustomer, setViewingRealCustomer] = useState<RealCustomer | null>(null)


  // =================================================================
  // === 2. DATA LOADING =============================================
  // =================================================================
  useEffect(() => {
    loadAllData()
    loadStaffs()
  }, [])

  const loadAllData = () => {
    loadCustomers()
    loadOrders()
    loadRealCustomers()
  }

  const loadStaffs = async () => {
    try {
      setIsStaffLoading(true)
      const staffData = await getStaffByRoles()
      setStaffs(staffData)
    } catch (err) {
      setError('Failed to load staff list for filtering.')
      console.error('Error loading staffs:', err);
    } finally {
      setIsStaffLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      setIsLoading(true)
      setError('')
      const customerData = await ApiClient.getCustomers()
      setCustomers(customerData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers')
    } finally {
      setIsLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      setIsOrdersLoading(true)
      const orderData = await ApiClient.getOrders()
      setOrders(orderData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setIsOrdersLoading(false)
    }
  }

  const loadRealCustomers = async () => {
    try {
      setIsRealCustomersLoading(true)
      const data = await getRealCustomers()
      setRealCustomers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load real customers')
    } finally {
      setIsRealCustomersLoading(false)
    }
  }

  // =================================================================
  // === 3. HANDLERS =================================================
  // =================================================================
  const handleViewLead = (lead: Customer) => { setViewingLead(lead) }
  const handleAddCustomer = () => { setEditingItem(null); setEditingEntityType('lead'); setFormMode('create'); setIsCustomerFormOpen(true); }
  const handleEditCustomer = (customer: Customer) => { setEditingItem(customer); setEditingEntityType('lead'); setFormMode('edit'); setIsCustomerFormOpen(true); }
  const handleDeleteCustomer = async (id: number) => { try { await ApiClient.deleteCustomer(id); await loadAllData(); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete customer'); } }
  const handleConvertToOrder = (customer: Customer) => { setConvertingCustomer(customer); setIsOrderFormOpen(true); }
  const handleViewRealCustomer = (customer: RealCustomer) => { setViewingRealCustomer(customer) }
  const handleEditRealCustomer = (customer: RealCustomer) => { setEditingItem(customer); setEditingEntityType('customer'); setFormMode('edit'); setIsCustomerFormOpen(true); }
  const handleMakeNewOrder = (customer: RealCustomer) => { setOrderingForCustomer(customer); setEditingOrder(null); setIsOrderFormOpen(true); }
  
  const handleViewOrder = async (order: Order) => {
    setViewingOrder(null); 
    try {
        setIsOrderDetailsLoading(true);
        const detailedOrder = await (ApiClient as any).getOrderById(order.id);
        setViewingOrder(detailedOrder);
    } catch (err) {
        setError('Failed to load detailed order information.');
        setViewingOrder(null);
    } finally {
        setIsOrderDetailsLoading(false);
    }
  }
  
  const handleEditOrder = (order: Order) => { setEditingOrder(order); setFormMode('edit'); setIsOrderFormOpen(true); }
  const handleDeleteOrder = async (id: number) => { try { await ApiClient.deleteOrder(id); await loadAllData(); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete order'); } }
  const handleFormSuccess = () => { loadAllData() }
  
  const handleSaveItem = async (id: number, data: CustomerFormData) => {
    if (editingEntityType === 'lead') {
      await ApiClient.updateCustomer(id, data);
    } else if (editingEntityType === 'customer') {
      await updateRealCustomer(id, data);
    }
  };


  // =================================================================
  // === 4. MEMOIZED FILTERED DATA ===================================
  // =================================================================

  const filteredCustomers = useMemo(() => {
    return customers
      .filter(customer =>
        searchTerm === '' ||
        customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.mobile_number.includes(searchTerm) ||
        (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .filter(customer =>
        leadStatusFilter === 'all' || customer.status === leadStatusFilter
      )
      .filter(customer =>
        isDateWithinCustomRange(customer.created_on, leadFromDate, leadToDate)
      )
      .filter(customer => {
        if (leadStaffFilterName === 'all') return true;
        const createdByMatch = customer.created_by_staff_name === leadStaffFilterName; 
        return createdByMatch;
      });
  }, [customers, searchTerm, leadStatusFilter, leadFromDate, leadToDate, leadStaffFilterName]);

  const filteredOrders = useMemo(() => {
    const allKnownCustomers: (Customer | RealCustomer)[] = [...customers, ...realCustomers];

    return orders
      .filter(order => {
        const customer = allKnownCustomers.find(c => c.id === order.customer_id);
        const customerName = customer?.customer_name || '';

        return (
          orderSearchTerm === '' ||
          order.id.toString().includes(orderSearchTerm) ||
          (order.category && order.category.toLowerCase().includes(orderSearchTerm.toLowerCase())) ||
          customerName.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
          (order.status && order.status.toLowerCase().includes(orderSearchTerm.toLowerCase()))
        )
      })
      .filter(order =>
        orderStatusFilter === 'all' || order.status === orderStatusFilter
      )
      .filter(order =>
        isDateWithinCustomRange(order.created_on, orderFromDate, orderToDate)
      )
      .filter(order => {
        if (orderStaffFilterName === 'all') return true;
        const createdByMatch = order.created_by_staff_name === orderStaffFilterName; 
        return createdByMatch;
      });
  }, [orders, customers, realCustomers, orderSearchTerm, orderStatusFilter, orderFromDate, orderToDate, orderStaffFilterName]);

  const filteredRealCustomers = useMemo(() => {
    return realCustomers
      .filter(customer =>
        realCustomerSearchTerm === '' ||
        customer.customer_name.toLowerCase().includes(realCustomerSearchTerm.toLowerCase()) ||
        customer.mobile_number.includes(realCustomerSearchTerm) ||
        (customer.address && customer.address.toLowerCase().includes(realCustomerSearchTerm.toLowerCase()))
      )
      .filter(customer =>
        isDateWithinCustomRange(customer.created_on, customerFromDate, customerToDate)
      )
      .filter(customer => {
        if (customerStaffFilterName === 'all') return true;
        const createdByMatch = customer.created_by_staff_name === customerStaffFilterName;
        return createdByMatch;
      });
  }, [realCustomers, realCustomerSearchTerm, customerFromDate, customerToDate, customerStaffFilterName]);


  // --- Metrics ---
  const totalLeads = customers.length
  const hotLeads = customers.filter(c => c.status === 'hot').length
  const warmLeads = customers.filter(c => c.status === 'warm').length
  const convertedLeads = customers.filter(c => c.status === 'converted').length
  const totalOrders = orders.length
  const completedOrders = orders.filter(o => o.status === 'completed').length
  const pendingOrders = orders.filter(o => o.status === 'pending').length

  const crmMetrics = [
    { name: "Total Leads", value: totalLeads.toString(), change: `+${Math.floor(totalLeads * 0.1)}`, icon: Users },
    { name: "Hot Leads", value: hotLeads.toString(), change: `+${Math.floor(hotLeads * 0.15)}`, icon: Target },
    { name: "Total Orders", value: totalOrders.toString(), change: `+${Math.floor(totalOrders * 0.2)}`, icon: ShoppingCart },
  ]

  // =================================================================
  // === 5. RENDER ===================================================
  // =================================================================
  return (
    <DashboardLayout title="CRM Dashboard" role="crm">
      <main className="flex-1 space-y-6 p-4 md:p-6 overflow-y-auto">
        
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="orders" className="data-[state=active]:bg-black data-[state=active]:text-white">Orders</TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-black data-[state=active]:text-white">Leads</TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-black data-[state=active]:text-white">Customers</TabsTrigger>
            <TabsTrigger value="activities" className="data-[state=active]:bg-black data-[state=active]:text-white">Activities</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-black data-[state=active]:text-white">Reports</TabsTrigger>
          </TabsList>

          {/* ======================= ORDERS TAB COMPONENT ======================= */}
          <TabsContent value="orders" className="space-y-6">
            <OrdersTab
              error={error}
              isOrdersLoading={isOrdersLoading}
              orderSearchTerm={orderSearchTerm}
              setOrderSearchTerm={setOrderSearchTerm}
              orderStaffFilterName={orderStaffFilterName}
              setOrderStaffFilterName={setOrderStaffFilterName}
              orderStatusFilter={orderStatusFilter}
              setOrderStatusFilter={setOrderStatusFilter}
              orderFromDate={orderFromDate}
              setOrderFromDate={setOrderFromDate}
              orderToDate={orderToDate}
              setOrderToDate={setOrderToDate}
              staffs={staffs}
              isStaffLoading={isStaffLoading}
              filteredOrders={filteredOrders}
              ORDER_STATUSES={ORDER_STATUSES}
              customers={customers}
              realCustomers={realCustomers}
              
              // 👇 FIXED: Added the missing handler prop here
              handleCreateOrder={handleMakeNewOrder}
              
              handleViewOrder={handleViewOrder}
              handleEditOrder={handleEditOrder}
              handleDeleteOrder={handleDeleteOrder}
              getOrderStatusColor={getOrderStatusColor}
            />
          </TabsContent>

          {/* ======================= LEADS TAB COMPONENT ======================= */}
          <TabsContent value="leads" className="space-y-6">
            <LeadsTab
              error={error}
              isLoading={isLoading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              leadStaffFilterName={leadStaffFilterName}
              setLeadStaffFilterName={setLeadStaffFilterName}
              leadStatusFilter={leadStatusFilter}
              setLeadStatusFilter={setLeadStatusFilter}
              leadFromDate={leadFromDate}
              setLeadFromDate={setLeadFromDate}
              leadToDate={leadToDate}
              setLeadToDate={setLeadToDate}
              staffs={staffs}
              isStaffLoading={isStaffLoading}
              filteredCustomers={filteredCustomers}
              LEAD_STATUSES={LEAD_STATUSES}
              handleAddCustomer={handleAddCustomer}
              handleViewLead={handleViewLead}
              handleEditCustomer={handleEditCustomer}
              handleConvertToOrder={handleConvertToOrder}
              handleDeleteCustomer={handleDeleteCustomer}
              getStatusColor={getStatusColor}
            />
          </TabsContent>

          {/* ======================= CUSTOMERS TAB COMPONENT ======================= */}
          <TabsContent value="customers" className="space-y-6">
            <CustomersTab
              error={error}
              isRealCustomersLoading={isRealCustomersLoading}
              realCustomerSearchTerm={realCustomerSearchTerm}
              setRealCustomerSearchTerm={setRealCustomerSearchTerm}
              customerStaffFilterName={customerStaffFilterName}
              setCustomerStaffFilterName={setCustomerStaffFilterName}
              customerFromDate={customerFromDate}
              setCustomerFromDate={setCustomerFromDate}
              customerToDate={customerToDate}
              setCustomerToDate={setCustomerToDate}
              staffs={staffs}
              isStaffLoading={isStaffLoading}
              filteredRealCustomers={filteredRealCustomers}
              handleViewRealCustomer={handleViewRealCustomer}
              handleEditRealCustomer={handleEditRealCustomer}
              handleMakeNewOrder={handleMakeNewOrder}
            />
          </TabsContent>

          {/* ACTIVITIES & REPORTS TABS */}
          <TabsContent value="activities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Calendar className="h-5 w-5 mr-2" />Recent Activities</CardTitle>
                <CardDescription>Track all customer interactions and communications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customers.slice(0, 2).map((lead) => (
                    <div key={`lead-activity-${lead.id}`} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0"><Target className="h-5 w-5 text-orange-600" /></div>
                      <div className="flex-1">
                        <p className="font-medium">Lead {lead.customer_name} added</p>
                        <p className="text-sm text-gray-600">Created by {lead.created_by_staff_name || 'Staff'} • {new Date(lead.created_on).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(lead.status)}>{lead.status}</Badge>
                    </div>
                  ))}
                  {orders.slice(0, 2).map((order) => {
                    const allKnownCustomers: (Customer | RealCustomer)[] = [...customers, ...realCustomers];
                    const customer = allKnownCustomers.find(c => c.id === order.customer_id);
                    return (
                      <div key={`order-activity-${order.id}`} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0"><ShoppingCart className="h-5 w-5 text-green-600" /></div>
                        <div className="flex-1">
                          <p className="font-medium">Order #{order.id} created</p>
                          <p className="text-sm text-gray-600">Customer: {customer?.customer_name || 'Unknown'} • {new Date(order.created_on).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline" className={getOrderStatusColor(order.status || 'pending')}>{order.status || 'pending'}</Badge>
                      </div>
                    )
                  })}
                  {customers.length === 0 && orders.length === 0 && (
                    <div className="text-center py-8"><Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-500">No activities yet</p><p className="text-sm text-gray-400">Activities will appear here as you manage leads and orders</p></div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports" className="space-y-6">
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {crmMetrics.map((metric) => {
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

            {/* Existing Detailed Reports */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">Lead Status</CardTitle><CardDescription>Lead distribution by status</CardDescription></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Cold</span><span className="font-medium text-blue-600">{customers.filter(c => c.status === 'cold').length}</span></div>
                    <div className="flex justify-between text-sm"><span>Warm</span><span className="font-medium text-orange-600">{warmLeads}</span></div>
                    <div className="flex justify-between text-sm"><span>Hot</span><span className="font-medium text-red-600">{hotLeads}</span></div>
                    <div className="flex justify-between text-sm"><span>Converted</span><span className="font-medium text-green-600">{convertedLeads}</span></div>
                    <div className="flex justify-between text-sm"><span>Lost</span><span className="font-medium text-gray-600">{customers.filter(c => c.status === 'lost').length}</span></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Recent Growth</CardTitle><CardDescription>Lead acquisition this month</CardDescription></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 mb-2">+{Math.floor(totalLeads * 0.1)}</div>
                  <p className="text-sm text-gray-500">New leads this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Order Status</CardTitle><CardDescription>Order distribution by status</CardDescription></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Pending</span><span className="font-medium text-yellow-600">{pendingOrders}</span></div>
                    <div className="flex justify-between text-sm"><span>Completed</span><span className="font-medium text-green-600">{completedOrders}</span></div>
                    <div className="flex justify-between text-sm"><span>Total Orders</span><span className="font-medium text-blue-600">{totalOrders}</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </main>

      {/* MODALS Component */}
      <CRMModals
        isCustomerFormOpen={isCustomerFormOpen}
        setIsCustomerFormOpen={setIsCustomerFormOpen}
        isOrderFormOpen={isOrderFormOpen}
        setIsOrderFormOpen={setIsOrderFormOpen}
        formMode={formMode}
        editingItem={editingItem}
        editingEntityType={editingEntityType}
        handleSaveItem={handleSaveItem}
        handleFormSuccess={handleFormSuccess}
        
        convertingCustomer={convertingCustomer}
        setConvertingCustomer={setConvertingCustomer}
        orderingForCustomer={orderingForCustomer}
        setOrderingForCustomer={setOrderingForCustomer}
        editingOrder={editingOrder}
        setEditingOrder={setEditingOrder}

        viewingLead={viewingLead}
        setViewingLead={setViewingLead}
        viewingRealCustomer={viewingRealCustomer}
        setViewingRealCustomer={setViewingRealCustomer}
        viewingOrder={viewingOrder}
        setViewingOrder={setViewingOrder}
        isOrderDetailsLoading={isOrderDetailsLoading}
      />
    </DashboardLayout>
  )
}
