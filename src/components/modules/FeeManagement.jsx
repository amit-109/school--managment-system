import React, { useState, useMemo } from 'react'
import AgGridBox from '../shared/AgGridBox'
import { demoFees } from '../../data/fees.js'

export default function FeeManagement() {
  const [activeTab, setActiveTab] = useState('collection')
  const [feeRows, setFeeRows] = useState(demoFees)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [showStructureModal, setShowStructureModal] = useState(false)
  const [feeForm, setFeeForm] = useState({ 
    studentId: '', student: '', cls: '', month: '', amount: '', paymentMode: 'Cash' 
  })
  const [structureForm, setStructureForm] = useState({
    class: '', tuitionFee: '', examFee: '', libraryFee: '', sportsFee: '', labFee: ''
  })

  // Fee Collection Columns
  const feeCols = useMemo(() => [
    { field: 'receipt', headerName: 'Receipt', maxWidth: 140 },
    { field: 'student', headerName: 'Student' },
    { field: 'cls', headerName: 'Class', maxWidth: 120 },
    { field: 'month', headerName: 'Month', maxWidth: 140 },
    { field: 'amount', headerName: 'Amount', valueFormatter: p => `₹ ${p.value}` },
    { field: 'paymentMode', headerName: 'Payment', maxWidth: 120 },
    { field: 'date', headerName: 'Date', maxWidth: 140 },
  ], [])

  // Fee Structure Columns
  const structureCols = useMemo(() => [
    { field: 'class', headerName: 'Class', maxWidth: 120 },
    { field: 'tuitionFee', headerName: 'Tuition (₹)', maxWidth: 120 },
    { field: 'examFee', headerName: 'Exam (₹)', maxWidth: 120 },
    { field: 'libraryFee', headerName: 'Library (₹)', maxWidth: 120 },
    { field: 'sportsFee', headerName: 'Sports (₹)', maxWidth: 120 },
    { field: 'labFee', headerName: 'Lab (₹)', maxWidth: 120 },
    { field: 'total', headerName: 'Total (₹)', valueFormatter: p => `₹ ${p.value}` },
  ], [])

  const [structureRows, setStructureRows] = useState([
    { class: '1st', tuitionFee: 1500, examFee: 200, libraryFee: 100, sportsFee: 150, labFee: 0, total: 1950 },
    { class: '2nd', tuitionFee: 1600, examFee: 200, libraryFee: 100, sportsFee: 150, labFee: 0, total: 2050 },
    { class: '9th', tuitionFee: 2500, examFee: 300, libraryFee: 150, sportsFee: 200, labFee: 300, total: 3450 },
    { class: '10th', tuitionFee: 2800, examFee: 400, libraryFee: 150, sportsFee: 200, labFee: 300, total: 3850 },
  ])

  const submitFee = () => {
    const id = `R-${Math.floor(1000 + Math.random() * 9000)}`
    const entry = {
      receipt: id,
      studentId: feeForm.studentId || 'SXXX',
      student: feeForm.student || 'Unknown',
      cls: feeForm.cls || '',
      month: feeForm.month || '',
      amount: Number(feeForm.amount) || 0,
      paymentMode: feeForm.paymentMode,
      date: new Date().toISOString().slice(0, 10),
    }
    setFeeRows(prev => [entry, ...prev])
    setShowFeeModal(false)
    setFeeForm({ studentId: '', student: '', cls: '', month: '', amount: '', paymentMode: 'Cash' })
  }

  const addStructure = () => {
    const total = Number(structureForm.tuitionFee) + Number(structureForm.examFee) + 
                  Number(structureForm.libraryFee) + Number(structureForm.sportsFee) + Number(structureForm.labFee)
    const entry = {
      class: structureForm.class,
      tuitionFee: Number(structureForm.tuitionFee),
      examFee: Number(structureForm.examFee),
      libraryFee: Number(structureForm.libraryFee),
      sportsFee: Number(structureForm.sportsFee),
      labFee: Number(structureForm.labFee),
      total
    }
    setStructureRows(prev => [entry, ...prev])
    setShowStructureModal(false)
    setStructureForm({ class: '', tuitionFee: '', examFee: '', libraryFee: '', sportsFee: '', labFee: '' })
  }

  const feeToolbar = (
    <button onClick={() => setShowFeeModal(true)} className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg">
      💰 Collect Fee
    </button>
  )

  const structureToolbar = (
    <button onClick={() => setShowStructureModal(true)} className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg">
      📋 Add Structure
    </button>
  )

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('collection')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'collection'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          💰 Fee Collection
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'structures'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          📋 Fee Structures
        </button>
      </div>

      {/* Content */}
      {activeTab === 'collection' && (
        <AgGridBox 
          title="Fee Collection" 
          columnDefs={feeCols} 
          rowData={feeRows} 
          toolbar={feeToolbar} 
        />
      )}

      {activeTab === 'structures' && (
        <AgGridBox 
          title="Fee Structures" 
          columnDefs={structureCols} 
          rowData={structureRows} 
          toolbar={structureToolbar} 
        />
      )}

      {/* Fee Collection Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xl p-4 space-y-3">
            <div className="text-lg font-semibold">💰 Collect Fee</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input 
                className="border rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-slate-600" 
                placeholder="Student ID" 
                value={feeForm.studentId} 
                onChange={e => setFeeForm(f => ({...f, studentId: e.target.value}))}
              />
              <input 
                className="border rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-slate-600" 
                placeholder="Student Name" 
                value={feeForm.student} 
                onChange={e => setFeeForm(f => ({...f, student: e.target.value}))}
              />
              <input 
                className="border rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-slate-600" 
                placeholder="Class (e.g., 10-A)" 
                value={feeForm.cls} 
                onChange={e => setFeeForm(f => ({...f, cls: e.target.value}))}
              />
              <input 
                className="border rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-slate-600" 
                placeholder="Month (e.g., Apr 2025)" 
                value={feeForm.month} 
                onChange={e => setFeeForm(f => ({...f, month: e.target.value}))}
              />
              <input 
                type="number" 
                className="border rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-slate-600" 
                placeholder="Amount (₹)" 
                value={feeForm.amount} 
                onChange={e => setFeeForm(f => ({...f, amount: e.target.value}))}
              />
              <select 
                className="border rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-slate-600" 
                value={feeForm.paymentMode} 
                onChange={e => setFeeForm(f => ({...f, paymentMode: e.target.value}))}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                className="px-3 py-1.5 border rounded-lg dark:border-slate-600" 
                onClick={() => setShowFeeModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg" 
                onClick={submitFee}
              >
                Collect Fee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Structure Modal */}
      {showStructureModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xl p-4 space-y-3">
            <div className="text-lg font-semibold">📋 Add Fee Structure</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input 
                className="border rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-slate-600" 
                placeholder="Class (e.g., 5th)" 
                value={structureForm.class} 
                onChange={e => setStructureForm(f => ({...f, class: e.target.value}))}
              />
              <input 
                type="number" 
                className="border rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-slate-600" 
                placeholder="Tuition Fee (₹)" 
                value={structureForm.tuitionFee} 
                onChange={e => setStructureForm(f => ({...f, tuitionFee: e.target.value}))}
              />
              <input 
                type="number" 
                className="border rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-slate-600" 
                placeholder="Exam Fee (₹)" 
                value={structureForm.examFee} 
                onChange={e => setStructureForm(f => ({...f, examFee: e.target.value}))}
              />
              <input 
                type="number" 
                className="border rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-slate-600" 
                placeholder="Library Fee (₹)" 
                value={structureForm.libraryFee} 
                onChange={e => setStructureForm(f => ({...f, libraryFee: e.target.value}))}
              />
              <input 
                type="number" 
                className="border rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-slate-600" 
                placeholder="Sports Fee (₹)" 
                value={structureForm.sportsFee} 
                onChange={e => setStructureForm(f => ({...f, sportsFee: e.target.value}))}
              />
              <input 
                type="number" 
                className="border rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-slate-600" 
                placeholder="Lab Fee (₹)" 
                value={structureForm.labFee} 
                onChange={e => setStructureForm(f => ({...f, labFee: e.target.value}))}
              />
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Total: ₹{(Number(structureForm.tuitionFee) + Number(structureForm.examFee) + 
                       Number(structureForm.libraryFee) + Number(structureForm.sportsFee) + 
                       Number(structureForm.labFee)).toLocaleString()}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                className="px-3 py-1.5 border rounded-lg dark:border-slate-600" 
                onClick={() => setShowStructureModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg" 
                onClick={addStructure}
              >
                Add Structure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}