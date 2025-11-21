// components/dashboards/crm/OrdersTab.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Search, ShoppingCart, Edit, Trash2, IndianRupee, Calendar, Package, SlidersHorizontal, Image as ImageIcon, Upload, X, Plus } from "lucide-react"
import { type Order, type Customer, type RealCustomer, type StaffUser } from "@/lib/api"
// Assuming your API functions and types are correctly exported from the path below
import { 
    type OrderImage as ApiOrderImage, 
    getOrderImages, 
    uploadOrderImage, 
    deleteOrderImage 
} from '@/lib/crm'; 

// NOTE: Ensure your main OrderImage type in @/lib/crm includes public_id
type OrderImage = ApiOrderImage & {
    public_id: string;
};


// -------------------------------------------------------------
// OrdersTabProps Interface
// -------------------------------------------------------------
interface OrdersTabProps {
    error: string
    isOrdersLoading: boolean
    orderSearchTerm: string
    setOrderSearchTerm: (term: string) => void
    orderStaffFilterName: string
    setOrderStaffFilterName: (name: string) => void
    orderStatusFilter: string
    setOrderStatusFilter: (status: string) => void
    orderFromDate: string
    setOrderFromDate: (date: string) => void
    orderToDate: string
    setOrderToDate: (date: string) => void
    staffs: StaffUser[]
    isStaffLoading: boolean
    filteredOrders: Order[]
    ORDER_STATUSES: string[]
    customers: Customer[]
    realCustomers: RealCustomer[]
    
    // Actions
    handleCreateOrder: () => void
    handleViewOrder: (order: Order) => void
    handleEditOrder: (order: Order) => void
    handleDeleteOrder: (id: number) => void
    
    getOrderStatusColor: (status: string) => string
}

// -------------------------------------------------------------
// Image Manager Component (API Integration)
// -------------------------------------------------------------

interface ImageManagerProps {
    order: Order;
    onClose: () => void;
}

