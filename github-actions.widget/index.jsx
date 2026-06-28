import { run } from 'uebersicht'

export const command = `/opt/homebrew/bin/python3 "$HOME/Library/Application Support/Übersicht/widgets/github-actions.widget/fetch.py" 2>/dev/null || echo '{"days":{},"maxCount":1,"totalRuns":0,"totalMinutes":0,"prevTotalRuns":0,"prevTotalMinutes":0}'`

export const refreshFrequency = 5 * 60 * 1000

export const className = `
  top: 40px;
  left: 40px;
  width: 336px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
`

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_LABELS = ['S','M','T','W','T','F','S']

const LEVELS = [
  'rgba(255,255,255,0.05)',
  'rgba(80,62,180,0.38)',
  'rgba(100,78,200,0.60)',
  'rgba(125,100,225,0.80)',
  'rgba(155,135,252,1.00)',
]

const getLevel = (count, max) => {
  if (!count) return 0
  // Log scale so outlier days don't wash out normal activity
  const r = Math.log(count + 1) / Math.log(max + 1)
  if (r < 0.25) return 1
  if (r < 0.5)  return 2
  if (r < 0.75) return 3
  return 4
}

const buildGrid = (daysData) => {
  const now = new Date()
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

const pctDelta = (cur, prev) => (!prev ? null : Math.round((cur - prev) / prev * 100))

export const render = ({ output }) => {
  let data = { days: {}, maxCount: 1, totalRuns: 0, totalMinutes: 0, prevTotalRuns: 0, prevTotalMinutes: 0 }
  try { if (output) data = JSON.parse(output) } catch (_) {}

  const weeks = buildGrid(data.days)
  const GAP = 2

  const monthLabels = {}
  weeks.forEach((week, wi) => {
    const d = week[0]
    if (d.dom <= 7 && monthLabels[d.month] === undefined) monthLabels[d.month] = wi
  })

  const runsDelta = pctDelta(data.totalRuns, data.prevTotalRuns)
  const timeDelta = pctDelta(data.totalMinutes, data.prevTotalMinutes)

  const Delta = ({ delta, invert }) => {
    if (delta === null || delta === undefined) return null
    const good = invert ? delta < 0 : delta > 0
    const color = delta === 0 ? 'rgba(175,165,240,0.45)' : good ? '#4ade80' : '#f87171'
    const arrow = delta > 0 ? '↑' : '↓'
    return (
      <div style={{ fontSize: '9px', color, fontWeight: '500', marginTop: '3px' }}>
        {arrow} {Math.abs(delta)}% vs prev 2 months
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Runs', value: data.totalRuns.toLocaleString(), delta: runsDelta, invert: false,
      icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(175,155,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    },
    {
      label: 'Total Time', value: formatTime(data.totalMinutes), delta: timeDelta, invert: true,
      icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(175,155,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    },
  ]

  return (
    <div style={{
      background: 'rgba(10, 8, 32, 0.82)',
      border: '1px solid rgba(140,115,255,0.16)',
      borderRadius: '16px',
      padding: '13px 14px 12px',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
      color: '#fff',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #24292e 0%, #1a1f24 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid rgba(255,255,255,0.14)', flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', letterSpacing: '-0.2px' }}>GitHub Actions</div>
            <div style={{ fontSize: '9.5px', color: 'rgba(175,160,245,0.62)', marginTop: '1px' }}>Activity · Last 2 months</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div
            onClick={() => run(command)}
            style={{
              width: '22px', height: '22px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.09)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(200,185,255,0.8)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
          </div>
          <div style={{
            height: '22px', padding: '0 7px 0 9px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.09)',
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '9.5px', color: 'rgba(220,210,255,0.88)', fontWeight: '500',
          }}>
            Last 2 Months
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
      </div>

      {/* Heatmap month labels */}
      <div style={{ display: 'grid', gridTemplateColumns: `14px ${GAP}px repeat(${weeks.length}, 1fr)`, marginBottom: '4px' }}>
        <div/><div/>
        {weeks.map((_, wi) => (
          <div key={wi} style={{ fontSize: '8.5px', color: 'rgba(175,160,245,0.58)', fontWeight: '500', overflow: 'visible', whiteSpace: 'nowrap' }}>
            {Object.entries(monthLabels).find(([, w]) => w === wi) ? MONTHS[parseInt(Object.entries(monthLabels).find(([, w]) => w === wi)[0])] : ''}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `14px ${GAP}px repeat(${weeks.length}, 1fr)`, gap: `${GAP}px 0` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
          {[1,2,3,4,5,6,0].map(d => (
            <div key={d} style={{
              fontSize: '8px', color: 'rgba(175,160,245,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              aspectRatio: '1',
              visibility: [1,3,5,0].includes(d) ? 'visible' : 'hidden',
            }}>
              {DAY_LABELS[d]}
            </div>
          ))}
        </div>
        <div/>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px`, paddingLeft: `${GAP}px` }}>
            {week.map((day) => {
              const level = day.future ? 0 : getLevel(day.count, data.maxCount)
              return (
                <div
                  key={day.date}
                  title={day.future ? '' : `${day.date}: ${day.count} run${day.count !== 1 ? 's' : ''}`}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: '2px',
                    background: LEVELS[level],
                    border: level === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '8px', justifyContent: 'center' }}>
        <span style={{ fontSize: '8.5px', color: 'rgba(175,160,245,0.45)', marginRight: '2px' }}>Less</span>
        {LEVELS.map((bg, i) => (
          <div key={i} style={{ width: '9px', height: '9px', borderRadius: '2px', background: bg, border: i === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none', flexShrink: 0 }} />
        ))}
        <span style={{ fontSize: '8.5px', color: 'rgba(175,160,245,0.45)', marginLeft: '2px' }}>More</span>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(140,115,255,0.14)', margin: '10px 0 9px' }} />

      {/* Stats — 2 cards only */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {stats.map(({ icon, label, value, delta, invert }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px', padding: '9px 10px',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '5px',
                background: 'rgba(115,88,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {icon}
              </div>
              <span style={{ fontSize: '9.5px', color: 'rgba(175,160,245,0.65)', fontWeight: '500' }}>{label}</span>
            </div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#fff', letterSpacing: '-0.4px', lineHeight: '1' }}>{value}</div>
            <Delta delta={delta} invert={invert} />
          </div>
        ))}
      </div>
    </div>
  )
}
