"""Render heyohjayy's real contribution calendar using the GitHub GraphQL API.

Standard library only. GITHUB_TOKEN is provided by GitHub Actions.
No source code or private repository names are fetched or published.
"""
import datetime as dt
import json
import os
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


def render(calendar):
    weeks = calendar["weeks"]
    if not weeks or len(weeks) > 54:
        raise ValueError("Unexpected calendar width")
    title = f'{calendar["totalContributions"]:,} contributions in the last year'
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="234" viewBox="0 0 1200 234">',
             f'<title>{escape(LOGIN)}: {escape(title)}</title>',
             '<rect width="1200" height="234" rx="16" fill="#f8fbff"/>',
             '<g font-family="Consolas,monospace" fill="#61778c" font-size="12">',
             '<text x="28" y="28" letter-spacing="2">CONTRIBUTION.MAP</text>',
             f'<text x="1172" y="28" text-anchor="end">{escape(title)}</text>']
    last_month = None
    for column, week in enumerate(weeks):
        for day in week["contributionDays"]:
            date = dt.date.fromisoformat(day["date"])
            x, y = 30 + column * 21, 62 + day["weekday"] * 20
            if date.month != last_month:
                parts.append(f'<text x="{x}" y="50">{date.strftime("%b")}</text>')
                last_month = date.month
            color = COLORS[day["contributionLevel"]]
            tip = f'{date.isoformat()}: {day["contributionCount"]} contributions'
            parts.append(f'<rect x="{x}" y="{y}" width="17" height="17" rx="3" fill="{color}"><title>{tip}</title></rect>')
    parts.append('<text x="30" y="221">@heyohjayy / public profile activity</text>')
    parts.append('<text x="1014" y="221">Less</text>')
    for i, color in enumerate(COLORS.values()):
        parts.append(f'<rect x="{1054+i*19}" y="209" width="15" height="15" rx="3" fill="{color}"/>')
    parts.append('<text x="1156" y="221">More</text></g></svg>')
    return "\n".join(parts)


def main():
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
    svg = render(calendar)
    target = ROOT / "assets/contributions.svg"
    temporary = target.with_suffix(".tmp")
    temporary.write_text(svg, encoding="utf-8")
    temporary.replace(target)
    print(f'Updated contribution calendar for {LOGIN}')


if __name__ == "__main__":
    main()
