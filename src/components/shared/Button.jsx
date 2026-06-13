import React from 'react'

const VARIANT_CLASSES = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  success: 'btn-success',
  warning: 'btn-warning',
  ghost: 'btn-ghost'
}

export default function Button({
  children,
  variant = 'primary',
  icon,
  className = '',
  type = 'button',
  ...props
}) {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${className}`.trim()}
      {...props}
    >
      {icon && <span className="btn-icon" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}
