import React, { useMemo, useState } from 'react'
import AgGridBox from '../shared/AgGridBox'
import { demoEmployees } from '../../data/employees.js'

export default function Employees() {
  const [rows, setRows] = useState(demoEmployees)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ id:'', name:'', role:'Teacher', subject:'', phone:'' })

  const cols = useMemo(()=>[
    { field:'id', headerName:'ID', maxWidth:120 },
    { field:'name', headerName:'Name' },
    { field:'role', headerName:'Role' },
    { field:'subject', headerName:'Subject' },
    { field:'phone', headerName:'Phone', maxWidth:160 },
  ],[])

  const addEmployee = ()=>{
    if(!form.id || !form.name) return;
    setRows(prev=>[{...form}, ...prev]);
    setShow(false);
    setForm({ id:'', name:'', role:'Teacher', subject:'', phone:'' });
  }

  const toolbar = (
    <div className="flex items-center gap-2">
      <button onClick={()=>setShow(true)} className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg">+ Add</button>
    </div>
  )

  return <>
    <AgGridBox title="Employees" columnDefs={cols} rowData={rows} toolbar={toolbar} />
    {show && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-xl p-4 space-y-3">
          <div className="text-lg font-semibold">Add Employee</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2" placeholder="ID" value={form.id} onChange={e=>setForm(f=>({...f,id:e.target.value}))}/>
            <input className="border rounded-lg px-3 py-2" placeholder="Full Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            <select className="border rounded-lg px-3 py-2" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
              <option>Teacher</option><option>Faculty</option><option>Staff</option>
            </select>
            <input className="border rounded-lg px-3 py-2" placeholder="Subject/Dept" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}/>
            <input className="border rounded-lg px-3 py-2" placeholder="Phone" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="px-3 py-1.5 border rounded-lg" onClick={()=>setShow(false)}>Cancel</button>
            <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg" onClick={addEmployee}>Save</button>
          </div>
        </div>
      </div>
    )}
  </>
}
