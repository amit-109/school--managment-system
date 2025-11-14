import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import apiClient from '../Auth/base'

export default function PaymentMethods() {
  const { organizationId } = useSelector((state) => state.auth)
  const [methods, setMethods] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  
  const [form, setForm] = useState({
    paymentMethodId: 0,
    methodType: 'QR',
    upiId: '',
    qrImageUrl: '',
    qrImageFile: null
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadMethods()
  }, [])

  const loadMethods = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/PaymentMethods/methods')
      if (response.data.success) {
        setMethods(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error)
      toast.error('Failed to load payment methods')
    } finally {
      setLoading(false)
    }
  }

  const QRCellRenderer = (params) => {
    if (params.data?.qrImageUrl && params.data.qrImageUrl !== '') {
      return (
        <button 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 rounded"
          onClick={() => handleViewQR(params.data)}
        >
          View QR
        </button>
      )
    }
    return <span className="text-gray-500 text-sm">N/A</span>
  }

  const cols = useMemo(() => [
    { field: 'paymentMethodId', headerName: 'ID', width: 80 },
    { field: 'methodType', headerName: 'Type', width: 120 },
    { 
      field: 'upiId', 
      headerName: 'UPI ID', 
      width: 250,
      valueGetter: (params) => params.data?.upiId || 'N/A'
    },
    { 
      field: 'qrImageUrl', 
      headerName: 'QR Image', 
      width: 120,
      cellRenderer: QRCellRenderer
    },
    { 
      field: 'isActive', 
      headerName: 'Status', 
      width: 100,
      valueGetter: (params) => params.data?.isActive ? 'Active' : 'Inactive'
    }
  ], [])

  const validate = () => {
    const newErrors = {}
    if (!form.methodType) newErrors.methodType = 'Method type is required'
    
    if (form.methodType === 'UPI') {
      if (!form.upiId) newErrors.upiId = 'UPI ID is required'
    } else if (form.methodType === 'QR') {
      if (!form.qrImageUrl && !form.qrImageFile) {
        newErrors.qrImage = 'QR image is required'
      }
    }
    
    return newErrors
  }

  const resetForm = () => {
    const hasQR = methods.some(method => method.methodType === 'QR')
    const hasUPI = methods.some(method => method.methodType === 'UPI')
    const defaultType = !hasQR ? 'QR' : !hasUPI ? 'UPI' : 'QR'
    
    setForm({
      paymentMethodId: 0,
      methodType: defaultType,
      upiId: '',
      qrImageUrl: '',
      qrImageFile: null
    })
    setErrors({})
    setEditMode(false)
  }

  const handleEdit = (method) => {
    setForm({
      paymentMethodId: method.paymentMethodId,
      methodType: method.methodType,
      upiId: method.upiId || '',
      qrImageUrl: method.qrImageUrl || '',
      qrImageFile: null
    })
    setEditMode(true)
    setShowModal(true)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      setForm(f => ({ ...f, qrImageFile: file, qrImageUrl: '' }))
    }
  }

  const uploadImage = async (file) => {
    try {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.onload = () => {
          // Compress image to max 800x800
          const maxSize = 800
          let { width, height } = img
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height
              height = maxSize
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to base64 with compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7)
          resolve(compressedDataUrl)
        }
        
        img.onerror = () => reject(new Error('Failed to load image'))
        
        const reader = new FileReader()
        reader.onload = (e) => {
          img.src = e.target.result
        }
        reader.readAsDataURL(file)
      })
    } catch (error) {
      throw new Error('Failed to upload image')
    }
  }

  const handleSubmit = async () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      let imageUrl = form.qrImageUrl

      // Upload image if file is selected
      if (form.qrImageFile) {
        imageUrl = await uploadImage(form.qrImageFile)
      }

      const payload = {
        paymentMethodId: form.paymentMethodId,
        methodType: form.methodType,
        upiId: form.methodType === 'UPI' ? form.upiId : '',
        qrImageUrl: form.methodType === 'QR' ? imageUrl : '',
        organizationId: organizationId
      }

      console.log('Sending payload:', payload)
      const response = await apiClient.post('/PaymentMethods/methods/upsert', payload, {
        timeout: 60000 // 60 seconds for large images
      })

      if (response.data.success) {
        toast.success(response.data.message || 'Payment method saved successfully!')
        setShowModal(false)
        resetForm()
        loadMethods()
      } else {
        toast.error(response.data.message || 'Failed to save payment method')
      }
    } catch (error) {
      console.error('Submit error:', error)
      console.error('Error response:', error.response?.data)
      toast.error(`Error: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleViewQR = (method) => {
    if (method.qrImageUrl && method.qrImageUrl !== '') {
      // Create modal to show QR image
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'
      modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">QR Code - ${method.methodType}</h3>
            <button class="close-btn p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="text-center">
            <img src="${method.qrImageUrl}" alt="QR Code" class="mx-auto max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg" style="max-height: 400px; max-width: 400px;" />
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Scan this QR code to make payment</p>
          </div>
        </div>
      `
      
      modal.querySelector('.close-btn').onclick = () => modal.remove()
      modal.onclick = (e) => e.target === modal && modal.remove()
      
      document.body.appendChild(modal)
    }
  }



  const hasQR = methods.some(method => method.methodType === 'QR')
  const hasUPI = methods.some(method => method.methodType === 'UPI')
  const canAddMore = !hasQR || !hasUPI

  const toolbar = (
    <button
      onClick={() => { resetForm(); setShowModal(true) }}
      disabled={!canAddMore}
      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
        canAddMore 
          ? 'bg-slate-900 text-white hover:bg-slate-800' 
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Add Payment Method
    </button>
  )

  return (
    <LoadingOverlay isLoading={loading}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Payment Methods</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage QR and UPI payment methods</p>
        </div>

        <AgGridBox
          title="Payment Methods"
          columnDefs={cols}
          rowData={methods}
          toolbar={toolbar}
          onEdit={handleEdit}
        />

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {editMode ? 'Edit Payment Method' : 'Add Payment Method'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Method Type *</label>
                  <select
                    value={form.methodType}
                    onChange={(e) => setForm(f => ({...f, methodType: e.target.value, upiId: '', qrImageUrl: '', qrImageFile: null}))}
                    disabled={editMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.methodType ? 'border-red-500' : 'border-slate-300'
                    } ${editMode ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                  >
                    {!editMode && !hasQR && <option value="QR">QR Code</option>}
                    {!editMode && !hasUPI && <option value="UPI">UPI ID</option>}
                    {editMode && <option value={form.methodType}>{form.methodType === 'QR' ? 'QR Code' : 'UPI ID'}</option>}
                  </select>
                  {errors.methodType && <p className="text-red-500 text-xs mt-1">{errors.methodType}</p>}
                </div>

                {form.methodType === 'UPI' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">UPI ID *</label>
                    <input
                      type="text"
                      value={form.upiId}
                      onChange={(e) => setForm(f => ({...f, upiId: e.target.value}))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                        errors.upiId ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="Enter UPI ID (e.g., school@oksbi)"
                    />
                    {errors.upiId && <p className="text-red-500 text-xs mt-1">{errors.upiId}</p>}
                  </div>
                )}

                {form.methodType === 'QR' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">QR Code Image *</label>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                      />
                      
                      {(form.qrImageUrl || form.qrImageFile) && (
                        <div className="mt-3">
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Preview:</p>
                          <img
                            src={form.qrImageFile ? URL.createObjectURL(form.qrImageFile) : form.qrImageUrl}
                            alt="QR Preview"
                            className="w-32 h-32 object-contain border rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                    {errors.qrImage && <p className="text-red-500 text-xs mt-1">{errors.qrImage}</p>}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editMode ? 'Update' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toaster position="top-right" />
    </LoadingOverlay>
  )
}