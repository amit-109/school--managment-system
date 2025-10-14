import React, { useMemo, useRef, useCallback, FC } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

interface ActionRendererProps {
  data: any;
  onEdit?: (data: any) => void;
  onView?: (data: any) => void;
  onDelete?: (data: any) => void;
}

const ActionRenderer: FC<ActionRendererProps> = ({ data, onEdit, onView, onDelete }) => {
  return (
    <div className="flex items-center gap-2 justify-center">
      {onView && (
        <button
          onClick={() => onView(data)}
          className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-800/50 text-primary-600 dark:text-primary-400 flex items-center justify-center transition-all duration-200 group"
          title="View"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      )}
      {onEdit && (
        <button
          onClick={() => onEdit(data)}
          className="w-8 h-8 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 hover:bg-secondary-200 dark:hover:bg-secondary-800/50 text-secondary-600 dark:text-secondary-400 flex items-center justify-center transition-all duration-200 group"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(data)}
          className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-600 dark:text-red-400 flex items-center justify-center transition-all duration-200 group"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
};

interface AgGridBoxProps {
  title: string;
  columnDefs: any[];
  rowData: any[];
  toolbar?: React.ReactNode;
  onEdit?: (data: any) => void;
  onView?: (data: any) => void;
  onDelete?: (data: any) => void;
  showActions?: boolean;
}

const AgGridBox: FC<AgGridBoxProps> = ({
  title,
  columnDefs,
  rowData,
  toolbar,
  onEdit,
  onView,
  onDelete,
  showActions = true
}) => {
  const gridRef = useRef<AgGridReact>(null);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 120,
    flex: 1,
  }), []);

  const finalColumnDefs = useMemo(() => {
    const cols = [...columnDefs];
    if (showActions && (onEdit || onView || onDelete)) {
      cols.push({
        headerName: 'Actions',
        field: 'actions',
        width: 140,
        minWidth: 140,
        maxWidth: 140,
        cellRenderer: (params: any) => (
          <ActionRenderer
            data={params.data}
            onEdit={onEdit}
            onView={onView}
            onDelete={onDelete}
          />
        ),
        cellClass: 'flex items-center justify-center',
        headerClass: 'text-center',
        sortable: false,
        filter: false,
        resizable: false,
      });
    }
    return cols;
  }, [columnDefs, onEdit, onView, onDelete, showActions]);

  const autoSizeAll = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const allIds: string[] = [];
    api.getColumns()?.forEach(c => allIds.push(c.getId()));
    api.autoSizeColumns(allIds, false);
  }, []);

  return (
    <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
      <header className="px-6 py-5 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-b border-slate-200 dark:border-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">
            📊
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{rowData?.length || 0} total records</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {toolbar}
          <button
            onClick={autoSizeAll}
            className="px-4 py-2.5 text-sm btn-secondary font-medium flex items-center gap-2"
            title="Auto-resize columns"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Auto-fit
          </button>
        </div>
      </header>
      <div className="p-6">
        <div className="ag-theme-quartz w-full overflow-hidden border border-slate-200 dark:border-slate-600 rounded-2xl shadow-inner">
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={finalColumnDefs}
            defaultColDef={defaultColDef}
            animateRows
            rowSelection="single"
            suppressCellFocus
            pagination
            paginationPageSize={10}
            paginationPageSizeSelector={[5, 10, 20, 50]}
            domLayout="autoHeight"
            onGridReady={(params) => {
              setTimeout(() => {
                autoSizeAll();
              }, 100);
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default AgGridBox;
