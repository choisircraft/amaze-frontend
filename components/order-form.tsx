"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  IndianRupee, 
  Package, 
  CreditCard, 
  Truck, 
  Calendar, 
  User, 
  FileText,
  Globe, 
  MapPin,
  Tag,
  FileText as ProductIcon,
  CheckCircle,
  Phone,
  MessageSquare,
  LayoutGrid // Added for Category Icon
} from "lucide-react"
import { type Order, type CreateOrderRequest, type UpdateOrderRequest, type Customer } from "@/lib/api"

interface OrderFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  order?: Order | null
  mode: 'create' | 'edit'
  customer?: Customer | null
}

// Extended form data type to include all backend fields + manual customer entry fields
type FormDataType = CreateOrderRequest & UpdateOrderRequest & {
  total_amount?: number
  customer_name?: string
  mobile_number?: string
  whatsapp_number?: string
}

export function OrderForm({ isOpen, onClose, onSuccess, order, mode, customer }: OrderFormProps) {
  const [formData, setFormData] = useState<FormDataType>({
    customer_id: 0,
    category: '',
    project_commit: '',
    start_on: '',
    completion_date: '',
    status: '',
    amount: 0,
    description: '',
    order_type: '',
    quantity: 0,
    payment_status: 'pending',
    amount_payed: 0,
    payment_method: '',
    delivery_type: '',
    delivery_address: '',
    product_name: '',
    additional_amount: 0,
    total_amount: 0,
    account_name: '',
    customer_name: '',
    mobile_number: '',
    whatsapp_number: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const isExistingCustomer = !!(customer && customer.id);

  const safeNumber = (value: any): number => {
    if (typeof value === 'number' && !isNaN(value)) return value
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  const formatCurrency = (value: any): string => {
    const num = safeNumber(value)
    return num.toFixed(2)
  }

  useEffect(() => {
    const baseAmount = safeNumber(formData.amount)
    const additional = safeNumber(formData.additional_amount)
    const calculatedTotal = baseAmount + additional
    
    setFormData(prev => ({ 
      ...prev, 
      total_amount: calculatedTotal 
    }))
  }, [formData.amount, formData.additional_amount])

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && order) {
        const safeAmount = safeNumber(order.amount)
        const safeAdditional = safeNumber(order.additional_amount)
        const safeTotal = safeNumber(order.total_amount)
        const calculatedTotal = safeTotal > 0 ? safeTotal : (safeAmount + safeAdditional)
        
        setFormData({
          customer_id: order.customer_id,
          category: order.category || '',
          project_commit: order.project_committed_on || '',
          start_on: order.start_on || '',
          completion_date: order.completion_date || '',
          completed_on: order.completed_on || '',
          status: order.status || '',
          amount: safeAmount,
          description: order.description || '',
          order_type: order.order_type || '',
          quantity: safeNumber(order.quantity),
          payment_status: order.payment_status || 'pending',
          amount_payed: safeNumber(order.amount_payed),
          payment_method: order.payment_method || '',
          delivery_type: order.delivery_type || '',
          delivery_address: order.delivery_address || '',
          product_name: order.product_name || '',
          additional_amount: safeAdditional,
          total_amount: calculatedTotal,
          account_name: order.account_name || '',
          customer_name: '',
          mobile_number: '',
          whatsapp_number: ''
        })
      } else if (mode === 'create' && customer && customer.id) {
        setFormData({
          customer_id: customer.id,
          category: '',
          project_commit: '',
          start_on: '',
          completion_date: '',
          status: 'pending',
          amount: 0,
          description: '',
          order_type: '',
          quantity: 0,
          payment_status: 'pending',
          amount_payed: 0,
          payment_method: '',
          delivery_type: '',
          delivery_address: customer.address || '',
          product_name: '',
          additional_amount: 0,
          total_amount: 0,
          account_name: '',
          customer_name: '',
          mobile_number: '',
          whatsapp_number: ''
        })
      } else {
        setFormData({
          customer_id: 0,
          category: '',
          project_commit: '',
          start_on: '',
          completion_date: '',
          status: 'pending',
          amount: 0,
          description: '',
          order_type: '',
          quantity: 0,
          payment_status: 'pending',
          amount_payed: 0,
          payment_method: '',
          delivery_type: '',
          delivery_address: '',
          product_name: '',
          additional_amount: 0,
          total_amount: 0,
          account_name: '',
          customer_name: '',
          mobile_number: '',
          whatsapp_number: ''
        })
      }
      setError('')
    }
  }, [isOpen, mode, order, customer])

  const handleInputChange = (field: keyof FormDataType, value: string | number | null) => {
    if (['amount', 'quantity', 'amount_payed', 'additional_amount', 'total_amount'].includes(field)) {
      setFormData(prev => ({ 
        ...prev, 
        [field]: safeNumber(value) 
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { ApiClient } = await import('@/lib/api')
      
      const submitData: any = {
        customer_id: formData.customer_id,
        category: formData.category?.trim() || undefined,
        project_commit: formData.project_commit?.trim() || undefined,
        start_on: formData.start_on?.trim() || undefined,
        completion_date: formData.completion_date?.trim() || undefined,
        completed_on: formData.completed_on?.trim() || undefined,
        status: formData.status?.trim() || undefined,
        amount: safeNumber(formData.amount) || undefined,
        description: formData.description?.trim() || undefined,
        order_type: formData.order_type?.trim() || undefined,
        quantity: safeNumber(formData.quantity) || undefined,
        payment_status: formData.payment_status?.trim() || undefined,
        amount_payed: safeNumber(formData.amount_payed) || undefined,
        payment_method: formData.payment_method?.trim() || undefined,
        delivery_type: formData.delivery_type?.trim() || undefined,
        delivery_address: formData.delivery_address?.trim() || undefined,
        product_name: formData.product_name?.trim() || undefined,
        additional_amount: safeNumber(formData.additional_amount) || undefined,
        total_amount: safeNumber(formData.total_amount) || undefined,
        account_name: formData.account_name?.trim() || undefined,
      }
      
      if (mode === 'create') {
        if (formData.customer_id === 0) {
             submitData.customer_name = formData.customer_name;
             submitData.mobile_number = formData.mobile_number;
             submitData.whatsapp_number = formData.whatsapp_number;
        }

        if ((!submitData.customer_id && !submitData.customer_name) || !submitData.order_type || !submitData.product_name || !submitData.amount) {
          throw new Error('Please fill all required fields (Customer Name, Mobile, Product Name, Order Type, Amount)')
        }
        await ApiClient.createOrder(submitData as CreateOrderRequest)
      } else if (mode === 'edit' && order) {
        await ApiClient.updateOrder(order.id, submitData as UpdateOrderRequest)
      }
      
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving the order')
    } finally {
      setIsLoading(false)
    }
  }

  // === UI Options ===
  const categoryOptions = [
    { value: 'crystal_wall_art', label: 'Crystal Wall Art' },
    { value: 'amaze_ads', label: 'Amaze Ads' },
    { value: 'crystal_glass_art', label: 'Crystal Glass Art' },
    { value: 'sign_board_amaze', label: 'Sign Board Amaze' },
  ]
  const orderTypeOptions = [
    { value: 'online', label: 'Online Order', icon: <Globe className="h-4 w-4" /> },
    { value: 'offline', label: 'Offline/Physical Order', icon: <MapPin className="h-4 w-4" /> },
  ]
  const paymentStatusOptions = [
    { value: 'pending', label: 'Pending Payment', color: 'text-yellow-600 bg-yellow-50' },
    { value: 'partial', label: 'Partial Payment', color: 'text-orange-600 bg-orange-50' },
    { value: 'completed', label: 'Payment Completed', color: 'text-green-600 bg-green-50' },
    { value: 'overdue', label: 'Overdue', color: 'text-red-600 bg-red-50' },
  ]
  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash', icon: '💰' },
    { value: 'card', label: 'Credit/Debit Card', icon: '💳' },
    { value: 'upi', label: 'UPI', icon: '📱' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
    { value: 'cheque', label: 'Cheque', icon: '📄' },
  ]
  const deliveryTypeOptions = [
    { value: 'pickup', label: 'Customer Pickup', icon: '👤' },
    { value: 'self_install', label: 'Self Installation', icon: '🔧' },
    { value: 'post_office', label: 'Post Office (Speed Post)', icon: '📮' },
    { value: 'dtdc', label: 'DTDC', icon: '📦' },
    { value: 'speed_safe_dtdc', label: 'Speed Safe (DTDC)', icon: '🚀' },
    { value: 'ksrtc', label: 'KSRTC', icon: '🚌' },
    { value: 'other', label: 'Other', icon: '✨' },
  ]
  const deliveryRequiresAddress = ['post_office', 'dtdc', 'speed_safe_dtdc', 'ksrtc', 'other']
  const accountNameOptions = [
    { value: 'iob', label: 'IOB' },
    { value: 'anil', label: 'Anil' },
    { value: 'remya', label: 'Remya' },
    { value: 'rgb_186', label: 'RGB -186 (Swiping Machine)' },
    { value: 'amaze_ac', label: 'Amaze A/C' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'cash', label: 'Cash' },
    { value: 'cd', label: 'CD' },
  ]

  const allStatusOptions = [
      { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
      { value: 'confirmed', label: 'Confirmed', color: 'text-blue-600' },
      { value: 'in_progress', label: 'In Progress', color: 'text-orange-600' },
      { value: 'completed', label: 'Completed', color: 'text-green-600' },
      { value: 'cancelled', label: 'Cancelled', color: 'text-red-600' },
  ]

  const restrictedValues = ['pending', 'confirmed'];
  let statusOptions = allStatusOptions.filter(opt => restrictedValues.includes(opt.value));
  if (mode === 'edit' && order && !restrictedValues.includes(order.status)) {
      const currentStatusObject = allStatusOptions.find(opt => opt.value === order.status);
      if (currentStatusObject) statusOptions = [currentStatusObject, ...statusOptions];
  }
  statusOptions = statusOptions.filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i); 

  const hasCustomer = formData.customer_id > 0 || (!!formData.customer_name && !!formData.mobile_number);
  const isFormValid = hasCustomer && !!formData.order_type && !!formData.product_name && safeNumber(formData.amount) > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Order' : `Edit Order #${order?.id}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? isExistingCustomer ? `Create an order for ${customer?.customer_name}.` : 'Enter customer and order details below.'
              : 'Update the order information below.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Info Section */}
          {isExistingCustomer ? (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center mb-3">
                <User className="h-4 w-4 mr-2 text-blue-600" />
                <h4 className="font-semibold text-blue-800">Customer Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div><span className="font-medium text-gray-700">Name:</span><p className="text-gray-900 ml-1">{customer?.customer_name}</p></div>
                <div><span className="font-medium text-gray-700">Mobile:</span><p className="text-gray-900 ml-1">{customer?.mobile_number}</p></div>
                <div><span className="font-medium text-gray-700">WhatsApp:</span><p className="text-gray-900 ml-1">{customer?.whatsapp_number || 'N/A'}</p></div>
                {customer?.address && <div className="md:col-span-3"><span className="font-medium text-gray-700">Address:</span><p className="text-gray-900 ml-1 mt-1">{customer.address}</p></div>}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center mb-4">
                <User className="h-4 w-4 mr-2 text-blue-600" />
                <h4 className="font-semibold text-blue-800">Customer Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name" className="flex items-center"><User className="h-3 w-3 mr-1" /> Name *</Label>
                  <Input id="customer_name" value={formData.customer_name || ''} onChange={(e) => handleInputChange('customer_name', e.target.value)} placeholder="Customer Name" className="bg-white" required={formData.customer_id === 0} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile_number" className="flex items-center"><Phone className="h-3 w-3 mr-1" /> Mobile *</Label>
                  <Input id="mobile_number" value={formData.mobile_number || ''} onChange={(e) => handleInputChange('mobile_number', e.target.value)} placeholder="Mobile Number" className="bg-white" required={formData.customer_id === 0} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number" className="flex items-center"><MessageSquare className="h-3 w-3 mr-1" /> WhatsApp</Label>
                  <Input id="whatsapp_number" value={formData.whatsapp_number || ''} onChange={(e) => handleInputChange('whatsapp_number', e.target.value)} placeholder="WhatsApp Number" className="bg-white" />
                </div>
              </div>
            </div>
          )}

          {/* Product Information Section */}
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h4 className="font-semibold text-indigo-800 mb-4 flex items-center">
              <ProductIcon className="h-4 w-4 mr-2" />
              Product Information
            </h4>
            
            {/* === HIGHLIGHTED CATEGORY SELECTION (MOVED TO TOP) === */}
            <div className="mb-5 p-3 bg-white rounded-md border border-indigo-200 shadow-sm">
                <Label htmlFor="category" className="flex items-center text-indigo-700 font-semibold mb-2">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Select Category
                </Label>
                <Select 
                  value={formData.category || ''} 
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger className="h-11 bg-indigo-50/30 border-indigo-200 focus:ring-indigo-500">
                    <SelectValue placeholder="-- Click to select a category --" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            
            {/* Rest of Product Info */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="product_name" className="flex items-center">
                  <Tag className="h-4 w-4 mr-1" />
                  Product Name *
                </Label>
                <Input
                  id="product_name"
                  type="text"
                  value={formData.product_name || ''}
                  onChange={(e) => handleInputChange('product_name', e.target.value)}
                  placeholder="Enter product/service name"
                  required
                  className="pr-10"
                />
              </div>

              <div className="space-y-2 lg:col-span-1">
                <Label htmlFor="order_type" className="flex items-center">
                  <Package className="h-4 w-4 mr-1" />
                  Order Type *
                </Label>
                <Select 
                  value={formData.order_type} 
                  onValueChange={(value) => handleInputChange('order_type', value)}
                  required
                >
                  <SelectTrigger className="pr-10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center">
                          <span className="mr-2">{option.icon}</span>
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 lg:col-span-1">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity || ''}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  placeholder="Qty"
                  className="pr-10"
                />
              </div>
            </div>
          </div>

          {/* Amount Information Section */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-4 flex items-center">
              <IndianRupee className="h-4 w-4 mr-2" />
              Amount Information
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="space-y-2 lg:col-span-1">
                <Label htmlFor="amount" className="flex items-center">
                  Base Amount *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="Enter base amount"
                  required
                  className="pl-8 pr-8"
                />
              </div>

              <div className="space-y-2 lg:col-span-1">
                <Label htmlFor="additional_amount" className="flex items-center">
                  Additional Amount
                </Label>
                <Input
                  id="additional_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.additional_amount || ''}
                  onChange={(e) => handleInputChange('additional_amount', e.target.value)}
                  placeholder="Enter additional charges"
                  className="pl-8 pr-8"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="total_amount" className="flex items-center font-semibold">
                  <span>Total Amount</span>
                  <span className="ml-2 text-sm text-gray-600">
                    (₹ {formatCurrency(formData.total_amount)})
                  </span>
                </Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formatCurrency(formData.total_amount)}
                  disabled
                  className="pl-8 pr-8 bg-gray-100"
                  placeholder="Auto-calculated"
                />
              </div>
            </div>
          </div>

          {/* Payment Information Section */}
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-4 flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Information
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="amount_payed" className="flex items-center">
                  <IndianRupee className="h-4 w-4 mr-1" />
                  Amount Paid
                </Label>
                <Input
                  id="amount_payed"
                  type="number"
                  step="0.01"
                  min="0"
                  max={safeNumber(formData.total_amount)}
                  value={formData.amount_payed || ''}
                  onChange={(e) => handleInputChange('amount_payed', e.target.value)}
                  placeholder="0.00"
                  className="pl-8 pr-8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_status">Payment Status</Label>
                <Select 
                  value={formData.payment_status || ''} 
                  onValueChange={(value) => handleInputChange('payment_status', value)}
                >
                  <SelectTrigger className="pr-10">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={`px-2 py-1 rounded ${option.color} font-medium`}>
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select 
                  value={formData.payment_method || ''} 
                  onValueChange={(value) => handleInputChange('payment_method', value)}
                >
                  <SelectTrigger className="pr-10">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center">
                          <span className="mr-2 text-lg">{option.icon}</span>
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name</Label>
                <Select 
                  value={formData.account_name || ''} 
                  onValueChange={(value) => handleInputChange('account_name', value)}
                >
                  <SelectTrigger className="pr-10">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountNameOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Date Fields Section */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-4 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Timeline Information
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_commit" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Project Commit Date
                </Label>
                <Input
                  id="project_commit"
                  type="date"
                  value={formData.project_commit || ''}
                  onChange={(e) => handleInputChange('project_commit', e.target.value)}
                  className="pl-10 pr-10 text-sm py-8" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_on" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Start Date
                </Label>
                <Input
                  id="start_on"
                  type="date"
                  value={formData.start_on || ''}
                  onChange={(e) => handleInputChange('start_on', e.target.value)}
                  className="pl-10 pr-10 text-sm py-8" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="completion_date" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Completion Date
                </Label>
                <Input
                  id="completion_date"
                  type="date"
                  value={formData.completion_date || ''}
                  onChange={(e) => handleInputChange('completion_date', e.target.value)}
                  className="pl-10 pr-10 text-sm py-8" 
                />
              </div>
            </div>
          </div>

          {/* Delivery Information Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_type" className="flex items-center">
                <Truck className="h-4 w-4 mr-1" />
                Delivery Type
              </Label>
              <Select 
                value={formData.delivery_type || ''} 
                onValueChange={(value) => handleInputChange('delivery_type', value)}
              >
                <SelectTrigger className="pr-10">
                  <SelectValue placeholder="Select delivery type" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center">
                        <span className="mr-2 text-lg">{option.icon}</span>
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Rendering for Address */}
            {deliveryRequiresAddress.includes(formData.delivery_type || '') && (
              <div className="space-y-2">
                <Label htmlFor="delivery_address" className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Delivery Address
                </Label>
                <Textarea
                  id="delivery_address"
                  value={formData.delivery_address || ''}
                  onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                  placeholder="Enter specific delivery address (if different from customer address)"
                  rows={3}
                  className="pr-4"
                />
              </div>
            )}
          </div>
          
          {/* Status Field */}
          <div className="p-4 bg-blue-50/70 border border-blue-400 rounded-lg shadow-md mt-6">
            <div className="space-y-2">
              <Label htmlFor="status" className="flex items-center text-lg font-semibold text-blue-800">
                <CheckCircle className="h-5 w-5 mr-2" />
                Order Status *
              </Label>
              <Select 
                value={formData.status || ''} 
                onValueChange={(value) => handleInputChange('status', value)}
                required
              >
                <SelectTrigger className="pr-10 h-11 border-blue-500 bg-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className={option.color}>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              Description / Notes
            </Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter order description, special instructions, or additional notes..."
              rows={4}
              className="pr-4"
            />
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !isFormValid}
              className={`px-6 ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Saving...' : mode === 'create' ? 'Create Order' : 'Update Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
