// src/components/admin/staff-management-page.tsx
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Users, Edit, Trash2, Plus, Eye } from "lucide-react" // Added Eye icon

// Shadcn imports for the form and dialogs
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

// API types and client
import { ApiClient, type StaffMember, type CreateStaffRequest, type UpdateStaffRequest } from "@/lib/api"


// =================================================================
// STAFF DETAILS DIALOG (New Internal Component)
// =================================================================

interface StaffDetailsDialogProps {
    isOpen: boolean
    onClose: () => void
    staff: StaffMember | null
    isLoading: boolean
}

function StaffDetailsDialog({ isOpen, onClose, staff, isLoading }: StaffDetailsDialogProps) {
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const DetailItem = ({ label, value }: { label: string; value?: string | React.ReactNode }) => (
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-medium">{value || 'N/A'}</p>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* UPDATED: Added max-h and overflow classes for scrollability */}
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Staff Member Details</DialogTitle>
                    <DialogDescription>
                        Full details for {staff?.staff_name || '...'}
                    </DialogDescription>
                </DialogHeader>
                {isLoading ? (
                     <div className="flex items-center justify-center py-8">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                     </div>
                ) : staff ? (
                    <div className="space-y-4 py-4">
                        <DetailItem label="Full Name" value={staff.staff_name} />
                        <DetailItem label="Username / Email" value={staff.username} />
                        <DetailItem label="Role" value={<Badge variant="secondary" className="capitalize">{staff.role}</Badge>} />
                        <DetailItem label="Address" value={staff.address} />
                        <DetailItem label="Status" value={
                            <Badge variant={staff.status === 'active' ? 'default' : 'destructive'} className="capitalize bg-green-500 text-white hover:bg-green-600">
                                {staff.status}
                            </Badge>
                        } />
                        <DetailItem label="Image URL" value={staff.image ? <a href={staff.image} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{staff.image}</a> : 'No Image'} />
                        <DetailItem label="Created On" value={formatDate(staff.created_at)} />
                        <DetailItem label="Last Updated" value={formatDate(staff.updated_at)} />
                    </div>
                ) : (
                    <p className="text-center py-8 text-gray-500">Could not load staff details.</p>
                )}
            </DialogContent>
        </Dialog>
    );
}


// =================================================================
// STAFF FORM COMPONENT (Internal/Helper Component)
// =================================================================

interface StaffFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staff?: StaffMember | null
  mode: 'create' | 'edit'
}

