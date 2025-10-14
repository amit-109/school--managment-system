import React, { useMemo, useState } from 'react'
import AgGridBox from '../shared/AgGridBox'
import { demoFees } from '../../data/fees.js'

export default function Fees() {
  const [rows, setRows] = useState(demoFees)
  const [show, setShow] = useState(false)
  const [mode, setMode] = useState('monthly') // monthly | total | multi-month
  const [form, setForm] = useState({ studentId:'', student:'', cls:'', month:'', months:2, amount:0 })

  const cols = useMemo(()=>[
    { field:'receipt', headerName:'Receipt', maxWidth:140 },
    { field:'student', headerName:'Student' },
    { field:'cls', headerName:'Class', maxWidth:120 },
    { field:'month', headerName:'Month', maxWidth:140 },
    { field:'amount', headerName:'Amount', valueFormatter:p=>`₹ ${p.value}` },
    { field:'date', headerName:'Date', maxWidth:140 },
  ],[])

  const submitFee = ()=>{
    const id = `R-${Math.floor(1000 + Math.random()*9000)}`;
    let descMonth = form.month;
    if(mode==='total') descMonth = 'Full Year';
    if(mode==='multi-month') descMonth = `${form.months} months`;
    const entry = {
      receipt: id,
      studentId: form.studentId || 'SXXX',
      student: form.student || 'Unknown',
      cls: form.cls || '',
      month: descMonth || '',
      amount: Number(form.amount) || 0,
      date: new Date().toISOString().slice(0,10),
    };
    setRows(prev=>[entry, ...prev]);
    setShow(false);
    setForm({ studentId:'', student:'', cls:'', month:'', months:2, amount:0 });
  }

  const toolbar = (
    <div className="flex items-center gap-2">
      <select value={mode} onChange={e=>setMode(e.target.value)} className="border rounded-lg px-2 py-1 text-sm">
        <option value="monthly">Monthly</option>
        <option value="multi-month">Multi-month</option>
        <option value="total">Total (One-time)</option>
      </select>
      <button onClick={()=>setShow(true)} className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg">Submit Fee</button>
    </div>
  )

  return <>
    <AgGridBox title="Fees" columnDefs={cols} rowData={rows} toolbar={toolbar} />
    {show && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-xl p-4 space-y-3">
          <div className="text-lg font-semibold">Submit Fee</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2" placeholder="Student ID" value={form.studentId} onChange={e=>setForm(f=>({...f,studentId:e.target.value}))}/>
            <input className="border rounded-lg px-3 py-2" placeholder="Student Name" value={form.student} onChange={e=>setForm(f=>({...f,student:e.target.value}))}/>
            <input className="border rounded-lg px-3 py-2" placeholder="Class (e.g., 10-A)" value={form.cls} onChange={e=>setForm(f=>({...f,cls:e.target.value}))}/>
            {mode==='monthly' && <input className="border rounded-lg px-3 py-2" placeholder="Month (e.g., Apr 2025)" value={form.month} onChange={e=>setForm(f=>({...f,month:e.target.value}))}/>}
            {mode==='multi-month' && <input type="number" min={2} className="border rounded-lg px-3 py-2" placeholder="Number of months (min 2)" value={form.months} onChange={e=>setForm(f=>({...f,months:Number(e.target.value)}))}/>}
            <input type="number" className="border rounded-lg px-3 py-2" placeholder="Amount (₹)" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
          </div>
          <div className="flex justify-end gap-2 pt-2 text-sm text-slate-600">
            <button className="px-3 py-1.5 border rounded-lg" onClick={()=>setShow(false)}>Cancel</button>
            <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg" onClick={submitFee}>Submit</button>
          </div>
          <div className="text-xs text-slate-500">Policy examples: allow one-time total payment; set minimum months for multi-month (e.g., 2 or 3). Configure later in Settings.</div>
        </div>
      </div>
    )}
  </>
}
