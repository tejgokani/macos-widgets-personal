import subprocess, json, datetime, collections, os

GH = '/opt/homebrew/bin/gh'

now = datetime.datetime.now(datetime.timezone.utc)
since_dt = now - datetime.timedelta(days=60)
prev_dt = since_dt - datetime.timedelta(days=60)

env = {**os.environ, 'PATH': '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin'}

try:
    login = subprocess.run([GH, 'api', 'user', '-q', '.login'], capture_output=True, text=True, timeout=15, env=env).stdout.strip()
    r = subprocess.run(
        [GH, 'api', 'user/repos', '--paginate', '-q', f'.[] | select(.owner.login == "{login}") | .full_name'],
        capture_output=True, text=True, timeout=30, env=env
    )
    repos = [x.strip() for x in r.stdout.strip().split('\n') if x.strip()][:12]
except Exception:
    repos = []

day_counts = collections.defaultdict(int)
total = success = ms = ptotal = psuccess = pms = 0

for repo in repos:
    try:
        page = 1
        while True:
            r = subprocess.run(
                [GH, 'api', f'repos/{repo}/actions/runs?per_page=100&page={page}'],
                capture_output=True, text=True, timeout=20, env=env
            )
            if r.returncode != 0 or not r.stdout.strip():
                break
            data = json.loads(r.stdout)
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
                duration = run.get('run_duration_ms', 0) or 0
                concluded = run.get('conclusion') == 'success'
                if run_dt >= since_dt:
                    any_in_range = True
                    day_counts[run_dt.strftime('%Y-%m-%d')] += 1
                    total += 1
                    if concluded:
                        success += 1
                    ms += duration
                elif run_dt >= prev_dt:
                    any_in_range = True
                    ptotal += 1
                    if concluded:
                        psuccess += 1
                    pms += duration
            if len(runs) < 100 or not any_in_range:
                break
            page += 1
    except Exception:
        continue

max_count = max(day_counts.values()) if day_counts else 1

print(json.dumps({
    'days': dict(day_counts),
    'maxCount': max_count,
    'totalRuns': total,
    'successRate': round(success / total * 100, 1) if total else 0,
    'totalMinutes': ms // 60000,
    'prevTotalRuns': ptotal,
    'prevSuccessRate': round(psuccess / ptotal * 100, 1) if ptotal else 0,
    'prevTotalMinutes': pms // 60000,
}))