function StaffForm({ isOpen, onClose, onSuccess, staff, mode }: StaffFormProps) {
  const [formData, setFormData] = useState<CreateStaffRequest>({
    staff_name: '',
    username: '',
    password: '',
    role: '',
    address: '',
    status: 'active',
    image: '',
  })
  const [isFormLoading, setIsFormLoading] = useState(false)
  const [error, setError] = useState('')

  // This useEffect hook handles initializing the form data when editing or resetting for creation
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && staff) {
        // Load existing staff data into the form state
        setFormData({
          staff_name: staff.staff_name,
          username: staff.username,
          password: '', // Password is empty for optional update
          role: staff.role,
          address: staff.address,
          status: staff.status,
          image: staff.image || '',
        } as CreateStaffRequest)
      } else {
        // Reset for 'create' mode
        setFormData({
          staff_name: '',
          username: '',
          password: '',
          role: '',
          address: '',
          status: 'active',
          image: '',
        })
      }
      setError('')
    }
  }, [isOpen, mode, staff])

  const handleInputChange = (field: keyof CreateStaffRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsFormLoading(true)
    setError('')

    try {
      
      if (mode === 'create') {
        if (!formData.password) {
             throw new Error('Password is required for new staff members.');
        }
        await ApiClient.createStaff(formData)
      } else if (mode === 'edit' && staff) {
        // Prepare data for update: remove password if empty
        const updateData: UpdateStaffRequest = { ...formData } as UpdateStaffRequest
        if (!updateData.password) {
          delete updateData.password
        }
        await ApiClient.updateStaff(staff.id, updateData)
      }
      
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsFormLoading(false)
    }
  }

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'crm', label: 'CRM' },
    { value: 'sales', label: 'Sales' },
    { value: 'project', label: 'Project' },
    { value: 'designer', label: 'Designer' },
    { value: 'printing', label: 'Printing' },
    { value: 'logistics', label: 'Logistics' },
    { value: 'hr', label: 'HR' },
    { value: 'accounts', label: 'Accountant' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Scrollable content on desktop: max-h-[80vh] and overflow-y-auto */}
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Staff Member' : 'Edit Staff Member'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Fill in the details to add a new staff member to the system.'
              : `Editing details for ${staff?.staff_name || 'staff member'}. Leave password blank to keep current.`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pb-4">
          
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="staff_name">Full Name</Label>
            <Input
              id="staff_name"
              value={formData.staff_name}
              onChange={(e) => handleInputChange('staff_name', e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          {/* Username/Email */}
          <div className="space-y-2">
            <Label htmlFor="username">Username/Email</Label>
            <Input
              id="username"
              type="email"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Enter username or email"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Password {mode === 'edit' && '(leave blank to keep current)'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Enter password"
              required={mode === 'create'}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter address"
              required
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
                value={formData.status} 
                onValueChange={(value: string) => handleInputChange('status', value as 'active' | 'inactive')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="image">Image URL (Optional)</Label>
            <Input
              id="image"
              type="url"
              value={formData.image}
              onChange={(e) => handleInputChange('image', e.target.value)}
              placeholder="Enter image URL"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isFormLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isFormLoading}>
              {isFormLoading ? 'Saving...' : mode === 'create' ? 'Add Staff' : 'Update Staff'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


// =================================================================
// STAFF MANAGEMENT PAGE (Main Export)
// =================================================================

export const StaffManagementPage: React.FC = () => {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Form state
    const [isStaffFormOpen, setIsStaffFormOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

    // View details state
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    const handleCloseForm = () => {
        setIsStaffFormOpen(false);
        setEditingStaff(null);
    }

    const reloadData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await ApiClient.getStaff(); 
            setStaff(data);
        } catch (err) {
            const errorMessage = err instanceof Error 
                ? err.message 
                : 'Failed to load staff data.'
            setError(errorMessage);
            setStaff([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        reloadData();
    }, [reloadData]);

    const handleAddStaff = () => {
        setEditingStaff(null) 
        setFormMode('create')
        setIsStaffFormOpen(true)
    }

    const handleEditStaff = async (id: number) => {
        setFormMode('edit');
        setIsStaffFormOpen(true);
        setIsLoading(true); 
        setEditingStaff(null); 

        try {
            const staffMember = await ApiClient.getStaffById(id);
            setEditingStaff(staffMember); 
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch staff details for editing.');
            handleCloseForm();
        } finally {
            setIsLoading(false);
        }
    }
    
    // New handler to view staff details
    const handleViewStaff = async (id: number) => {
        setIsViewModalOpen(true);
        setIsDetailsLoading(true);
        setViewingStaff(null);
        setError(''); 

        try {
            const staffDetails = await ApiClient.getStaffById(id);
            setViewingStaff(staffDetails);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch staff details.');
            setIsViewModalOpen(false);
        } finally {
            setIsDetailsLoading(false);
        }
    };


    const handleDeleteStaff = async (id: number) => {
        try {
            await ApiClient.deleteStaff(id)
            await reloadData()
            setError('')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete staff member')
        }
    }

    const handleFormSuccess = () => {
        reloadData();
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            <CardTitle>Staff Management</CardTitle>
                        </div>
                        <Button size="sm" onClick={handleAddStaff} className="bg-black hover:bg-gray-800 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Staff
                        </Button>
                    </div>
                    <CardDescription>Manage system staff members and their permissions</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600 font-medium">Error: {error}</p>
                        </div>
                    )}
                    
                    {isLoading && !isStaffFormOpen ? ( 
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-sm text-gray-500">Loading staff data...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {staff.length === 0 ? (
                                <div className="text-center py-8">
                                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No staff members found</p>
                                    <Button variant="outline" size="sm" className="mt-2" onClick={handleAddStaff}>
                                        Add First Staff Member
                                    </Button>
                                </div>
                            ) : (
                                staff.map((staffMember) => (
                                    <div
                                        key={staffMember.id}
                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg"
                                    >
                                        <div className="flex items-center space-x-3">
                                            {/* Staff Info */}
                                            <div className="flex flex-col">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium">{staffMember.staff_name}</p>
                                                    <Badge variant="secondary" className="text-xs capitalize">
                                                        {staffMember.role}
                                                    </Badge>
                                                    <Badge variant={staffMember.status === 'active' ? 'default' : 'destructive'} className="capitalize bg-green-500 text-white hover:bg-green-600">
                                                        {staffMember.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-500">{staffMember.username}</p>
                                                <p className="text-xs text-gray-400">{staffMember.address}</p>
                                            </div>
                                        </div>
                                        <div className="w-full sm:w-auto flex flex-wrap items-center justify-start sm:justify-end gap-2">
                                            {/* Actions */}
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleViewStaff(staffMember.id)}
                                            >
                                                <Eye className="h-4 w-4 mr-1" /> View
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleEditStaff(staffMember.id)}
                                                disabled={isLoading}
                                            >
                                                <Edit className="h-4 w-4 mr-1" /> Edit
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to permanently delete staff member {staffMember.staff_name}?
                                                            This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteStaff(staffMember.id)}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Staff Form Modal */}
            <StaffForm 
                isOpen={isStaffFormOpen}
                onClose={handleCloseForm}
                onSuccess={handleFormSuccess}
                staff={editingStaff}
                mode={formMode}
            />

            {/* Staff Details Modal */}
            <StaffDetailsDialog 
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                staff={viewingStaff}
                isLoading={isDetailsLoading}
            />
        </>
    );
};
