import React, { useState } from 'react'
import Button from './Button'

const SearchIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const ClearIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default function SearchBar({
  value = '',
  onChange,
  onSearch,
  onClear,
  placeholder = 'Search...',
  searchLabel = 'Search',
  clearLabel = 'Clear',
  showClear = true,
  className = '',
  disabled = false
}) {
  const [internalValue, setInternalValue] = useState(value)
  const controlled = typeof onChange === 'function'
  const currentValue = controlled ? value : internalValue

  const updateValue = (nextValue) => {
    if (controlled) {
      onChange(nextValue)
    } else {
      setInternalValue(nextValue)
    }
  }

  const submitSearch = (event) => {
    event?.preventDefault()
    onSearch?.(currentValue.trim())
  }

  const clearSearch = () => {
    updateValue('')
    onClear?.()
  }

  return (
    <form
      className={`search-bar ${className}`.trim()}
      role="search"
      onSubmit={submitSearch}
    >
      <div className="search-input-wrap">
        <span className="search-input-icon" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={currentValue}
          onChange={(event) => updateValue(event.target.value)}
          placeholder={placeholder}
          className="search-input"
          disabled={disabled}
          aria-label={placeholder}
        />
        {currentValue && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5"
            aria-label={clearLabel}
          >
            <ClearIcon />
          </button>
        )}
      </div>
      <Button type="submit" variant="primary" disabled={disabled}>
        <SearchIcon />
        <span>{searchLabel}</span>
      </Button>
      {showClear && (
        <Button
          variant="ghost"
          onClick={clearSearch}
          disabled={disabled || !currentValue}
        >
          <ClearIcon />
          <span>{clearLabel}</span>
        </Button>
      )}
    </form>
  )
}