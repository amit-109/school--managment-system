import React, { useState, useRef, useEffect, useMemo } from 'react'

export interface DropdownOption {
  label: string
  value: string | number
}

interface SearchableDropdownProps {
  options: DropdownOption[]
  value: string | number
  onChange: (value: string | number) => void
  placeholder?: string
  searchPlaceholder?: string
  allLabel?: string
  showAllOption?: boolean
  disabled?: boolean
  className?: string
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  allLabel = 'All',
  showAllOption = true,
  disabled = false,
  className = '',
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [isOpen])

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options
    const lower = searchTerm.toLowerCase()
    return options.filter(opt =>
      String(opt.label).toLowerCase().includes(lower)
    )
  }, [options, searchTerm])

  const selectedLabel = useMemo(() => {
    const found = options.find(opt => opt.value === value)
    return found ? found.label : placeholder
  }, [options, value, placeholder])

  const isAllSelected = value === '' || value === 'all'

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen)
            setSearchTerm('')
          }
        }}
        className={`w-full px-3 py-1.5 text-sm text-left border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between gap-2 ${
          isAllSelected ? 'text-slate-500' : ''
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden">
          <div className="p-1.5 border-b border-slate-200 dark:border-slate-600">
            <input
              ref={searchRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-2.5 py-1.5 text-sm border border-slate-300 dark:border-slate-500 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {showAllOption && (
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  setIsOpen(false)
                  setSearchTerm('')
                }}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-600 ${
                  isAllSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {allLabel}
              </button>
            )}
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                  setSearchTerm('')
                }}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-600 ${
                  opt.value === value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            )) : (
              <div className="px-3 py-2 text-sm text-slate-500">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}