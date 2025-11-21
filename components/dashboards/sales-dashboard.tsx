// app/dashboard/sales/page.tsx (SalesDashboard)

"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "../dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Import the sales-specific components
import { SalesModals } from "@/components/dashboards/modals/sales-modals"
import { SalesLeadsTab } from "@/components/dashboards/sales-tabs/SalesLeadsTab"
import { SalesOrdersTab } from "@/components/dashboards/sales-tabs/SalesOrdersTab"
import { SalesCustomersTab } from "@/components/dashboards/sales-tabs/SalesCustomersTab"
import { SalesActivitiesTab } from "@/components/dashboards/sales-tabs/SalesActivitiesTab"
import { SalesReportsTab } from "@/components/dashboards/sales-tabs/SalesReportsTab"

import { type CustomerFormData } from "@/components/customer-form"

import { SalesApiClient, type Customer, type Order, type RealCustomer } from "@/lib/sales"
import {
  Users,
  Target,
  TrendingUp,
  ShoppingCart,
} from "lucide-react"

import {
  getRealCustomers,
  updateRealCustomer,
  getStaffByRoles,
  type StaffUser
} from "@/lib/sales"

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
  if (!dateString) return false

  const recordDate = new Date(dateString)
  let fromDate: Date | null = null
  let toDate: Date | null = null

  if (fromDateStr) {
    fromDate = new Date(fromDateStr)
    fromDate.setHours(0, 0, 0, 0)
  }

  if (toDateStr) {
    toDate = new Date(toDateStr)
    toDate.setHours(23, 59, 59, 999)
  }

  let isAfterFrom = fromDate ? recordDate >= fromDate : true
  let isBeforeTo = toDate ? recordDate <= toDate : true

  return isAfterFrom && isBeforeTo
}

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

