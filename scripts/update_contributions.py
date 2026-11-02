"""Render heyohjayy's real contribution calendar using the GitHub GraphQL API.

Standard library only. GITHUB_TOKEN is provided by GitHub Actions.
No source code or private repository names are fetched or published.
"""
import datetime as dt
import math
import random
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
    allowed = {(x, d['weekday']) for x, w in enumerate(calendar['weeks']) for d in w['contributionDays']}
    start_x = min(x for x, y in allowed if y == 0)
    initial = [(start_x+11-i, 0) for i in range(12)]
    body = initial[:]
    path, times, events = [body[0]], [0.0], []
    candidates = sorted(p for p in allowed if p[1] > 0)
    min_x, max_x = min(x for x, _ in allowed), max(x for x, _ in allowed)
    zone = lambda p: min(2, (p[0]-min_x)*3//(max_x-min_x+1))
    rng = random.Random(1942+sum(ord(c) for c in calendar['weeks'][0]['contributionDays'][0]['date']))

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
                if p not in allowed or p[1] == 0 or p in blocked or p in seen:
                    continue
                seen.add(p)
                queue.append((p, trail+[p]))
        return None

    def advance(p, delay):
        assert p in allowed
        if p != body[0]:
            assert abs(p[0]-body[0][0])+abs(p[1]-body[0][1]) == 1
            assert p not in body[:-1]
            body.insert(0, p)
            body.pop()
        path.append(p)
        times.append(times[-1]+delay)

    advance((initial[0][0], 1), .18)
    previous = None
    # Ten main targets plus two left-side closing targets give four per third.
    zones = []
    for _ in range(2):
        group = [0, 1, 2]
        rng.shuffle(group)
        zones.extend(group)
    closing_balance = [1, 2, 1, 2]
    rng.shuffle(closing_balance)
    zones.extend(closing_balance)
    for turn, area in enumerate(zones):
        choices = [p for p in candidates if p not in body and p != previous and zone(p) == area]
        rng.shuffle(choices)
        for goal in choices:
            trail = route(goal)
            if trail:
                start = 0.0 if not events else times[-1]
                for i, p in enumerate(trail):
                    advance(p, .10 if len(trail)-i <= 4 else .18)
                events.append((goal, start, times[-1]))
                advance(goal, .45)
                previous = goal
                break
    goal = (start_x, 1)
    trail = route(goal)
    if trail is None:
        raise ValueError('Cannot close the chase safely')
    start = times[-1]
    for p in trail:
        advance(p, .18)
    events.append((goal, start, times[-1]))
    advance(goal, .45)
    start = times[-1]
    advance((start_x, 0), .18)
    for x in range(start_x+1, start_x+12):
        advance((x, 0), .18)
    events.append((initial[0], start, times[-1]))
    advance(initial[0], 1.1)
    assert body == initial
    return path, times, events


def render(calendar, animated=True):
    weeks = calendar["weeks"]
    if not weeks or len(weeks) > 54:
        raise ValueError("Unexpected calendar width")
    title = f'{calendar["totalContributions"]:,} contributions in the last year'
    path, times, events = chase_plan(calendar)
    period = times[-1]
    target_colors = json.loads((ROOT / 'site/chase-palette.json').read_text(encoding='utf-8'))
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
    parts.append('<clipPath id="calendar-area">')
    for row in range(7):
        columns = [x for x, w in enumerate(weeks) for d in w['contributionDays'] if d['weekday'] == row]
        if columns:
            parts.append(f'<rect x="{30+min(columns)*21}" y="{62+row*20}" width="{(max(columns)-min(columns))*21+17}" height="{17 if row == 6 else 20}"/>')
    parts.append('</clipPath>')
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
                        keys.extend([max(0, caught-.001)/period, caught/period, min(period*(1-.00003), caught+.6)/period, min(period*(1-.00002), caught+2)/period])
                        opacity.extend(['1', '0', '0', '1'])
                    keys.append(1.0)
                    opacity.append('1')
                    parts.append(f'<animate attributeName="opacity" values="{";".join(opacity)}" keyTimes="{";".join(f"{t:.6f}" for t in keys)}" dur="{period:.3f}s" repeatCount="indefinite"/>')
                parts.append('</rect>')
            parts.append('</g>')
    if animated:
        parts.append('<g data-chase-scene="true" clip-path="url(#calendar-area)" opacity="0"><animate attributeName="opacity" from="0" to="1" dur=".15s" fill="freeze"/>')
        for event_index, (goal, start, caught) in enumerate(events):
            tint = target_colors[event_index % len(target_colors)]
            fill, edge = tint['fill'], tint['edge']
            x, y = 38.5+goal[0]*21, 70.5+goal[1]*20
            target_keys = [0.0, caught/period, 1.0] if start == 0 else [0.0, start/period, caught/period, 1.0]
            target_values = '1;0;0' if start == 0 else '0;1;0;0'
            keys = ';'.join(f'{key:.6f}' for key in target_keys)
            # The target disappears exactly when the snake reaches its cell.
            parts.append(f'<g data-chase-target="{tint["name"]}" data-column="{goal[0]}" data-row="{goal[1]}" opacity="0"><animate attributeName="opacity" values="{target_values}" keyTimes="{keys}" calcMode="discrete" dur="{period:.3f}s" repeatCount="indefinite"/><circle cx="{x}" cy="{y}" r="17" fill="{fill}" opacity=".16"><animate attributeName="r" values="14;19;14" dur=".9s" repeatCount="indefinite"/></circle><circle cx="{x}" cy="{y}" r="4" fill="{fill}" stroke="{edge}"/><circle cx="{x}" cy="{y}" r="8" fill="none" stroke="{edge}" stroke-width="1.3"><animate attributeName="r" values="7;10;7" dur=".8s" repeatCount="indefinite"/></circle><g transform="translate({x} {y})"><g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3s" repeatCount="indefinite"/>')
            for sx, sy in [(13,0), (0,13), (-13,0), (0,-13)]:
                parts.append(f'<path d="M {sx-2.5} {sy} h 5 M {sx} {sy-2.5} v 5" fill="none" stroke="{edge}" stroke-width="1.4"/>')
            parts.append('</g></g></g>')
            end = min(period*(1-.00001), caught+1.1)
            burst_keys = f'0;{(caught-.001)/period:.6f};{caught/period:.6f};{end/period:.6f};1'
            for radius, stroke in [(52, fill), (33, edge)]:
                parts.append(f'<circle data-shockwave="true" cx="{x}" cy="{y}" r="5" fill="none" stroke="{stroke}" stroke-width="1.7" opacity="0"><animate attributeName="opacity" values="0;0;.8;0;0" keyTimes="{burst_keys}" dur="{period:.3f}s" repeatCount="indefinite"/><animate attributeName="r" values="5;5;5;{radius};{radius}" keyTimes="{burst_keys}" dur="{period:.3f}s" repeatCount="indefinite"/></circle>')
            for i in range(32):
                angle = i*math.tau/32
                spread = 58 if i%2 else 39
                dx, dy = math.cos(angle)*spread, math.sin(angle)*spread
                keys = f'0;{(caught-.001)/period:.6f};{caught/period:.6f};{end/period:.6f};1'
                parts.append(f'<circle data-catch-burst="true" cx="{x}" cy="{y}" r="{1.7+i%3*.4}" fill="{fill}" stroke="{edge}" stroke-width=".4" opacity="0"><animate attributeName="opacity" values="0;0;.9;0;0" keyTimes="{keys}" dur="{period:.3f}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 0;{dx:.2f} {dy:.2f};{dx:.2f} {dy:.2f}" keyTimes="{keys}" dur="{period:.3f}s" repeatCount="indefinite"/></circle>')
        # Every segment follows the head's actual trail, including the loop seam.
        initial = [(path[0][0]-i, path[0][1]) for i in range(12)]
        bodies, current = [], initial[:]
        for point in path:
            if point != current[0]:
                current = [point]+current[:-1]
            bodies.append(current[:])
        for segment in range(11, -1, -1):
            values = ';'.join(f'{38.5+b[segment][0]*21} {70.5+b[segment][1]*20}' for b in bodies)
            keys = ';'.join(f'{t/period:.6f}' for t in times)
            radius = 6 if segment == 0 else 5 - segment*.15
            color_keys = ';'.join(['0']+[f'{caught/period:.6f}' for _, _, caught in events]+['1'])
            def color_animation(attribute, field, initial):
                colors = [initial]+[target_colors[i%len(target_colors)][field] for i in range(len(events))]
                colors.append(colors[-1])
                return f'<animate attributeName="{attribute}" values="{";".join(colors)}" keyTimes="{color_keys}" calcMode="discrete" dur="{period:.3f}s" repeatCount="indefinite"/>'
            parts.append(f'<g data-snake-segment="{segment}"><animateTransform attributeName="transform" type="translate" values="{values}" keyTimes="{keys}" dur="{period:.3f}s" repeatCount="indefinite" calcMode="linear"/><circle data-snake-ink="true" r="{radius}" fill="#e43d48" stroke="#842133" stroke-width="1">{color_animation("fill", "fill", "#e43d48")}{color_animation("stroke", "edge", "#842133")}</circle>')
            glow_times, glow_values = [0.0], ['0']
            for _, _, caught in events:
                at = caught+segment*.038
                glow_times.extend([(at-.001)/period, at/period, (at+.35)/period])
                glow_values.extend(['0', '.7', '0'])
            glow_times.append(1.0)
            glow_values.append('0')
            parts.append(f'<circle r="{radius+2.5}" fill="none" stroke="#f5bf39" stroke-width="2" opacity="0">{color_animation("stroke", "fill", "#e43d48")}<animate attributeName="opacity" values="{";".join(glow_values)}" keyTimes="{";".join(f"{t:.6f}" for t in glow_times)}" dur="{period:.3f}s" repeatCount="indefinite"/></circle>')
            if segment == 0:
                eye_animation = color_animation('fill', 'eyes', '#ffffff')
                parts.append(f'<circle cx="2" cy="-2" r="1" fill="white">{eye_animation}</circle><circle cx="2" cy="2" r="1" fill="white">{eye_animation}</circle>')
            parts.append('</g>')
        parts.append('</g>')
    parts.append('<text x="30" y="237">@heyohjayy / real GitHub activity</text>')
    parts.append('<text x="1014" y="237">Less</text>')
    for i, color in enumerate(COLORS.values()):
        parts.append(f'<rect x="{1054+i*19}" y="225" width="15" height="15" rx="3" fill="{color}"/>')
    parts.append('<text x="1156" y="237">More</text></g></svg>')
    output = "\n".join(parts)
    if animated:
        # Delay the chase for a once-only greeting. All chase timelines share this origin.
        output = output.replace('<animate ', '<animate begin="3.2s" ').replace('<animateTransform ', '<animateTransform begin="3.2s" ')
        font = json.loads((ROOT / 'site/brick-font.json').read_text(encoding='utf-8'))
        greeting = ['<g data-greeting="true" opacity="0" clip-path="url(#calendar-area)"><title>Hello — catch me building.</title><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.56;1" dur="3.2s" fill="freeze"/>']
        size, brick = 5.5, 0
        for line_index, line in enumerate(['HELLO', 'CATCH ME BUILDING']):
            left, top = (1200-(len(line)*6-1)*size)/2, 83+line_index*50
            for char_index, letter in enumerate(line):
                for y, row in enumerate(font.get(letter, [])):
                    for x, pixel in enumerate(row):
                        if pixel != '1':
                            continue
                        dx, dy = math.sin(brick*2.399)*26, math.cos(brick*1.719)*22
                        greeting.append(f'<rect data-brick="true" x="{left+(char_index*6+x)*size:.2f}" y="{top+y*size:.2f}" width="{size*.8}" height="{size*.8}" fill="{("#0879c4" if line_index == 0 else "#375e7c")}"><animateTransform attributeName="transform" type="translate" from="0 0" to="{dx:.2f} {dy:.2f}" begin="1.8s" dur="1.4s" fill="freeze"/></rect>')
                        brick += 1
        greeting.append('</g>')
        output = output.replace('</svg>', ''.join(greeting)+'</svg>')
    return output


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
