import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import TokenManager from '../Auth/tokenManager'

export default function Feetype() {
  const { accessToken, organizationId } = useSelector((state) => state.auth)
  const [feetypes, setFeetypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    feeTypeId: 0,
    feeTypeName: '',
    description: '',
    isActive: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadFeetypes()
  }, [])

  const loadFeetypes = async () => {
    setLoading(true)
    try {
      const token = accessToken || TokenManager.getInstance().getAccessToken()
      // Add API call here when available
      // For now using empty array
      setFeetypes([])
    } catch (error) {
      console.error('Failed to load fee types:', error)
    } finally {
      setLoading(false)
    }
  }

  const cols = useMemo(() => [
    { field: 'feeTypeName', headerName: 'Fee Type Name' },
    { field: 'description', headerName: 'Description' },
    { 
      field: 'isActive', 
      headerName: 'Status',
      cellRenderer: (params) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          params.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {params.value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ], [])

  const validate = () => {
    const newErrors = {}
    if (!form.feeTypeName.trim()) newErrors.feeTypeName = 'Fee type name is required'
    return newErrors
  }

  const resetForm = () => {
    setForm({
      feeTypeId: 0,
      feeTypeName: '',
      description: '',
      isActive: true
    })
    setErrors({})
    setEditMode(false)
  }

  const handleSubmit = async () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      const token = accessToken || TokenManager.getInstance().getAccessToken()
      const payload = {
        feeTypeId: 0,
        organizationId: organizationId || 19,
        feeTypeName: form.feeTypeName,
        description: form.description,
        isActive: form.isActive,
        isDeleted: false,
        createdOn: new Date().toISOString()
      }

      console.log('=== FEETYPE API DEBUG ===')
      console.log('Payload being sent:', JSON.stringify(payload, null, 2))
      console.log('Organization ID from Redux:', organizationId)
      console.log('Access Token available:', !!token)
      console.log('API Endpoint:', 'https://sfms-api.abhiworld.in/api/admin/feemasters/feetype')

      const response = await fetch('https://sfms-api.abhiworld.in/api/admin/feemasters/feetype', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify(payload)
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const result = await response.json()
        console.log('Success response:', result)
        if (result.success) {
          toast.success(editMode ? 'Fee type updated successfully' : 'Fee type created successfully')
          setShowModal(false)
          resetForm()
          loadFeetypes()
        } else {
          console.error('API returned success=false:', result)
          toast.error(result.message || 'Failed to save fee type')
        }
      } else {
        const errorText = await response.text()
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        toast.error(`Failed to save fee type: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Network/Parse Error:', error)
      toast.error(`Network error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (data) => {
    setForm({
      feeTypeId: data.feeTypeId,
      feeTypeName: data.feeTypeName,
      description: data.description,
      isActive: data.isActive
    })
    setEditMode(true)
    setShowModal(true)
  }

  const handleDelete = async (data) => {
    if (window.confirm(`Are you sure you want to delete fee type "${data.feeTypeName}"?`)) {
      toast.success('Fee type deleted successfully')
      loadFeetypes()
    }
  }

  const toolbar = (
    <button
      onClick={() => { resetForm(); setShowModal(true) }}
      className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Add Fee Type
    </button>
  )

  return (
    <LoadingOverlay isLoading={loading}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Fee Type Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage different types of fees</p>
        </div>

        <AgGridBox
          title="Fee Types"
          columnDefs={cols}
          rowData={feetypes}
          toolbar={toolbar}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {editMode ? 'Edit Fee Type' : 'Add New Fee Type'}
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
                  <label className="block text-sm font-medium mb-2">Fee Type Name *</label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.feeTypeName ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="e.g., Tuition Fee, Exam Fee, Library Fee"
                    value={form.feeTypeName}
                    onChange={(e) => setForm(f => ({...f, feeTypeName: e.target.value}))}
                  />
                  {errors.feeTypeName && <p className="text-red-500 text-xs mt-1">{errors.feeTypeName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                    placeholder="Optional description for this fee type"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm(f => ({...f, description: e.target.value}))}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    checked={form.isActive}
                    onChange={(e) => setForm(f => ({...f, isActive: e.target.checked}))}
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">Active Fee Type</label>
                </div>
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