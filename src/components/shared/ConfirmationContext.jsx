import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import Button from './Button'

const ConfirmationContext = createContext(null)

const WarningIcon = ({ variant }) => (
  <div className={`confirmation-icon confirmation-icon-${variant}`}>
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  </div>
)

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext)
  if (!context) {
    throw new Error('useConfirmation must be used within ConfirmationProvider')
  }
  return context
}

export const ConfirmationProvider = ({ children }) => {
  const resolverRef = useRef(null)
  const [dialog, setDialog] = useState(null)

  const closeDialog = useCallback((confirmed) => {
    resolverRef.current?.(confirmed)
    resolverRef.current = null
    setDialog(null)
  }, [])

  const confirm = useCallback((options) => {
    setDialog({
      title: 'Confirm Action',
      message: 'Do you want to continue?',
      detail: '',
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
      variant: 'warning',
      ...options
    })

    return new Promise((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  return (
    <ConfirmationContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="modal-backdrop z-[10020]" role="presentation" onMouseDown={() => closeDialog(false)}>
          <div
            className="confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            aria-describedby="confirmation-message"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="confirmation-body">
              <WarningIcon variant={dialog.variant} />
              <div>
                <h2 id="confirmation-title" className="confirmation-title">{dialog.title}</h2>
                <p id="confirmation-message" className="confirmation-message">{dialog.message}</p>
                {dialog.detail && <p className="confirmation-detail">{dialog.detail}</p>}
              </div>
            </div>
            <div className="confirmation-actions">
              <Button variant="secondary" onClick={() => closeDialog(false)}>
                {dialog.cancelLabel}
              </Button>
              <Button
                variant={dialog.variant === 'danger' ? 'danger' : 'primary'}
                onClick={() => closeDialog(true)}
              >
                {dialog.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  )
}
