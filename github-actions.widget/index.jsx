export const command = `python3 "$HOME/Library/Application Support/Übersicht/widgets/github-actions.widget/fetch.py" 2>/dev/null || echo '{"days":{},"maxCount":1,"totalRuns":0,"successRate":0,"totalMinutes":0,"prevTotalRuns":0,"prevSuccessRate":0,"prevTotalMinutes":0}'`

export const refreshFrequency = 10 * 60 * 1000

export const className = `
  top: 40px;
  left: 40px;
  width: 820px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
`

// 5 purple intensity levels matching Catalina twilight palette
const LEVELS = [
  'rgba(255,255,255,0.04)',
  'rgba(80,62,180,0.38)',
  'rgba(100,78,200,0.58)',
  'rgba(125,100,225,0.78)',
  'rgba(155,135,252,1.00)',
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const getLevel = (count, max) => {
  if (!count) return 0
  const r = count / max
  if (r < 0.2) return 1
  if (r < 0.45) return 2
  if (r < 0.72) return 3
  return 4
}

const buildGrid = (daysData) => {
  const now = new Date()
  // Start ~9 weeks back, snapped to Monday
  const start = new Date(now)
  start.setDate(start.getDate() - 62)
  const dow = start.getDay()
  start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1))

  const weeks = []
  const cur = new Date(start)
  while (cur <= now) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const ds = cur.toISOString().slice(0, 10)
      week.push({ date: ds, count: daysData[ds] || 0, dow: cur.getDay(), month: cur.getMonth(), dom: cur.getDate(), future: cur > now })
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

const formatTime = (mins) => {
  if (!mins) return '0m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

const pctDelta = (cur, prev) => {
  if (!prev) return null
  return Math.round((cur - prev) / prev * 100)
}

const GitHubIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(200,185,255,0.8)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 4v6h6M23 20v-6h-6"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
)

const ChevronIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9l6 6 6-6"/>
  </svg>
)

const PlayIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(175,155,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(175,155,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(175,155,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

export const render = ({ output }) => {
  let data = { days: {}, maxCount: 1, totalRuns: 0, successRate: 0, totalMinutes: 0, prevTotalRuns: 0, prevSuccessRate: 0, prevTotalMinutes: 0 }
  try { if (output) data = JSON.parse(output) } catch (_) {}

  const weeks = buildGrid(data.days)
  const CELL = 14
  const GAP = 3

  // Month header labels: show label at first week a new month appears
  const monthLabels = {}
  weeks.forEach((week, wi) => {
    const firstDay = week[0]
    if (firstDay.dom <= 7) {
      if (!monthLabels[firstDay.month]) monthLabels[firstDay.month] = wi
    }
  })

  const runsDelta = pctDelta(data.totalRuns, data.prevTotalRuns)
  const rateDelta = pctDelta(data.successRate, data.prevSuccessRate)
  const timeDelta = pctDelta(data.totalMinutes, data.prevTotalMinutes)

  const statIconBg = 'rgba(115,88,255,0.18)'
  const cardBg = 'rgba(255,255,255,0.05)'
  const cardBorder = '1px solid rgba(255,255,255,0.07)'

  const Delta = ({ delta, invert }) => {
    if (delta === null || delta === undefined) return null
    const good = invert ? delta < 0 : delta > 0
    const neutral = delta === 0
    const color = neutral ? 'rgba(175,165,240,0.45)' : good ? '#4ade80' : '#f87171'
    const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : ''
    return (
      <div style={{ fontSize: '12px', color, fontWeight: '500', marginTop: '4px' }}>
        {arrow} {Math.abs(delta)}% vs previous 2 months
      </div>
    )
  }

  const stats = [
    { icon: <PlayIcon />, label: 'Total Runs', value: data.totalRuns.toLocaleString(), delta: runsDelta, invert: false },
    { icon: <CheckIcon />, label: 'Success Rate', value: `${data.successRate}%`, delta: rateDelta, invert: false },
    { icon: <ClockIcon />, label: 'Total Time', value: formatTime(data.totalMinutes), delta: timeDelta, invert: true },
  ]

  return (
    <div style={{
      background: 'rgba(10, 8, 32, 0.80)',
      border: '1px solid rgba(140,115,255,0.16)',
      borderRadius: '22px',
      padding: '24px 28px 22px',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      boxShadow: '0 12px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
      color: '#fff',
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #24292e 0%, #1a1f24 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid rgba(255,255,255,0.14)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            flexShrink: 0,
          }}>
            <GitHubIcon />
          </div>
          <div>
            <div style={{ fontSize: '19px', fontWeight: '600', color: '#fff', lineHeight: '1.25', letterSpacing: '-0.3px' }}>
              GitHub Actions
            </div>
            <div style={{ fontSize: '12.5px', color: 'rgba(175,160,245,0.62)', marginTop: '2px', letterSpacing: '0.01em' }}>
              Activity · Last 2 months
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.09)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <RefreshIcon />
          </div>
          <div style={{
            height: '32px', padding: '0 12px 0 14px',
            borderRadius: '9px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.09)',
            display: 'flex', alignItems: 'center', gap: '7px',
            cursor: 'pointer',
            fontSize: '12.5px', color: 'rgba(220,210,255,0.88)', fontWeight: '500',
            letterSpacing: '0.01em',
          }}>
            Last 2 Months
            <ChevronIcon />
          </div>
        </div>
      </div>

      {/* ── Heatmap ── */}
      <div>
        {/* Month labels row */}
        <div style={{ display: 'flex', marginBottom: '7px', paddingLeft: '34px' }}>
          <div style={{ display: 'flex', position: 'relative', width: `${weeks.length * (CELL + GAP) - GAP}px` }}>
            {Object.entries(monthLabels).map(([month, wi]) => (
              <div key={month} style={{
                position: 'absolute',
                left: `${wi * (CELL + GAP)}px`,
                fontSize: '11.5px',
                color: 'rgba(175,160,245,0.58)',
                fontWeight: '500',
                letterSpacing: '0.02em',
              }}>
                {MONTHS[parseInt(month)]}
              </div>
            ))}
          </div>
        </div>

        {/* Grid + day labels */}
        <div style={{ display: 'flex', gap: `${GAP}px`, alignItems: 'flex-start' }}>
          {/* Day labels (Mon, Wed, Fri, Sun) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px`, width: '28px', paddingTop: '1px', flexShrink: 0 }}>
            {[1,2,3,4,5,6,0].map(d => (
              <div key={d} style={{
                height: `${CELL}px`,
                fontSize: '10.5px',
                color: 'rgba(175,160,245,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                paddingRight: '4px',
                visibility: [1,3,5,0].includes(d) ? 'visible' : 'hidden',
                letterSpacing: '0.01em',
              }}>
                {DAY_LABELS[d]}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px`, flexShrink: 0 }}>
              {week.map((day) => {
                const level = day.future ? 0 : getLevel(day.count, data.maxCount)
                return (
                  <div
                    key={day.date}
                    title={day.future ? '' : `${day.date}: ${day.count} run${day.count !== 1 ? 's' : ''}`}
                    style={{
                      width: `${CELL}px`,
                      height: `${CELL}px`,
                      borderRadius: '3px',
                      background: LEVELS[level],
                      border: level === 0 ? '1px solid rgba(255,255,255,0.055)' : 'none',
                      flexShrink: 0,
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '12px', justifyContent: 'center' }}>
          <span style={{ fontSize: '11px', color: 'rgba(175,160,245,0.45)', marginRight: '3px' }}>Less</span>
          {LEVELS.map((bg, i) => (
            <div key={i} style={{
              width: `${CELL}px`, height: `${CELL}px`,
              borderRadius: '3px',
              background: bg,
              border: i === 0 ? '1px solid rgba(255,255,255,0.055)' : 'none',
              flexShrink: 0,
            }} />
          ))}
          <span style={{ fontSize: '11px', color: 'rgba(175,160,245,0.45)', marginLeft: '3px' }}>More</span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: 'rgba(140,115,255,0.14)', margin: '20px 0 18px' }} />

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {stats.map(({ icon, label, value, delta, invert }) => (
          <div key={label} style={{
            background: cardBg,
            borderRadius: '16px',
            padding: '15px 17px',
            border: cardBorder,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '11px' }}>
              <div style={{
                width: '30px', height: '30px',
                borderRadius: '8px',
                background: statIconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {icon}
              </div>
              <span style={{ fontSize: '12.5px', color: 'rgba(175,160,245,0.65)', fontWeight: '500', letterSpacing: '0.01em' }}>
                {label}
              </span>
            </div>
            <div style={{ fontSize: '27px', fontWeight: '700', color: '#fff', letterSpacing: '-0.8px', lineHeight: '1' }}>
              {value}
            </div>
            <Delta delta={delta} invert={invert} />
          </div>
        ))}
      </div>
    </div>
  )
}
