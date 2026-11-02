"""Render heyohjayy's real contribution calendar using the GitHub GraphQL API.

Standard library only. GITHUB_TOKEN is provided by GitHub Actions.
No source code or private repository names are fetched or published.
"""
import datetime as dt
import math
from collections import deque
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
import urllib.request
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
LOGIN = "heyohjayy"
QUERY = """query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date weekday contributionCount contributionLevel } }
      }
    }
  }
}"""
COLORS = {
    "NONE": "#e5eef6", "FIRST_QUARTILE": "#bfdef5",
    "SECOND_QUARTILE": "#79bfee", "THIRD_QUARTILE": "#328fce",
    "FOURTH_QUARTILE": "#086caf",
}


def snake_path():
    """A closed, adjacent cycle on a 54 x 7 board; never jump across the grid."""
    path = [(x, 0) for x in range(54)]
    for x in range(53, 0, -1):
        path.extend((x, y) for y in (range(1, 7) if x % 2 else range(6, 0, -1)))
    path.extend((0, y) for y in range(6, 0, -1))
    return path


def chase_plan(calendar):
    """A closed pursuit with safe adjacent steps and matching body at the seam."""
    body = [(11-i, 0) for i in range(12)]
    path, times, events = [body[0]], [0.0], []
    candidates = [(x, d['weekday']) for x, w in enumerate(calendar['weeks'])
                  for d in w['contributionDays'] if d['contributionCount'] > 0 and d['weekday'] > 0]

    def route(goal):
        blocked = set(body[:-1])
        queue = deque([(body[0], [])])
        seen = {body[0]}
        while queue:
            head, trail = queue.popleft()
            if head == goal:
                return trail
            neighbors = [(head[0]+dx, head[1]+dy) for dx, dy in [(1,0),(0,1),(-1,0),(0,-1)]]
            neighbors.sort(key=lambda p: abs(p[0]-goal[0])+abs(p[1]-goal[1]))
            for p in neighbors:
                if not (0 <= p[0] < 54 and 1 <= p[1] < 7) or p in blocked or p in seen:
                    continue
                seen.add(p)
                queue.append((p, trail+[p]))
        return None

    def advance(p, delay):
        if p != body[0]:
            assert abs(p[0]-body[0][0])+abs(p[1]-body[0][1]) == 1
            assert p not in body[:-1]
            body.insert(0, p)
            body.pop()
        path.append(p)
        times.append(times[-1]+delay)

    advance((11, 1), .18)
    previous = None
    for turn in range(min(10, len(candidates))):
        choices = [p for p in candidates if p not in body and p != previous]
        choices.sort(key=lambda p: (abs(abs(p[0]-body[0][0])+abs(p[1]-body[0][1])-16), (p[0]*17+p[1]*31+turn*13)%53))
        for goal in choices:
            trail = route(goal)
            if trail:
                start = times[-1]
                for i, p in enumerate(trail):
                    advance(p, .10 if len(trail)-i <= 4 else .18)
                events.append((goal, start, times[-1]))
                advance(goal, .45)
                previous = goal
                break
    trail = route((0, 1))
    if trail is None:
        raise ValueError('Cannot close the chase safely')
    for p in trail:
        advance(p, .18)
    advance((0, 0), .18)
    for x in range(1, 12):
        advance((x, 0), .18)
    assert body == [(11-i, 0) for i in range(12)]
    return path, times, events


