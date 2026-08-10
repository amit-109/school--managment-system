import toast from 'react-hot-toast'
import apiClient from '../Auth/base'

async function loadLogoBase64(orgData) {
  let logoBase64 = ''
  const logoPath = orgData?.logo || orgData?.logoUrl || '/src/assets/logo.svg'
  if (!logoPath) return logoBase64

  if (logoPath.startsWith('data:image/')) return logoPath

  try {
    const logoUrl = logoPath.startsWith('http')
      ? logoPath
      : logoPath.startsWith('/')
        ? window.location.origin + logoPath
        : `${window.location.origin}/${logoPath}`
    const response = await fetch(logoUrl)
    const blob = await response.blob()
    logoBase64 = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch {
    logoBase64 = logoPath.startsWith('http')
      ? logoPath
      : window.location.origin + (logoPath.startsWith('/') ? logoPath : `/${logoPath}`)
  }
  return logoBase64
}

/**
 * Print fee receipt in invoice-style layout.
 * Amount = configured, Paid = this receipt, Balance = remaining after this payment.
 */
export async function printFeeReceipt(paymentData, orgData) {
  const header = paymentData?.header || {}
  const allocations = paymentData?.allocations || []
  const receiptNo = header.receiptNo || header.ReceiptNo || ''
  const paymentTarget = header.paymentTarget || header.PaymentTarget || 'TermFee'
  const paymentDate = header.paymentDate || header.PaymentDate
  const totalPaid = Number(header.totalPaidAmount ?? header.TotalPaidAmount ?? 0)
  const mode = header.paymentMode || header.PaymentMode || ''
  const referenceNo = header.referenceNo || header.ReferenceNo || ''
  const notes = header.notes || header.Notes || ''
  const concessionAmount = Number(header.concessionAmount ?? header.ConcessionAmount ?? 0)
  const classLabel = [header.className || header.ClassName, header.sectionName || header.SectionName]
    .filter(Boolean)
    .join(' - ')

  const logoBase64 = await loadLogoBase64(orgData)

  let sumConfigured = 0
  let sumPaid = 0
  let sumBalance = 0

  const lineRows = allocations.length
    ? allocations.map((a) => {
        const feeType = a.feeTypeName || a.FeeTypeName || (paymentTarget === 'OldFee' ? 'Old Fee' : 'Fee')
        const term = a.termName || a.TermName || ''
        const configured = Number(a.configuredAmount ?? a.ConfiguredAmount ?? a.allocatedAmount ?? a.AllocatedAmount ?? 0)
        const paid = Number(a.paidAmount ?? a.PaidAmount ?? a.allocatedAmount ?? a.AllocatedAmount ?? 0)
        const balance = Number(a.balanceAmount ?? a.BalanceAmount ?? Math.max(configured - paid, 0))
        sumConfigured += configured
        sumPaid += paid
        sumBalance += balance
        // Hide per-line Paid/Balance split only (highlighted bifurcation)
        return `
          <tr>
            <td>${feeType}${term ? ` (${term})` : ''}</td>
            <td class="amount">₹ ${configured.toFixed(2)}</td>
            <td class="amount"></td>
            <td class="amount"></td>
          </tr>`
      }).join('')
    : (() => {
        sumConfigured = totalPaid
        sumPaid = totalPaid
        sumBalance = 0
        return `
          <tr>
            <td>${paymentTarget === 'OldFee' ? 'Old Fee' : 'Fee Payment'}</td>
            <td class="amount">₹ ${totalPaid.toFixed(2)}</td>
            <td class="amount"></td>
            <td class="amount"></td>
          </tr>`
      })()

  const displayPaid = totalPaid > 0 ? totalPaid : sumPaid
  const totalLabel = paymentTarget === 'OldFee' ? 'TOTAL (Old Fee)' : 'TOTAL (Yearly Fee)'

  const bifurcationNote = paymentTarget === 'OldFee'
    ? 'Old Fee payment — full or partial; balance is amount still left.'
    : 'Yearly fee bifurcation — payment may be full or partial; split across fee types.'

  const showConcession = concessionAmount > 0 && paymentTarget !== 'OldFee'
  const cumulativePaid = Math.max(sumConfigured - sumBalance, 0)
  const netAfterConcession = Math.max(sumConfigured - concessionAmount, 0)
  const netBalance = Math.max(netAfterConcession - cumulativePaid, 0)

  const concessionRows = showConcession
    ? `
          <tr>
            <td colspan="3"><strong>Less: Concession</strong></td>
            <td class="amount"><strong>₹ ${concessionAmount.toFixed(2)}</strong></td>
          </tr>
          <tr class="total-row">
            <td colspan="3"><strong>Net after Concession</strong></td>
            <td class="amount"><strong>₹ ${netAfterConcession.toFixed(2)}</strong></td>
          </tr>
          <tr>
            <td colspan="3">Paid till date</td>
            <td class="amount">₹ ${cumulativePaid.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3">Paid on this receipt</td>
            <td class="amount">₹ ${displayPaid.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="3"><strong>Balance after Concession</strong></td>
            <td class="amount"><strong>₹ ${netBalance.toFixed(2)}</strong></td>
          </tr>`
    : ''

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    toast.error('Popup blocked. Allow popups to print receipt.')
    return
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${receiptNo}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: auto; }
        body {
          font-family: Arial, sans-serif;
          padding: 8mm;
          color: #333;
          font-size: 11px;
          line-height: 1.35;
          max-width: 210mm;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 8px;
        }
        .logo {
          max-height: 48px;
          max-width: 120px;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .org-info { text-align: right; font-size: 10px; }
        .org-name { font-size: 16px; font-weight: bold; color: #2563eb; margin-bottom: 2px; }
        .invoice-title {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          margin: 8px 0;
          color: #1e40af;
        }
        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 8px;
        }
        .detail-section h3 { font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151; }
        .detail-item { margin-bottom: 2px; font-size: 11px; }
        .detail-label { font-weight: 600; display: inline-block; width: 100px; }
        .fee-table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 11px; }
        .fee-table th, .fee-table td { border: 1px solid #d1d5db; padding: 5px 8px; text-align: left; }
        .fee-table th { background-color: #f3f4f6; font-weight: 600; }
        .fee-table .amount { text-align: right; white-space: nowrap; }
        .total-row { background-color: #f9fafb; font-weight: bold; }
        .status-badge { padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
        .status-paid { background-color: #dcfce7; color: #166534; }
        .note-box {
          margin-top: 6px;
          padding: 6px 10px;
          background-color: #f8fafc;
          border-left: 3px solid #3b82f6;
          font-size: 10px;
          color: #374151;
        }
        .footer { margin-top: 10px; text-align: center; font-size: 9px; color: #6b7280; }
        @media print {
          body { padding: 0; }
          .logo { display: block !important; }
          img { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
          .note-box, .fee-table th, .total-row, .status-paid {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <div>
          ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo">` : ''}
        </div>
        <div class="org-info">
          <div class="org-name">${orgData?.schoolName || orgData?.name || 'School Name'}</div>
          <div>${orgData?.address || ''}</div>
          <div>${[orgData?.phone, orgData?.email].filter(Boolean).join(' | ')}</div>
        </div>
      </div>

      <div class="invoice-title">FEE RECEIPT</div>

      <div class="invoice-details">
        <div class="detail-section">
          <h3>Receipt Details</h3>
          <div class="detail-item"><span class="detail-label">Receipt No:</span> ${receiptNo}</div>
          <div class="detail-item"><span class="detail-label">Payment Date:</span> ${paymentDate ? new Date(paymentDate).toLocaleDateString() : ''}</div>
          <div class="detail-item"><span class="detail-label">Payment Mode:</span> ${mode}</div>
          <div class="detail-item"><span class="detail-label">Status:</span> <span class="status-badge status-paid">Paid</span></div>
          ${referenceNo ? `<div class="detail-item"><span class="detail-label">Reference:</span> ${referenceNo}</div>` : ''}
        </div>
        <div class="detail-section">
          <h3>Student Details</h3>
          <div class="detail-item"><span class="detail-label">Name:</span> ${header.studentName || header.StudentName || ''}</div>
          <div class="detail-item"><span class="detail-label">Admission No:</span> ${header.admissionNo || header.AdmissionNo || ''}</div>
          <div class="detail-item"><span class="detail-label">Class:</span> ${classLabel || '—'}</div>
          <div class="detail-item"><span class="detail-label">Email:</span> ${header.email || header.Email || ''}</div>
          <div class="detail-item"><span class="detail-label">Phone:</span> ${header.phone || header.Phone || ''}</div>
        </div>
      </div>

      <table class="fee-table">
        <thead>
          <tr>
            <th>Fee Type</th>
            <th class="amount">Amount</th>
            <th class="amount">Paid Amount</th>
            <th class="amount">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${lineRows}
          <tr class="total-row">
            <td><strong>${totalLabel}</strong></td>
            <td class="amount"><strong>₹ ${sumConfigured.toFixed(2)}</strong></td>
            <td class="amount"><strong>₹ ${displayPaid.toFixed(2)}</strong></td>
            <td class="amount"><strong>₹ ${sumBalance.toFixed(2)}</strong></td>
          </tr>
          ${concessionRows}
        </tbody>
      </table>

      <div class="note-box"><strong>Note:</strong> ${bifurcationNote}</div>

      ${showConcession ? `
        <div class="note-box" style="border-left-color:#059669;">
          <strong>Concession:</strong> ₹ ${concessionAmount.toFixed(2)} is minus from the yearly fee
          (₹ ${sumConfigured.toFixed(2)} − ₹ ${concessionAmount.toFixed(2)} = ₹ ${netAfterConcession.toFixed(2)}).
          Remaining balance uses all payments till date (₹ ${cumulativePaid.toFixed(2)}), not only this receipt.
        </div>
      ` : ''}

      ${notes ? `
        <div class="note-box" style="border-left-color:#64748b;">
          <strong>Payment Notes:</strong> ${notes}
        </div>
      ` : ''}

      <div class="footer">
        <p>This is a computer generated receipt. No signature required.</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `

  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

/** Load payment + org and print */
export async function printPaymentById(paymentId) {
  const response = await apiClient.get(`/admin/fees/payments/${paymentId}`)
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to load receipt')
  }
  let orgData = null
  try {
    const orgResponse = await apiClient.get('/admin/org')
    if (orgResponse.data.success) orgData = orgResponse.data.data
  } catch {
    // optional
  }
  await printFeeReceipt(response.data.data, orgData)
}