const OrderImageManagerDialog: React.FC<ImageManagerProps> = ({ order, onClose }) => {
    const [images, setImages] = useState<OrderImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadDescription, setUploadDescription] = useState('');

    const orderId = order.id;

    // --- Fetching Images ---
    const fetchImages = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const fetchedImages = await getOrderImages(orderId); 
            setImages(fetchedImages as OrderImage[]); 
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

    // --- Upload Handler ---
    const handleUpload = async () => {
        if (!uploadFile) {
            setError('Please select an image file.');
            return;
        }

        setIsUploading(true);
        setError('');
        try {
            const newImage = await uploadOrderImage(orderId, uploadFile, uploadDescription); 
            setImages(prev => [...prev, newImage as OrderImage]); 

            setUploadFile(null);
            setUploadDescription('');
            const fileInput = (document.getElementById('image-file-input') as HTMLInputElement);
            if (fileInput) fileInput.value = ''; 

        } catch (err) {
            setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    // --- Delete Handler ---
    const handleDelete = async (imageToDelete: OrderImage) => {
        setIsLoading(true); 
        setError('');
        try {
            await deleteOrderImage(imageToDelete.id, imageToDelete.public_id); 
            setImages(prev => prev.filter(img => img.id !== imageToDelete.id));
        } catch (err) {
            setError(`Deletion failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <ImageIcon className="w-5 h-5 mr-2" /> 
                        Images for Order #{orderId}
                    </DialogTitle>
                </DialogHeader>

                {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>
                )}
                
                {/* Image Upload Section */}
                <div className="border p-4 rounded-lg mb-4 bg-gray-50">
                    <h4 className="font-semibold mb-3">Upload New Image</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input 
                            id="image-file-input"
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                            className="flex-1"
                        />
                        <Input 
                            placeholder="Optional Description"
                            value={uploadDescription}
                            onChange={(e) => setUploadDescription(e.target.value)}
                            className="flex-1"
                        />
                        <Button 
                            onClick={handleUpload} 
                            disabled={isUploading || !uploadFile}
                            className="sm:w-auto"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploading ? 'Uploading...' : 'Upload Image'}
                        </Button>
                    </div>
                </div>

                {/* Image Gallery Section */}
                <div className="mt-6">
                    <h4 className="font-semibold mb-3">Existing Images ({images.length})</h4>

                    {isLoading && images.length === 0 ? ( 
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading images...</p>
                        </div>
                    ) : images.length === 0 ? (
                        <p className="text-center text-gray-500 p-8 border rounded-lg">No images uploaded for this order yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map(img => (
                                <div key={img.id} className="relative group border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="aspect-square w-full bg-gray-200">
                                        <img 
                                            src={img.image_url} 
                                            alt={img.description || `Order Image ${img.id}`} 
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>
                                    <div className="p-3 text-sm">
                                        <p className="font-medium truncate">{img.description || 'No Description'}</p>
                                        <p className="text-xs text-gray-500 mt-1">Uploaded: {new Date(img.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button 
                                                variant="destructive" 
                                                size="icon" 
                                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                disabled={isLoading} 
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete this image? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(img)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
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


// -------------------------------------------------------------
// Main OrdersTab Component
// -------------------------------------------------------------

export const OrdersTab: React.FC<OrdersTabProps> = ({
    error,
    isOrdersLoading,
    orderSearchTerm,
    setOrderSearchTerm,
    orderStaffFilterName,
    setOrderStaffFilterName,
    orderStatusFilter,
    setOrderStatusFilter,
    orderFromDate,
    setOrderFromDate,
    orderToDate,
    setOrderToDate,
    staffs,
    isStaffLoading,
    filteredOrders,
    ORDER_STATUSES,
    customers,
    realCustomers,
    handleCreateOrder,
    handleViewOrder,
    handleEditOrder,
    handleDeleteOrder,
    getOrderStatusColor
}) => {
    const [selectedOrderForImages, setSelectedOrderForImages] = useState<Order | null>(null);

    const handleOpenImageModal = (order: Order) => {
        setSelectedOrderForImages(order);
    };

    // Combine customers for lookup
    const allKnownCustomers: (Customer | RealCustomer)[] = [...customers, ...realCustomers];
    
    const FilterControls = ({ className = "" }: { className?: string }) => (
        <div className={className}>
            {/* STAFF FILTER */}
            <Select value={orderStaffFilterName} onValueChange={setOrderStaffFilterName} disabled={isStaffLoading}>
                <SelectTrigger className="w-full md:w-[150px] flex-shrink-0">
                    <SelectValue placeholder="Staff" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {staffs.map(staff => (<SelectItem key={staff.id} value={staff.staff_name}>{staff.staff_name}</SelectItem>))}
                </SelectContent>
            </Select>

            {/* STATUS FILTER */}
            <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px] flex-shrink-0">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {ORDER_STATUSES.map(status => (<SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</SelectItem>))}
                </SelectContent>
            </Select>

            {/* FROM DATE INPUT */}
            <Input
                type="date"
                placeholder="From Date"
                value={orderFromDate}
                onChange={(e) => setOrderFromDate(e.target.value)}
                className="w-full md:w-[150px] flex-shrink-0"
            />
            
            {/* TO DATE INPUT */}
            <Input
                type="date"
                placeholder="To Date"
                value={orderToDate}
                onChange={(e) => setOrderToDate(e.target.value)}
                className="w-full md:w-[150px] flex-shrink-0"
            />
        </div>
    );

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center"><ShoppingCart className="h-5 w-5 mr-2" />Order Management</CardTitle>
                            <CardDescription>Manage customer orders and track project progress</CardDescription>
                        </div>
                        
                        {/* NEW BUTTON: Create Order */}
                        <Button 
                            onClick={handleCreateOrder} 
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Order
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{error}</p></div>}

                    {/* ORDER SEARCH AND FILTER SECTION */}
                    <div className="flex items-center space-x-2 mb-6 gap-2 flex-wrap">
                        
                        {/* SEARCH INPUT */}
                        <div className="relative flex-1 min-w-[150px]"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input placeholder="Search orders..." className="pl-10" value={orderSearchTerm} onChange={(e) => setOrderSearchTerm(e.target.value)} /></div>

                        {/* MOBILE FILTER TRIGGER */}
                        <div className="w-full sm:w-auto md:hidden">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="w-full flex items-center">
                                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                                        Filters
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent> 
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Apply Filters</AlertDialogTitle>
                                        <AlertDialogDescription>Refine the list of orders.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    
                                    <FilterControls className="flex flex-col gap-4 py-4" />

                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Close</AlertDialogCancel>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        {/* DESKTOP FILTERS */}
                        <FilterControls className="hidden md:flex items-center gap-2 flex-wrap" />

                    </div>

                    {isOrdersLoading ? (
                        <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-2 text-sm text-gray-500">Loading orders...</p></div>
                    ) : (
                        <div className="space-y-4">
                            {filteredOrders.length === 0 ? (
                                <div className="text-center py-8"><ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-500">No orders found matching criteria.</p></div>
                            ) : (
                                filteredOrders.map((order) => {
                                    const customer = allKnownCustomers.find(c => c.id === order.customer_id);
                                    
                                    const totalAmountDisplay = (order.total_amount || order.amount)?.toLocaleString('en-IN') || 'N/A';
                                    const completionDateDisplay = order.completion_date 
                                        ? new Date(order.completion_date).toLocaleDateString()
                                        : 'N/A';

                                    return (
                                        <div key={order.id} className="border rounded-lg p-4 transition-shadow hover:shadow-md bg-white">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                
                                                {/* LEFT SIDE: Customer Name and Order ID Info */}
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-green-100 rounded-full flex-shrink-0 flex items-center justify-center"><ShoppingCart className="h-6 w-6 text-green-600" /></div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-gray-900">
                                                            {customer?.customer_name || 'Unknown Customer'}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mt-0.5">
                                                            Order ID: <span className="font-mono text-xs text-gray-700">#{order.id}</span>
                                                            {('reference_id' in order && order.reference_id) && (
                                                                <span className="ml-3 text-blue-700 font-semibold text-xs md:text-sm">
                                                                    Code: {order.reference_id}
                                                                </span>
                                                            )}
                                                        </p>
                                                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                                                            <p>Created by {order.created_by_staff_name || 'Staff'} on {new Date(order.created_on).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* CENTER SECTION: Key Order Metrics */}
                                                <div className="grid grid-cols-3 gap-4 md:flex md:space-x-8 md:items-center text-sm border-t md:border-t-0 pt-3 md:pt-0">
                                                    
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-xs text-gray-500 flex items-center"><Package className="h-3 w-3 mr-1" /> Product</span>
                                                        <span className="font-medium text-gray-800 break-words max-w-[150px]">{order.product_name || 'N/A'}</span>
                                                    </div>

                                                    <div className="flex flex-col items-start">
                                                        <span className="text-xs text-gray-500 flex items-center"><IndianRupee className="h-3 w-3 mr-1" /> Total Amount</span>
                                                        <span className="font-bold text-green-700">₹ {totalAmountDisplay}</span>
                                                    </div>

                                                    <div className="flex flex-col items-start">
                                                        <span className="text-xs text-gray-500 flex items-center"><Calendar className="h-3 w-3 mr-1" /> Target Date</span>
                                                        <span className="font-medium text-gray-800">{completionDateDisplay}</span>
                                                    </div>
                                                </div>

                                                {/* RIGHT SIDE: Status and Actions */}
                                                <div className="text-left md:text-right flex flex-col md:items-end">
                                                    <div className="flex items-center justify-start md:justify-end space-x-2 mb-2">
                                                        <Badge variant="default" className={getOrderStatusColor(order.status || 'pending')}>{order.status || 'pending'}</Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                                                        <Button variant="secondary" size="sm" onClick={() => handleViewOrder(order)}>View Details</Button>
                                                        
                                                        {/* IMAGE BUTTON */}
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="bg-blue-50 hover:bg-blue-100 text-blue-600"
                                                            onClick={() => handleOpenImageModal(order)}
                                                        >
                                                            <ImageIcon className="h-3 w-3 mr-1" />Images
                                                        </Button>

                                                        {/* Conditional Edit Button */}
                                                        {order.status === 'pending' ? (
                                                            <Button variant="outline" size="sm" onClick={() => handleEditOrder(order)}>
                                                                <Edit className="h-3 w-3 mr-1" />Edit
                                                            </Button>
                                                        ) : (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="outline" size="sm" className="opacity-60 cursor-not-allowed">
                                                                        <Edit className="h-3 w-3 mr-1" />Edit
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Cannot Edit Order</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This order's status is "{order.status}". You can only edit orders that are 'pending'.
                                                                            <br /><br />
                                                                            To make changes, please request the project manager to change its status back to 'pending'.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>OK</AlertDialogCancel>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                        {/* End Conditional Edit Button */}

                                                        {/* Conditional Delete Button - ONLY SHOW IF PENDING */}
                                                        {order.status === 'pending' && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700"><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete Order</AlertDialogTitle>
                                                                        <AlertDialogDescription>Are you sure you want to delete Order #{order.id}?</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteOrder(order.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
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

            {/* Image Management Dialog */}
            {selectedOrderForImages && (
                <OrderImageManagerDialog 
                    order={selectedOrderForImages} 
                    onClose={() => setSelectedOrderForImages(null)} 
                />
            )}
        </>
    )
}
