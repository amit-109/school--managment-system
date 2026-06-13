import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import ActionButtons from './ActionButtons';
import Pagination, { PAGE_SIZE_OPTIONS } from './Pagination';

interface ActionRendererProps {
  data: any;
  onEdit?: (data: any) => void;
  onView?: (data: any) => void;
  onDelete?: (data: any) => void;
  onPrint?: (data: any) => void;
  viewTitle?: string;
  viewIcon?: React.ReactNode;
}

const ActionRenderer: FC<ActionRendererProps> = ({
  data,
  onEdit,
  onView,
  onDelete,
  onPrint,
  viewTitle = 'View',
  viewIcon
}) => (
  <ActionButtons
    data={data}
    onView={onView}
    onEdit={onEdit}
    onPrint={onPrint}
    onDelete={onDelete}
    viewTitle={viewTitle}
    viewIcon={viewIcon}
  />
);

interface AgGridBoxProps {
  title?: string;
  columnDefs: any[];
  rowData: any[];
  toolbar?: React.ReactNode;
  onEdit?: (data: any) => void;
  onView?: (data: any) => void;
  onDelete?: (data: any) => void;
  onPrint?: (data: any) => void;
  showActions?: boolean;
  viewTitle?: string;
  viewIcon?: React.ReactNode;
  serverPagination?: boolean;
  currentPage?: number;
  pageSize?: number;
  totalRecords?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pagination?: boolean;
  paginationPageSize?: number;
}

const AgGridBox: FC<AgGridBoxProps> = ({
  title,
  columnDefs,
  rowData,
  toolbar,
  onEdit,
  onView,
  onDelete,
  onPrint,
  showActions = true,
  viewTitle,
  viewIcon,
  serverPagination = false,
  currentPage = 1,
  pageSize = 10,
  totalRecords = 0,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
  pagination = true,
  paginationPageSize
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const initialPageSize = paginationPageSize || pageSize;
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(initialPageSize > 0 ? initialPageSize : 10);
  const [clientTotalRecords, setClientTotalRecords] = useState(rowData?.length || 0);

  const safeServerPage = currentPage > 0 ? currentPage : 1;
  const effectivePageSize = serverPagination ? (pageSize > 0 ? pageSize : 10) : clientPageSize;
  const effectiveCurrentPage = serverPagination ? safeServerPage : clientPage;
  const effectiveTotalRecords = serverPagination ? totalRecords : clientTotalRecords;

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 120,
    flex: 1,
  }), []);

  const finalColumnDefs = useMemo(() => {
    const columns = [...columnDefs];
    if (showActions && (onEdit || onView || onDelete || onPrint)) {
      columns.push({
        headerName: 'Actions',
        field: 'actions',
        width: 150,
        minWidth: 120,
        maxWidth: 180,
        cellRenderer: (params: any) => (
          <ActionRenderer
            data={params.data}
            onEdit={onEdit}
            onView={onView}
            onDelete={onDelete}
            onPrint={onPrint}
            viewTitle={viewTitle}
            viewIcon={viewIcon}
          />
        ),
        cellClass: 'flex items-center justify-center',
        headerClass: 'text-center',
        sortable: false,
        filter: false,
        resizable: false,
      });
    }
    return columns;
  }, [columnDefs, onEdit, onView, onDelete, onPrint, showActions, viewTitle, viewIcon]);

  const autoSizeAll = useCallback(() => {
    gridRef.current?.api.sizeColumnsToFit();
  }, []);

  const syncClientPagination = useCallback(() => {
    if (serverPagination) return;
    const api = gridRef.current?.api;
    if (!api) return;
    setClientPage(api.paginationGetCurrentPage() + 1);
    setClientTotalRecords(api.paginationGetRowCount());
  }, [serverPagination]);

  useEffect(() => {
    if (serverPagination) return;
    setClientTotalRecords(rowData?.length || 0);
    setClientPage(1);
    gridRef.current?.api?.paginationGoToFirstPage();
  }, [rowData, serverPagination]);

  const handlePageChange = useCallback((nextPage: number) => {
    if (serverPagination) {
      onPageChange?.(nextPage);
      return;
    }
    gridRef.current?.api?.paginationGoToPage(nextPage - 1);
    setClientPage(nextPage);
  }, [onPageChange, serverPagination]);

  const handlePageSizeChange = useCallback((nextSize: number) => {
    if (serverPagination) {
      onPageSizeChange?.(nextSize);
      return;
    }
    gridRef.current?.api?.setGridOption('paginationPageSize', nextSize);
    gridRef.current?.api?.paginationGoToFirstPage();
    setClientPageSize(nextSize);
    setClientPage(1);
  }, [onPageSizeChange, serverPagination]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-shadow duration-300 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-800 sm:rounded-3xl">
      <header className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-primary-50 to-secondary-50 px-4 py-4 dark:border-slate-600 dark:from-primary-900/20 dark:to-secondary-900/20 sm:px-6 sm:py-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 text-white shadow-lg sm:h-12 sm:w-12 sm:rounded-2xl">
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V9m5 10V5m5 14v-7m5 7V3" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 sm:text-xl">{title || 'Results'}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{effectiveTotalRecords} total records</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">{toolbar}</div>
      </header>

      <div className="p-3 sm:p-6">
        <div className="ag-theme-quartz w-full overflow-x-auto rounded-xl border border-slate-200 shadow-inner dark:border-slate-600 sm:rounded-2xl">
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={finalColumnDefs}
            defaultColDef={defaultColDef}
            animateRows
            rowSelection={{ mode: 'singleRow' }}
            suppressCellFocus
            pagination={pagination}
            paginationPageSize={effectivePageSize}
            paginationPageSizeSelector={pageSizeOptions}
            suppressPaginationPanel
            domLayout="autoHeight"
            onGridReady={() => {
              setTimeout(() => {
                autoSizeAll();
                syncClientPagination();
              }, 100);
            }}
            onPaginationChanged={syncClientPagination}
            onFilterChanged={syncClientPagination}
          />
        </div>
      </div>

      {pagination && (
        <Pagination
          currentPage={effectiveCurrentPage}
          pageSize={effectivePageSize}
          totalRecords={effectiveTotalRecords}
          pageSizeOptions={pageSizeOptions}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </section>
  );
};

export default AgGridBox;
