import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import apiClient from '../Auth/base'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import SearchBar from '../shared/SearchBar'
import SearchableDropdown from '../shared/SearchableDropdown'

interface TenantDetail {
  organizationId: number
  schoolName: string
  email: string
  phone: string
  planName: string
  startedAt: string
  expiresAt: string
  subscriptionStatus: string
  tenantStatus: string
  isActive: boolean
  userCount: number
}

interface PlanOption {
  planId: number
  planName: string
}

export default function TenantManagement() {
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tenantStatusFilter, setTenantStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailData, setDetailData] = useState<TenantDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    loadTenants()
  }, [currentPage, pageSize, searchTerm, statusFilter, tenantStatusFilter, planFilter])

  useEffect(() => {
    loadPlans()
  }, [])

  const loadTenants = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        pageNumber: currentPage.toString(),
        pageSize: pageSize.toString()
      })
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('subscriptionStatus', statusFilter)
      if (tenantStatusFilter) params.append('tenantStatus', tenantStatusFilter)
      if (planFilter) params.append('planId', planFilter)

      const response = await apiClient.get(`/superadmin?${params}`)
      if (response.data.success) {
        setTenants(response.data.data.tenants || [])
        setTotalCount(response.data.data.totalCount || 0)
      }
    } catch (error) {
      console.error('Failed to load tenants:', error)
      toast.error('Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }

  const loadPlans = async () => {
    try {
      const response = await apiClient.get('/superadmin/subscription/plans')
      if (response.data.success) {
        setPlans(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to load plans:', error)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (setter: any) => (e: any) => {
    setter(e.target.value)
    setCurrentPage(1)
  }

  const handleViewDetail = async (tenant: any) => {
    setDetailLoading(true)
    setShowDetailModal(true)
    try {
      const response = await apiClient.get(`/superadmin/tenant/${tenant.organizationId}`)
      if (response.data.success) {
        setDetailData(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load tenant detail:', error)
      toast.error('Failed to load tenant details')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleToggleStatus = async (tenant: any, newStatus: string) => {
    setLoading(true)
    try {
      const response = await apiClient.patch(`/superadmin/tenants/${tenant.organizationId}/status`, { newStatus })
      if (response.data.success) {
        toast.success(`Tenant ${newStatus === 'Active' ? 'activated' : 'blocked'} successfully`)
        setShowDetailModal(false)
        setDetailData(null)
        loadTenants()
      }
    } catch (error) {
      console.error('Failed to update tenant status:', error)
      toast.error('Failed to update tenant status')
    } finally {
      setLoading(false)
    }
  }

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'Blocked': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'Expired': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  const handleView = useCallback((data: any) => {
    handleViewDetail(data)
  }, [])

  const columns = useMemo(() => [
    { headerName: 'School Name', field: 'schoolName', sortable: true, flex: 2, minWidth: 180 },
    { headerName: 'Email', field: 'email', sortable: true, flex: 1.5, minWidth: 180 },
    { headerName: 'Phone', field: 'phone', sortable: true, flex: 1, minWidth: 130 },
    {
      headerName: 'Plan Name',
      field: 'planName',
      sortable: true,
      flex: 1,
      minWidth: 110,
      cellRenderer: (params: any) => {
        const plan = params.value || ''
        const style = plan === 'Premium' ? 'bg-purple-100 text-purple-800' :
                      plan === 'Enterprise' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>{plan}</span>
      }
    },
    {
      headerName: 'Plan Status',
      field: 'subscriptionStatus',
      sortable: true,
      flex: 1,
      minWidth: 110,
      cellRenderer: (params: any) => {
        const status = params.value || ''
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubscriptionStatusColor(status)}`}>{status}</span>
      }
    },
    {
      headerName: 'Tenant Status',
      field: 'tenantStatus',
      sortable: true,
      flex: 1,
      minWidth: 100,
      cellRenderer: (params: any) => {
        const s = params.value || ''
        if (s === 'Active') return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
        if (s === 'Pending') return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
        if (s === 'Blocked') return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Blocked</span>
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{s}</span>
      }
    },
    { headerName: 'Users', field: 'userCount', sortable: true, flex: 0.7, minWidth: 70 },
    { headerName: 'Teachers', field: 'teacherCount', sortable: true, flex: 0.7, minWidth: 80 },
    { headerName: 'Students', field: 'studentCount', sortable: true, flex: 0.7, minWidth: 80 },
    { headerName: 'Parents', field: 'parentCount', sortable: true, flex: 0.7, minWidth: 70 },
    {
      headerName: 'Created',
      field: 'createdOn',
      sortable: true,
      flex: 1,
      minWidth: 110,
      valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '-'
    }
  ], [])

  const toolbar = (
    <div className="flex flex-wrap items-center gap-3">
      <SearchableDropdown
        options={[
          { label: 'All Subscriptions', value: '' },
          { label: 'Active', value: 'Active' },
          { label: 'Expired', value: 'Expired' },
          { label: 'Cancelled', value: 'Cancelled' }
        ]}
        value={statusFilter}
        onChange={(val) => { setStatusFilter(String(val)); setCurrentPage(1) }}
        placeholder="All Subscriptions"
        allLabel="All Subscriptions"
        showAllOption={false}
        className="w-44"
      />

      <SearchableDropdown
        options={[
          { label: 'All Tenant Status', value: '' },
          { label: 'Pending', value: 'Pending' },
          { label: 'Active', value: 'Active' },
          { label: 'Blocked', value: 'Blocked' },
          { label: 'Expired', value: 'Expired' }
        ]}
        value={tenantStatusFilter}
        onChange={(val) => { setTenantStatusFilter(String(val)); setCurrentPage(1) }}
        placeholder="All Tenant Status"
        allLabel="All Tenant Status"
        showAllOption={false}
        className="w-44"
      />

      <SearchableDropdown
        options={[
          { label: 'All Plans', value: '' },
          ...plans.map(plan => ({ label: plan.planName, value: plan.planId }))
        ]}
        value={planFilter}
        onChange={(val) => { setPlanFilter(String(val)); setCurrentPage(1) }}
        placeholder="All Plans"
        allLabel="All Plans"
        showAllOption={false}
        className="w-44"
      />

      <SearchBar
        value={searchInput}
        onChange={setSearchInput}
        onSearch={handleSearch}
        onClear={() => { setSearchInput(''); handleSearch('') }}
        placeholder="Search by School, Email, Phone..."
      />
    </div>
  )

  const summaryStats = useMemo(() => {
    const active = tenants.filter((t: any) => t.tenantStatus === 'Active').length
    const blocked = tenants.filter((t: any) => t.tenantStatus === 'Blocked').length
    const pending = tenants.filter((t: any) => t.tenantStatus === 'Pending').length
    return { active, blocked, pending, total: tenants.length }
  }, [tenants])

  return (
    <LoadingOverlay isLoading={loading}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Tenant Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage multi-tenant operations, subscriptions, and system access</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summaryStats.active}</div>
            <div className="text-xs text-green-700 dark:text-green-300 mt-1 font-medium">This Page Active</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summaryStats.blocked}</div>
            <div className="text-xs text-red-700 dark:text-red-300 mt-1 font-medium">This Page Blocked</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summaryStats.pending}</div>
            <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 font-medium">This Page Pending</div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{summaryStats.total}</div>
            <div className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 font-medium">This Page</div>
          </div>
        </div>

        <AgGridBox
          title="Tenants"
          columnDefs={columns}
          rowData={tenants}
          showActions
          onView={handleView}
          viewTitle="View Details"
          toolbar={toolbar}
          serverPagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalRecords={totalCount}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        />

        {showDetailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tenant Details</h3>
                <button onClick={() => { setShowDetailModal(false); setDetailData(null) }} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {detailLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : detailData ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">{detailData.schoolName}</h4>
                    <p className="text-sm text-slate-500 mt-1">Organization ID: {detailData.organizationId}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider">Email</label>
                      <p className="font-medium text-sm">{detailData.email}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider">Phone</label>
                      <p className="font-medium text-sm">{detailData.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider">Plan</label>
                      <p className="font-medium text-sm">{detailData.planName}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider">Users</label>
                      <p className="font-medium text-sm">{detailData.userCount}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider">Started</label>
                      <p className="font-medium text-sm">{detailData.startedAt ? new Date(detailData.startedAt).toLocaleDateString() : '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider">Expires</label>
                      <p className="font-medium text-sm">{detailData.expiresAt ? new Date(detailData.expiresAt).toLocaleDateString() : '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider">Subscription Status</label>
                      <p><span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubscriptionStatusColor(detailData.subscriptionStatus)}`}>{detailData.subscriptionStatus}</span></p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider">Tenant Status</label>
                      <p><span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubscriptionStatusColor(detailData.tenantStatus || 'Pending')}`}>{detailData.tenantStatus || 'Pending'}</span></p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-4">No details available</p>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                {detailData && detailData.tenantStatus === 'Pending' ? (
                  <>
                    <button
                      onClick={() => handleToggleStatus({ organizationId: detailData.organizationId }, 'Active')}
                      className="flex-1 px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleToggleStatus({ organizationId: detailData.organizationId }, 'Blocked')}
                      className="flex-1 px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                    >
                      Block
                    </button>
                  </>
                ) : detailData && (
                  <button
                    onClick={() => handleToggleStatus({ organizationId: detailData.organizationId }, detailData.tenantStatus === 'Blocked' ? 'Active' : 'Blocked')}
                    className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${detailData.tenantStatus === 'Blocked' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {detailData.tenantStatus === 'Blocked' ? 'Activate' : 'Block'}
                  </button>
                )}
                <button
                  onClick={() => { setShowDetailModal(false); setDetailData(null) }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </LoadingOverlay>
  )
}