import React, { useMemo, useRef, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

export default function AgGridBox({ title, columnDefs, rowData, toolbar }) {
  const gridRef = useRef(null)
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 120,
    flex: 1,
  }), [])

  const autoSizeAll = useCallback(() => {
    const api = gridRef.current?.api
    if (!api) return
    const allIds = []
    api.getColumns()?.forEach(c => allIds.push(c.getId()))
    api.autoSizeColumns(allIds, false)
  }, [])

  return (
    <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-lg overflow-hidden">
      <header className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg">
            📊
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {toolbar}
          <button
            onClick={autoSizeAll}
            className="px-4 py-2 text-sm bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            Auto-fit
          </button>
        </div>
      </header>
      <div className="p-6">
        <div className="ag-theme-quartz w-full overflow-hidden border border-slate-200 dark:border-slate-600 rounded-xl shadow-inner">
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows
            rowSelection="single"
            suppressCellFocus
            pagination
            paginationPageSize={10}
            domLayout="autoHeight"
            onGridReady={(params) => {
              setTimeout(() => {
                autoSizeAll()
              }, 100)
            }}
          />
        </div>
      </div>
    </section>
  )
}
