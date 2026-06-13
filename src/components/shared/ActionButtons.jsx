import React from 'react'

const ICONS = {
  view: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </>
  ),
  edit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
  print: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />,
  delete: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
}

const ActionButton = ({ action, label, onClick, icon }) => (
  <button
    type="button"
    className={`grid-action grid-action-${action}`}
    onClick={onClick}
    aria-label={label}
    title={label}
  >
    {icon || (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {ICONS[action]}
      </svg>
    )}
  </button>
)

export default function ActionButtons({
  data,
  onView,
  onEdit,
  onPrint,
  onDelete,
  viewTitle = 'View',
  viewIcon
}) {
  return (
    <div className="grid-actions">
      {onView && <ActionButton action="view" label={viewTitle} onClick={() => onView(data)} icon={viewIcon} />}
      {onEdit && <ActionButton action="edit" label="Edit" onClick={() => onEdit(data)} />}
      {onPrint && <ActionButton action="print" label="Print" onClick={() => onPrint(data)} />}
      {onDelete && <ActionButton action="delete" label="Delete" onClick={() => onDelete(data)} />}
    </div>
  )
}