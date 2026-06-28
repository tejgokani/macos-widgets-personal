import json, datetime, collections, os, urllib.request, urllib.error

# Token stored locally, never committed
TOKEN_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.token')
try:
    with open(TOKEN_PATH) as f:
        TOKEN = f.read().strip()
except Exception:
    TOKEN = ''

HEADERS = {
    'Authorization': f'Bearer {TOKEN}',
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
}

def gh(path, params=''):
    url = f'https://api.github.com{path}{"?" + params if params else ""}'
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read())
    except Exception:
        return None

def gh_paginate(path, key=None):
    results = []
    page = 1
    while True:
        data = gh(path, f'per_page=100&page={page}')
        if not data:
            break
        items = data[key] if key else data
        if not items:
            break
        results.extend(items)
        if len(items) < 100:
            break
        page += 1
    return results

now = datetime.datetime.now(datetime.timezone.utc)
since_dt = now - datetime.timedelta(days=60)
prev_dt = since_dt - datetime.timedelta(days=60)

# Get authenticated user
user_data = gh('/user')
login = user_data.get('login', '') if user_data else ''

# Get ALL repos including private ones (requires repo scope)
repos_raw = gh_paginate('/user/repos', key=None)
repos = [r['full_name'] for r in repos_raw if isinstance(r, dict) and r.get('owner', {}).get('login') == login]

day_counts = collections.defaultdict(int)
total = success = ms = ptotal = psuccess = pms = 0

for repo in repos:
    page = 1
    while True:
        data = gh(f'/repos/{repo}/actions/runs', f'per_page=100&page={page}')
        if not data:
            break
        runs = data.get('workflow_runs', [])
        if not runs:
            break
        any_in_range = False
        for run in runs:
            dt_str = run.get('run_started_at') or run.get('created_at', '')
            if not dt_str:
                continue
            try:
                run_dt = datetime.datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
            except Exception:
                continue

            # Duration from timestamps
            duration = run.get('run_duration_ms', 0) or 0
            if not duration:
                try:
                    t0 = datetime.datetime.fromisoformat((run.get('run_started_at') or run.get('created_at', '')).replace('Z', '+00:00'))
                    t1 = datetime.datetime.fromisoformat(run.get('updated_at', '').replace('Z', '+00:00'))
                    duration = max(0, int((t1 - t0).total_seconds() * 1000))
                except Exception:
                    pass

            conclusion = run.get('conclusion')
            is_success = conclusion == 'success'

            if run_dt >= since_dt:
                any_in_range = True
                day_counts[run_dt.strftime('%Y-%m-%d')] += 1
                total += 1
                if is_success:
                    success += 1
                ms += duration
            elif run_dt >= prev_dt:
                any_in_range = True
                ptotal += 1
                if is_success:
                    psuccess += 1
                pms += duration

        if len(runs) < 100 or not any_in_range:
            break
        page += 1

max_count = max(day_counts.values()) if day_counts else 1

print(json.dumps({
    'days': dict(day_counts),
    'maxCount': max_count,
    'totalRuns': total,
    'totalMinutes': ms // 60000,
    'prevTotalRuns': ptotal,
    'prevTotalMinutes': pms // 60000,
}))
