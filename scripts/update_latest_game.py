"""Refresh the latest publicly listed West Florida Flames GA Aspire Veo match."""
from datetime import datetime
from pathlib import Path
import json

from playwright.sync_api import sync_playwright

TEAM_URL = "https://app.veo.co/clubs/west-florida-flames-4/teams/2010-wff-dpl/recordings/"
OUTPUT = Path("data/latest-game.json")

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(TEAM_URL, wait_until="domcontentloaded", timeout=60000)
    page.locator("a.recording-item-clickable[href*='/matches/']").first.wait_for(timeout=45000)
    recordings = page.locator("a.recording-item-clickable[href*='/matches/']").evaluate_all(
        """links => links.map(link => ({
            url: link.href,
            title: link.querySelector('.recording-item-clickable-data-match-title p[title]')?.getAttribute('title'),
            date: link.querySelector('.recording-item-clickable-data-match-date')?.textContent?.trim(),
            thumbnail: link.querySelector('img.video-thumbnail')?.src
        }))"""
    )
    browser.close()

matches = []
for recording in recordings:
    try:
        date = datetime.strptime(recording["date"], "%b %d, %Y").date()
    except (TypeError, ValueError):
        continue
    if (
        recording["url"].startswith("https://app.veo.co/matches/")
        and recording["title"]
        and recording["thumbnail"]
    ):
        matches.append((date, recording))

if not matches:
    raise RuntimeError("No public Veo recordings found; retaining the previous match.")

date, latest = max(matches, key=lambda item: item[0])
result = {
    "title": latest["title"],
    "date": date.isoformat(),
    "url": latest["url"],
    "thumbnail": latest["thumbnail"],
    "teamUrl": TEAM_URL,
}
OUTPUT.parent.mkdir(exist_ok=True)
if not OUTPUT.exists() or json.loads(OUTPUT.read_text(encoding="utf-8")) != result:
    OUTPUT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"Updated latest game: {result['title']} ({result['date']})")
else:
    print("Latest game is unchanged.")
