/**
 * Pick the latest academic session (by endDate/startDate, then name).
 */
export function pickLatestSession(sessions) {
  if (!sessions?.length) return null
  const list = [...sessions]
  list.sort((a, b) => {
    const aEnd = new Date(a.endDate || a.EndDate || a.startDate || a.StartDate || 0).getTime()
    const bEnd = new Date(b.endDate || b.EndDate || b.startDate || b.StartDate || 0).getTime()
    if (bEnd !== aEnd) return bEnd - aEnd
    return String(b.sessionName || b.SessionName || '').localeCompare(
      String(a.sessionName || a.SessionName || '')
    )
  })
  return list[0]
}

export function pickLatestSessionId(sessions) {
  const s = pickLatestSession(sessions)
  if (!s) return ''
  return String(s.sessionId || s.SessionId || '')
}