export function SalesDashboard() {
  // === 1. CORE STATE ===
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


  // === 2. DATA LOADING ===
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
      const customerData = await SalesApiClient.getSalesCustomers()
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
      const orderData = await SalesApiClient.getSalesOrders()
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

  // === 3. HANDLERS ===
  const handleViewLead = (lead: Customer) => { setViewingLead(lead) }
  const handleAddCustomer = () => { setEditingItem(null); setEditingEntityType('lead'); setFormMode('create'); setIsCustomerFormOpen(true); }
  const handleEditCustomer = (customer: Customer) => { setEditingItem(customer); setEditingEntityType('lead'); setFormMode('edit'); setIsCustomerFormOpen(true); }
  const handleDeleteCustomer = async (id: number) => { try { await SalesApiClient.deleteSalesCustomer(id); await loadAllData(); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete customer'); } }
  const handleConvertToOrder = (customer: Customer) => { setConvertingCustomer(customer); setIsOrderFormOpen(true); }
  const handleViewRealCustomer = (customer: RealCustomer) => { setViewingRealCustomer(customer) }
  const handleEditRealCustomer = (customer: RealCustomer) => { setEditingItem(customer); setEditingEntityType('customer'); setFormMode('edit'); setIsCustomerFormOpen(true); }
  const handleMakeNewOrder = (customer: RealCustomer) => { setOrderingForCustomer(customer); setEditingOrder(null); setIsOrderFormOpen(true); }

  const handleViewOrder = async (order: Order) => {
    setViewingOrder(null);
    try {
      setIsOrderDetailsLoading(true);
      const detailedOrder = await (SalesApiClient as any).getSalesOrderById(order.id);
      setViewingOrder(detailedOrder);
    } catch (err) {
      setError('Failed to load detailed order information.');
      setViewingOrder(null);
    } finally {
      setIsOrderDetailsLoading(false);
    }
  }

  const handleEditOrder = (order: Order) => { setEditingOrder(order); setFormMode('edit'); setIsOrderFormOpen(true); }
  const handleDeleteOrder = async (id: number) => { try { await SalesApiClient.deleteSalesOrder(id); await loadAllData(); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete order'); } }
  const handleFormSuccess = () => { loadAllData() }

  const handleSaveItem = async (id: number, data: CustomerFormData) => {
    if (editingEntityType === 'lead') {
      await SalesApiClient.updateCustomer(id, data);
    } else if (editingEntityType === 'customer') {
      await updateRealCustomer(id, data);
    }
  };


  // === 4. MEMOIZED FILTERED DATA ===
  const filteredCustomers = useMemo(() => {
    return customers
      .filter(customer =>
        searchTerm === '' ||
        customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.mobile_number.includes(searchTerm)
      )
      .filter(customer =>
        leadStatusFilter === 'all' || customer.status === leadStatusFilter
      )
      .filter(customer =>
        isDateWithinCustomRange(customer.created_on, leadFromDate, leadToDate)
      )
      .filter(customer =>
        leadStaffFilterName === 'all' || customer.created_by_staff_name === leadStaffFilterName
      );
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
          customerName.toLowerCase().includes(orderSearchTerm.toLowerCase())
        )
      })
      .filter(order =>
        orderStatusFilter === 'all' || order.status === orderStatusFilter
      )
      .filter(order =>
        isDateWithinCustomRange(order.created_on, orderFromDate, orderToDate)
      )
      .filter(order =>
        orderStaffFilterName === 'all' || order.created_by_staff_name === orderStaffFilterName
      );
  }, [orders, customers, realCustomers, orderSearchTerm, orderStatusFilter, orderFromDate, orderToDate, orderStaffFilterName]);

  const filteredRealCustomers = useMemo(() => {
    return realCustomers
      .filter(customer =>
        realCustomerSearchTerm === '' ||
        customer.customer_name.toLowerCase().includes(realCustomerSearchTerm.toLowerCase()) ||
        customer.mobile_number.includes(realCustomerSearchTerm)
      )
      .filter(customer =>
        isDateWithinCustomRange(customer.created_on, customerFromDate, customerToDate)
      )
      .filter(customer =>
        customerStaffFilterName === 'all' || customer.created_by_staff_name === customerStaffFilterName
      );
  }, [realCustomers, realCustomerSearchTerm, customerFromDate, customerToDate, customerStaffFilterName]);


  // --- Metrics ---
  const totalLeads = customers.length
  const hotLeads = customers.filter(c => c.status === 'hot').length
  const warmLeads = customers.filter(c => c.status === 'warm').length
  const convertedLeads = customers.filter(c => c.status === 'converted').length
  const totalOrders = orders.length
  const completedOrders = orders.filter(o => o.status === 'completed').length
  const pendingOrders = orders.filter(o => o.status === 'pending').length

  const salesMetrics = [
    { name: "Total Leads", value: totalLeads.toString(), change: `+${Math.floor(totalLeads * 0.1)}`, icon: Users },
    { name: "Hot Leads", value: hotLeads.toString(), change: `+${Math.floor(hotLeads * 0.15)}`, icon: Target },
    { name: "Total Orders", value: totalOrders.toString(), change: `+${Math.floor(totalOrders * 0.2)}`, icon: ShoppingCart },
  ]

  // === 5. RENDER ===
  return (
    <DashboardLayout title="Sales Dashboard" role="sales">
      <main className="flex-1 space-y-6 p-4 md:p-6 overflow-y-auto">
        {/* UPDATED: defaultValue changed to "orders" */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            {/* UPDATED: Reordered triggers so Orders is first visually */}
            <TabsTrigger value="orders" className="data-[state=active]:bg-black data-[state=active]:text-white">Orders</TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-black data-[state=active]:text-white">Leads</TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-black data-[state=active]:text-white">Customers</TabsTrigger>
            <TabsTrigger value="activities" className="data-[state=active]:bg-black data-[state=active]:text-white">Activities</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-black data-[state=active]:text-white">Reports</TabsTrigger>
          </TabsList>

          {/* UPDATED: Moved Orders content to top (optional but good for organization) */}
          <TabsContent value="orders" className="space-y-6">
            <SalesOrdersTab
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
              handleViewOrder={handleViewOrder}
              handleEditOrder={handleEditOrder}
              handleDeleteOrder={handleDeleteOrder}
              getOrderStatusColor={getOrderStatusColor}
              handleMakeNewOrder={handleMakeNewOrder} 
            />
          </TabsContent>

          <TabsContent value="leads" className="space-y-6">
            <SalesLeadsTab
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

          <TabsContent value="customers" className="space-y-6">
            <SalesCustomersTab
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

          <TabsContent value="activities" className="space-y-6">
            <SalesActivitiesTab
              customers={customers}
              orders={orders}
              realCustomers={realCustomers}
              getStatusColor={getStatusColor}
              getOrderStatusColor={getOrderStatusColor}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {salesMetrics.map((metric) => {
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

            <SalesReportsTab
              customers={customers}
              orders={orders}
              totalLeads={totalLeads}
              hotLeads={hotLeads}
              warmLeads={warmLeads}
              convertedLeads={convertedLeads}
              totalOrders={totalOrders}
              completedOrders={completedOrders}
              pendingOrders={pendingOrders}
            />
          </TabsContent>
        </Tabs>
      </main>

      <SalesModals
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