def render(calendar, animated=True):
    weeks = calendar["weeks"]
    if not weeks or len(weeks) > 54:
        raise ValueError("Unexpected calendar width")
    title = f'{calendar["totalContributions"]:,} contributions in the last year'
    path, times, events = chase_plan(calendar)
    period = times[-1]
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="252" viewBox="0 0 1200 252">',
             f'<title>{escape(LOGIN)}: {escape(title)}</title>',
             '<rect width="1200" height="252" rx="16" fill="#f8fbff"/>', '<defs>']
    bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
    for level, color in enumerate(COLORS.values()):
        parts.append(f'<pattern id="dither{level}" width="8" height="8" patternUnits="userSpaceOnUse">')
        for i, threshold in enumerate(bayer):
            if threshold < [0, 4, 8, 12, 16][level]:
                parts.append(f'<rect x="{(i % 4)*2}" y="{(i//4)*2}" width="1.3" height="1.3" fill="{color}"/>')
        parts.append('</pattern>')
    parts.extend(['</defs>',
             '<g font-family="Consolas,monospace" fill="#61778c" font-size="12">',
             '<text x="28" y="28" letter-spacing="2">I\'VE BEEN BUSY 😎</text>',
             f'<text x="1172" y="28" text-anchor="end">{escape(title)}</text>'])
    last_month = None
    for column, week in enumerate(weeks):
        for day in week["contributionDays"]:
            date = dt.date.fromisoformat(day["date"])
            x, y = 30 + column * 21, 62 + day["weekday"] * 20
            if date.month != last_month:
                if column or date.day <= 7:
                    parts.append(f'<text x="{x}" y="50">{date.strftime("%b")}</text>')
                last_month = date.month
            color = COLORS[day["contributionLevel"]]
            level = list(COLORS).index(day["contributionLevel"])
            tip = f'{date.isoformat()}: {day["contributionCount"]} contributions'
            parts.append(f'<g data-date="{day["date"]}" data-count="{day["contributionCount"]}" data-level="{day["contributionLevel"]}"><title>{tip}</title>')
            parts.append(f'<rect x="{x}" y="{y}" width="17" height="17" rx="3" fill="#e5eef6"/>')
            if level:
                parts.append(f'<rect x="{x}" y="{y}" width="17" height="17" rx="3" fill="url(#dither{level})">')
                if animated:
                    catches = [caught for goal, _, caught in events if goal == (column, day['weekday'])]
                    keys, opacity = [0.0], ['1']
                    for caught in catches:
                        keys.extend([max(0, caught-.001)/period, caught/period, min(period, caught+.6)/period, min(period, caught+2)/period])
                        opacity.extend(['1', '0', '0', '1'])
                    keys.append(1.0)
                    opacity.append('1')
                    parts.append(f'<animate attributeName="opacity" values="{";".join(opacity)}" keyTimes="{";".join(f"{t:.6f}" for t in keys)}" dur="{period:.3f}s" repeatCount="indefinite"/>')
                parts.append('</rect>')
            parts.append('</g>')
    if animated:
        for goal, start, caught in events:
            x, y = 38.5+goal[0]*21, 70.5+goal[1]*20
            keys = f'0;{start/period:.6f};{caught/period:.6f};1'
            # The target disappears exactly when the snake reaches its cell.
            parts.append(f'<g data-chase-target="true" opacity="0"><animate attributeName="opacity" values="0;1;0;0" keyTimes="{keys}" calcMode="discrete" dur="{period:.3f}s" repeatCount="indefinite"/><circle cx="{x}" cy="{y}" r="3" fill="#f5bf39"/><circle cx="{x}" cy="{y}" r="8" fill="none" stroke="#e7ae22" stroke-width="1.5"><animate attributeName="r" values="7;10;7" dur=".8s" repeatCount="indefinite"/></circle></g>')
            end = min(period, caught+.75)
            for i in range(14):
                angle = i*math.tau/14
                dx, dy = math.cos(angle)*32, math.sin(angle)*32
                keys = f'0;{(caught-.001)/period:.6f};{caught/period:.6f};{end/period:.6f};1'
                parts.append(f'<circle data-catch-burst="true" cx="{x}" cy="{y}" r="1.8" fill="#328fce" opacity="0"><animate attributeName="opacity" values="0;0;.9;0;0" keyTimes="{keys}" dur="{period:.3f}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 0;{dx:.2f} {dy:.2f};{dx:.2f} {dy:.2f}" keyTimes="{keys}" dur="{period:.3f}s" repeatCount="indefinite"/></circle>')
        # Every segment follows the head's actual trail, including the loop seam.
        initial = [(11-i, 0) for i in range(12)]
        bodies, current = [], initial[:]
        for point in path:
            if point != current[0]:
                current = [point]+current[:-1]
            bodies.append(current[:])
        for segment in range(11, -1, -1):
            values = ';'.join(f'{38.5+b[segment][0]*21} {70.5+b[segment][1]*20}' for b in bodies)
            keys = ';'.join(f'{t/period:.6f}' for t in times)
            radius = 6 if segment == 0 else 5 - segment*.15
            parts.append(f'<g data-snake-segment="{segment}"><animateTransform attributeName="transform" type="translate" values="{values}" keyTimes="{keys}" dur="{period:.3f}s" repeatCount="indefinite" calcMode="linear"/><circle r="{radius}" fill="{("#e43d48" if segment == 0 else "#ef6268" if segment%2 else "#bd293c")}"/>')
            if segment == 0:
                parts.append('<circle cx="2" cy="-2" r="1" fill="white"/><circle cx="2" cy="2" r="1" fill="white"/>')
            parts.append('</g>')
    parts.append('<text x="30" y="237">@heyohjayy / real GitHub activity</text>')
    parts.append('<text x="1014" y="237">Less</text>')
    for i, color in enumerate(COLORS.values()):
        parts.append(f'<rect x="{1054+i*19}" y="225" width="15" height="15" rx="3" fill="{color}"/>')
    parts.append('<text x="1156" y="237">More</text></g></svg>')
    return "\n".join(parts)


