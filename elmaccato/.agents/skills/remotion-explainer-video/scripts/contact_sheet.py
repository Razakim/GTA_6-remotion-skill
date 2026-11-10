#!/usr/bin/env python3
"""Make a temporary visual index for a subset of the media catalog."""
import argparse
import json
import re
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[4]
PUBLIC = PROJECT / "public"
CATALOG = PUBLIC / "assets/catalog/media.json"

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tag", help="match a catalog tag")
    parser.add_argument("--subject", help="match a subject value such as jason or vice-city")
    parser.add_argument("--limit", type=int, default=80)
    parser.add_argument("--output", type=Path, default=None, help="output JPEG path (default: /tmp)")
    args = parser.parse_args()

    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    items = []
    for entry in data.get("assets", []):
        if entry.get("type") != "image" or entry.get("availability") != "available":
            continue
        if args.tag and args.tag not in entry.get("tags", []):
            continue
        subject_values = {str(value) for values in entry.get("subjects", {}).values() if isinstance(values, list) for value in values}
        if args.subject and args.subject not in subject_values:
            continue
        path = PUBLIC / entry["path"]
        if path.is_file():
            items.append((entry, path))
    items = items[:max(1, args.limit)]
    if not items:
        raise SystemExit("Aucun candidat image ne correspond au filtre.")
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError as exc:
        raise SystemExit("Pillow est requis pour créer une planche-contact.") from exc

    columns, cell_w, cell_h = 4, 360, 250
    rows = (len(items) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_w, rows * cell_h), "#181731")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for index, (entry, path) in enumerate(items):
        image = Image.open(path).convert("RGB")
        image.thumbnail((cell_w - 16, 192))
        col, row = index % columns, index // columns
        x, y = col * cell_w + 8, row * cell_h + 8
        sheet.paste(image, (x, y))
        label = path.name
        draw.text((x, y + 198), label[:48], fill="#ffffff", font=font)
        meta = entry.get("description") or ", ".join(entry.get("tags", [])[:4]) or "sans description"
        draw.text((x, y + 216), meta[:52], fill="#e0c9da", font=font)

    suffix = args.tag or args.subject or "all"
    output = args.output or Path("/tmp") / f"elmaccato-contact-{re.sub(r'[^a-z0-9-]+', '-', suffix.lower())}.jpg"
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, quality=88)
    print(f"{len(items)} candidats → {output}")
    for entry, _ in items:
        print(f"{entry['id']}  {entry['path']}")

if __name__ == "__main__":
    main()
