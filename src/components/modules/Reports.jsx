import React from 'react'

export default function Reports() {
  return (
    <section className="bg-white border rounded-2xl shadow-sm p-4">
      <h3 className="font-semibold mb-2">Reports</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="p-3 border rounded-xl">Class-wise Fee Collection (filter by class, date range)</div>
        <div className="p-3 border rounded-xl">Date-wise Fee Collection (daily/weekly/monthly)</div>
        <div className="p-3 border rounded-xl">Yearly Summary, Outstanding, Receipts export (CSV/PDF)</div>
      </div>
    </section>
  )
}