def write_outputs(calendar):
    for name, animated in [('contributions.svg', True), ('contributions-static.svg', False)]:
        target = ROOT / 'assets' / name
        temporary = target.with_suffix('.tmp')
        temporary.write_text(render(calendar, animated), encoding='utf-8')
        temporary.replace(target)
    (ROOT / 'site/contributions.json').write_text(json.dumps(calendar), encoding='utf-8')


def import_existing_svg(filename):
    """Reuse only dated, previously fetched activity when changing presentation offline."""
    root = ET.parse(filename).getroot()
    ns = '{http://www.w3.org/2000/svg}'
    title = root.find(ns+'title').text
    total = int(re.search(r'([\d,]+) contributions', title).group(1).replace(',', ''))
    weeks = {}
    for rect in root.iter(ns+'rect'):
        tip = rect.find(ns+'title')
        if tip is None or not re.match(r'\d{4}-\d{2}-\d{2}:', tip.text or ''):
            continue
        date, count = tip.text.split(': ', 1)
        column = round((float(rect.get('x'))-30)/21)
        level = next(k for k, v in COLORS.items() if v == rect.get('fill'))
        weeks.setdefault(column, []).append({'date':date, 'weekday':dt.date.fromisoformat(date).isoweekday()%7,
            'contributionCount':int(count.split()[0]), 'contributionLevel':level})
    if not weeks:
        raise ValueError('Expected the original dated contribution SVG; no activity was found')
    return {'totalContributions':total, 'weeks':[{'contributionDays':weeks[i]} for i in sorted(weeks)]}


def main():
    if len(sys.argv) == 3 and sys.argv[1] == '--from-svg':
        write_outputs(import_existing_svg(sys.argv[2]))
        print('Restyled previously fetched GitHub activity; counts and dates preserved')
        return
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise SystemExit("GITHUB_TOKEN is required. Run this through the included GitHub Actions workflow.")
    request = urllib.request.Request(
        "https://api.github.com/graphql",
        data=json.dumps({"query": QUERY, "variables": {"login": LOGIN}}).encode(),
        headers={"Authorization": f"bearer {token}", "Content-Type": "application/json", "User-Agent": "heyohjayy-profile"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        result = json.load(response)
    if result.get("errors"):
        raise SystemExit("GitHub GraphQL request failed; see the Actions run for account permissions.")
    user = result["data"]["user"]
    if not user:
        raise SystemExit("GitHub user not found")
    calendar = user["contributionsCollection"]["contributionCalendar"]
    write_outputs(calendar)
    print(f'Updated contribution calendar for {LOGIN}')


if __name__ == "__main__":
    main()
