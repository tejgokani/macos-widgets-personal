import json, urllib.request, os, time, subprocess, datetime

CACHE = '/tmp/cw_weather_cache.json'
CACHE_TTL = 600  # re-fetch weather every 10 min

# ── Weather (cached) ──────────────────────────────────────────
weather = None
if os.path.exists(CACHE) and time.time() - os.path.getmtime(CACHE) < CACHE_TTL:
    try:
        with open(CACHE) as f:
            weather = json.load(f)
    except Exception:
        pass

if not weather:
    try:
        # Auto-detect location from IP
        with urllib.request.urlopen('https://ipapi.co/json/', timeout=8) as r:
            loc = json.loads(r.read())
        lat, lon = loc['latitude'], loc['longitude']
        city = loc.get('city', '')
        country = loc.get('country_code', '')

        url = (f'https://api.open-meteo.com/v1/forecast'
               f'?latitude={lat}&longitude={lon}'
               f'&current=temperature_2m,weather_code'
               f'&daily=sunrise,sunset'
               f'&timezone=auto&forecast_days=1')
        with urllib.request.urlopen(url, timeout=10) as r:
            wdata = json.loads(r.read())

        code = wdata['current']['weather_code']
        cond_map = {
            0:'Clear', 1:'Mostly Clear', 2:'Partly Cloudy', 3:'Overcast',
            45:'Foggy', 48:'Foggy', 51:'Light Drizzle', 53:'Drizzle',
            55:'Heavy Drizzle', 61:'Light Rain', 63:'Rain', 65:'Heavy Rain',
            71:'Light Snow', 73:'Snow', 75:'Heavy Snow', 80:'Showers',
            81:'Showers', 82:'Heavy Showers', 95:'Thunderstorm', 96:'Thunderstorm',
        }
        condition = cond_map.get(code, 'Cloudy')
        is_night = code == 0  # will be refined by time check

        weather = {
            'city': city, 'country': country,
            'temp': round(wdata['current']['temperature_2m']),
            'condition': condition,
            'code': code,
            'sunrise': wdata['daily']['sunrise'][0],   # "2026-06-29T05:57"
            'sunset':  wdata['daily']['sunset'][0],
        }
        with open(CACHE, 'w') as f:
            json.dump(weather, f)
    except Exception as e:
        weather = {'city':'', 'country':'', 'temp':0, 'condition':'', 'code':0,
                   'sunrise':'', 'sunset':'', 'error': str(e)}

# ── Calendar (always fresh) ───────────────────────────────────
next_event = None
try:
    script = '''
tell application "Calendar"
  set now to current date
  set cutoff to now + (24 * 60 * 60)
  set results to {}
  repeat with cal in calendars
    try
      set evts to (every event of cal whose start date >= now and start date <= cutoff)
      repeat with e in evts
        set results to results & {(summary of e) & "|" & ((start date of e) as string) & "|" & ((end date of e) as string)}
      end repeat
    end try
  end repeat
  return results
end tell'''
    r = subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=30)
    lines = [l.strip() for l in r.stdout.strip().split(',') if '|' in l]
    events = []
    for line in lines:
        parts = line.split('|')
        if len(parts) >= 3:
            title = parts[0].strip()
            try:
                # Parse "Sunday, 29 June 2026 at 12:00:00 PM"
                start_str = parts[1].strip()
                end_str = parts[2].strip()
                fmt = '%A, %d %B %Y at %I:%M:%S %p'
                start_dt = datetime.datetime.strptime(start_str, fmt)
                end_dt = datetime.datetime.strptime(end_str, fmt)
                events.append({'title': title, 'start': start_dt.isoformat(), 'end': end_dt.isoformat()})
            except Exception:
                events.append({'title': title, 'start': parts[1].strip(), 'end': parts[2].strip()})
    # Sort by start, take earliest
    events.sort(key=lambda x: x['start'])
    if events:
        next_event = events[0]
except Exception as e:
    next_event = {'title': '', 'start': '', 'end': '', 'error': str(e)}

print(json.dumps({**weather, 'nextEvent': next_event}))
