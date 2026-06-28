import { React } from 'uebersicht'

export const command = `/opt/homebrew/bin/python3 "$HOME/Library/Application Support/Übersicht/widgets/clock-weather.widget/fetch.py" 2>/dev/null || echo '{}'`

export const refreshFrequency = 60 * 1000

export const className = `
  top: 40px;
  right: 40px;
  width: 720px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
`

const pad = n => String(n).padStart(2, '0')

const formatHour = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  let h = d.getHours(), m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${pad(m)} ${ampm}`
}

const timeToMinutes = (dateStr) => {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  return d.getHours() * 60 + d.getMinutes()
}

const WMO_ICON = (code, isNight) => {
  if (code === 0) return isNight ? '🌙' : '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  return '⛈️'
}

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export const render = ({ output }) => {
  let data = { city:'', country:'', temp:0, condition:'', code:0, sunrise:'', sunset:'', nextEvent: null }
  try { if (output && output.trim()) data = JSON.parse(output) } catch (_) {}

  const now = new Date()
  const h = now.getHours(), m = now.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  const timeStr = `${h12}:${pad(m)}`
  const dayName = DAYS[now.getDay()]
  const dateStr = `${dayName}, ${now.getDate()} ${MONTHS[now.getMonth()]}`

  const nowMins = h * 60 + m
  const totalMins = 24 * 60
  const dayProgress = nowMins / totalMins

  const sunriseMins = timeToMinutes(data.sunrise)
  const sunsetMins = timeToMinutes(data.sunset)
  const midnightMins = totalMins

  const sunrisePos = sunriseMins / totalMins
  const noonPos = 0.5
  const sunsetPos = sunsetMins / totalMins

  const minsLeft = totalMins - nowMins
  const hLeft = Math.floor(minsLeft / 60)
  const minLeft = minsLeft % 60
  const pctComplete = Math.round(dayProgress * 100)

  const isNight = h < (sunriseMins / 60) || h >= (sunsetMins / 60)
  const weatherIcon = WMO_ICON(data.code, isNight)

  // Next event formatting
  const ev = data.nextEvent
  let evTitle = '', evTime = ''
  if (ev && ev.title) {
    evTitle = ev.title
    if (ev.start && ev.start.includes('T')) {
      const s = new Date(ev.start), e = new Date(ev.end)
      const fmt = d => { let h = d.getHours(), m = d.getMinutes(); const ap = h >= 12 ? 'PM' : 'AM'; h = h%12||12; return `${h}:${pad(m)} ${ap}` }
      evTime = `${fmt(s)} – ${fmt(e)}`
    } else {
      evTime = ev.start
    }
  }

  const glass = {
    background: 'rgba(12, 10, 38, 0.78)',
    border: '1px solid rgba(160,130,255,0.15)',
    borderRadius: '24px',
    padding: '28px 32px 26px',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    boxShadow: '0 16px 56px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)',
    color: '#fff',
  }

  // Circular progress ring
  const R = 28, CIRC = 2 * Math.PI * R
  const dash = pctComplete / 100 * CIRC
  const gap = CIRC - dash

  return (
    <div style={glass}>

      {/* ── Top row: clock + location/weather ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>

        {/* Clock */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '80px', fontWeight: '200', letterSpacing: '-4px', lineHeight: '1', color: '#fff' }}>
              {timeStr}
            </span>
            <span style={{ fontSize: '22px', fontWeight: '300', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
              {ampm}
            </span>
          </div>
          <div style={{ fontSize: '15px', color: 'rgba(200,185,255,0.65)', marginTop: '4px', fontWeight: '400', letterSpacing: '0.01em' }}>
            {dateStr}
          </div>
        </div>

        {/* Location + weather */}
        <div style={{ textAlign: 'right', paddingTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', marginBottom: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(155,130,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ fontSize: '14px', color: 'rgba(200,185,255,0.85)', fontWeight: '500' }}>
              {data.city}{data.country ? `, ${data.country}` : ''}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
            <span style={{ fontSize: '18px' }}>{weatherIcon}</span>
            <span style={{ fontSize: '14px', color: 'rgba(200,185,255,0.75)', fontWeight: '400' }}>
              {data.temp}° {data.condition}
            </span>
          </div>
        </div>
      </div>

      {/* ── Day progress bar ── */}
      <div style={{ marginBottom: '22px' }}>
        {/* Bar */}
        <div style={{ position: 'relative', height: '40px', marginBottom: '12px' }}>
          {/* Track pill */}
          <div style={{
            position: 'absolute', top: '50%', left: 0, right: 0,
            height: '36px', transform: 'translateY(-50%)',
            borderRadius: '18px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
            {/* Gradient fill up to current time */}
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: `${dayProgress * 100}%`,
              height: '100%',
              background: 'linear-gradient(to right, #f97316 0%, #ec4899 35%, #a855f7 65%, #6366f1 100%)',
              opacity: 0.55,
            }}/>
          </div>
          {/* Gradient line across full bar */}
          <div style={{
            position: 'absolute', top: '50%', left: '16px', right: '16px',
            height: '2px', transform: 'translateY(-50%)',
            background: 'linear-gradient(to right, #f97316, #ec4899 35%, #a855f7 65%, #4f46e5)',
            borderRadius: '1px',
          }}/>
          {/* Current time thumb */}
          <div style={{
            position: 'absolute', top: '50%',
            left: `calc(${dayProgress * 100}% - 10px)`,
            transform: 'translateY(-50%)',
            width: '20px', height: '20px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #c084fc, #818cf8)',
            boxShadow: '0 0 12px rgba(168,85,247,0.8), 0 0 24px rgba(168,85,247,0.4)',
            zIndex: 2,
          }}/>

          {/* Milestone dots on the line */}
          {[
            { pos: sunrisePos },
            { pos: noonPos },
            { pos: sunsetPos },
            { pos: 0.999 },
          ].map(({ pos }, i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%',
              left: `calc(${pos * 100}% - 3px)`,
              transform: 'translateY(-50%)',
              width: '6px', height: '6px', borderRadius: '50%',
              background: i === 0 ? '#fb923c' : i === 1 ? '#f472b6' : i === 2 ? '#fb923c' : '#818cf8',
              zIndex: 1,
            }}/>
          ))}
        </div>

        {/* Milestone labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0px' }}>
          {[
            { icon: '🌅', time: formatHour(data.sunrise), label: 'Sunrise', pos: sunrisePos },
            { icon: '☀️', time: '12:00 PM', label: 'Noon', pos: noonPos },
            { icon: '🌇', time: formatHour(data.sunset), label: 'Sunset', pos: sunsetPos },
            { icon: '🌙', time: '12:00 AM', label: 'Midnight', pos: 1 },
          ].map(({ icon, time, label }) => (
            <div key={label} style={{ textAlign: 'center', minWidth: '60px' }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{icon}</div>
              <div style={{ fontSize: '11px', color: 'rgba(220,210,255,0.85)', fontWeight: '500' }}>{time}</div>
              <div style={{ fontSize: '10px', color: 'rgba(175,160,245,0.5)', marginTop: '1px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: 'rgba(160,130,255,0.12)', marginBottom: '20px' }}/>

      {/* ── Bottom row: countdown + next event ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '0 24px', alignItems: 'center' }}>

        {/* Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {/* Dotted ring */}
          <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
            <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(160,130,255,0.2)" strokeWidth="3"
              strokeDasharray="3 4" strokeLinecap="round"/>
            <circle cx="32" cy="32" r={R} fill="none"
              stroke="url(#ring)" strokeWidth="3"
              strokeDasharray={`${dash} ${gap}`}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"/>
            <defs>
              <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f97316"/>
                <stop offset="100%" stopColor="#a855f7"/>
              </linearGradient>
            </defs>
          </svg>
          <div>
            <div style={{ fontSize: '26px', fontWeight: '600', color: '#fff', letterSpacing: '-0.5px', lineHeight: '1' }}>
              {hLeft}h {pad(minLeft)}m
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(200,185,255,0.6)', marginTop: '4px' }}>
              until midnight
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(155,130,255,0.85)', marginTop: '3px', fontWeight: '500' }}>
              Day is {pctComplete}% complete
            </div>
          </div>
        </div>

        {/* Vertical divider */}
        <div style={{ background: 'rgba(160,130,255,0.12)', height: '60px', width: '1px' }}/>

        {/* Next event */}
        <div style={{ paddingLeft: '8px' }}>
          {evTitle ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(155,130,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  <circle cx="12" cy="16" r="1" fill="rgba(155,130,255,0.8)"/>
                </svg>
                <span style={{ fontSize: '11px', color: 'rgba(175,160,245,0.6)', fontWeight: '500', letterSpacing: '0.02em' }}>
                  NEXT UP
                </span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '4px', lineHeight: '1.3' }}>
                {evTitle}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(200,185,255,0.6)' }}>{evTime}</div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(155,130,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span style={{ fontSize: '11px', color: 'rgba(175,160,245,0.6)', fontWeight: '500', letterSpacing: '0.02em' }}>
                  NEXT UP
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(175,160,245,0.4)', fontStyle: 'italic' }}>
                No upcoming events
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(155,130,255,0.4)', marginTop: '3px' }}>
                Grant Calendar access to enable
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
