#!/usr/bin/env python3
"""File GTA VI screenshot downloads into the project's shared assets tree."""
import json
import hashlib
import re
import shutil
from collections import defaultdict
from pathlib import Path

ASSETS = Path(__file__).resolve().parents[1] / "public/assets"
INBOX = ASSETS / "_incoming/gta6"
SOURCE_LIST = ASSETS / "sources/gta6-screenshots.txt"
CATALOG = ASSETS / "catalog/gta6-screenshots.json"

CHARACTERS = {
    "jason": ("jason-duval", "gta-6-jason", "gta6-clip-jason"),
    "lucia": ("lucia-caminos", "gta-6-lucia", "gta6-clip-lucia"),
    "raul-bautista": ("raul-bautista",), "boobie-ike": ("boobie-ike",),
    "brian-heder": ("brian-heder",), "cal-hampton": ("cal-hampton",),
    "drequan-priest": ("drequan-priest",), "baeluxe": ("baeluxe",),
    "roxy": ("roxy",), "real-dimez": ("real-dimez",),
}
LOCATIONS = {
    "vice-city": ("vice-city", "vicecity"),
    "grassrivers": ("grassrivers",),
    "port-gellhorn": ("port-gellhorn", "portgellhorn"),
    "leonida-keys": ("leonida-keys", "leonidakeys"),
    "mount-kalaga": ("mount-kalaga", "mountkalaga"),
    "ambrosia": ("ambrosia",),
}
VEHICLE_MODELS = ("electric-fang", "grotti-cheetah", "vapid-buggy", "vapid-stanier",
                  "vapid-ganado", "stock-305", "squalo", "wyman-car", "rideout-customs",
                  "safehouse-vehicles", "car-bloomberg", "motorcycle", "one-eyed-willie")
WEAPON_WORDS = ("revolver", "weapon", "morgan-revolver")
EDITORIAL_WORDS = ("ultimateedition", "vintage-vicecitypack", "love-magazine",
                   "dazed", "edge-preview", "game-informer", "extendedlook", "postcard")

# Subjects checked against the image where the source filename is only a series label.
VISUAL_SUBJECTS = {
    "gta-6-edge-preview-screen-1-1080.jpg": {"characters": ("lucia",)},
    "gta-6-edge-preview-screen-3-1080.jpg": {"characters": ("jason",)},
    "gta-6-edge-preview-screen-6-1080.jpg": {"characters": ("jason", "lucia"), "weapons": ("firearm",)},
    "gta-6-edge-preview-screen-9-1080.jpg": {"characters": ("jason",), "vehicles": ("vehicle-unidentified",)},
    "gta-6-edge-preview-screen-10-1080.jpg": {"vehicles": ("motorcycle",)},
    "gta-6-edge-preview-screen-14-1080.jpg": {"locations": ("vice-city",)},
    "gta-6-flower-hurricane-justice-1080.jpg": {"vehicles": ("aircraft",)},
    "gta-6-game-informer-preview-screen-1-skyline-1080.jpg": {"locations": ("vice-city",)},
    "gta-6-game-informer-preview-screen-4-1080.jpg": {"vehicles": ("aircraft",), "locations": ("leonida-keys",)},
    "gta-6-game-informer-preview-screen-5-1080.jpg": {"vehicles": ("motorcycle",)},
    "gta-6-game-informer-preview-screen-6-1080.jpg": {"vehicles": ("train",)},
    "gta-6-game-informer-preview-screen-8-1080.jpg": {"characters": ("jason",)},
    "gta-6-love-magazine-diner-1080.jpg": {"characters": ("jason", "lucia")},
    "gta-6-screenshot-highway-aquarium-1080.jpg": {"vehicles": ("vehicle-unidentified",)},
    "gta-6-screenshot-ocean-drive-1080.jpg": {"vehicles": ("vehicle-unidentified",)},
    "gta6-clip-screenshot-07-1080.jpg": {"characters": ("jason", "lucia")},
    "gta6-screen-extendedlook-03-1080.jpg": {"characters": ("jason", "lucia"), "vehicles": ("vehicle-unidentified",)},
    "gta6-screen-extendedlook-05-1080.jpg": {"characters": ("jason",), "weapons": ("firearm",)},
    "gta6-screen-extendedlook-06-1080.jpg": {"characters": ("jason", "lucia")},
    "gta6-screen-extendedlook-09-1080.jpg": {"characters": ("lucia",)},
    "gta6-screen-extendedlook-17-ign-1080.jpg": {"characters": ("jason", "lucia"), "weapons": ("firearm",)},
    "gta6-screen-extendedlook-18-nyt-1080.jpg": {"characters": ("jason", "lucia")},
    "gta6-screen-extendedlook-20-1080.jpg": {"characters": ("jason", "lucia")},
    "gta6-screen-extendedlook-21-1080.jpg": {"characters": ("lucia",), "vehicles": ("vehicle-unidentified",)},
    "gta6-screenshot-dazed-boobieike-1080.jpg": {"characters": ("boobie-ike",)},
    "gta6-screenshot-dazed-raulbautista-1080.jpg": {"characters": ("raul-bautista",)},
    "real-dimez-01-1080.jpg": {"characters": ("baeluxe", "roxy")},
    "real-dimez-02-1080.jpg": {"characters": ("baeluxe", "roxy")},
    "real-dimez-03-1080.jpg": {"characters": ("baeluxe", "roxy")},
    "real-dimez-04-1080.jpg": {"characters": ("baeluxe", "roxy")},
}

def identify(filename):
    name = filename.lower()
    characters, locations, vehicles, weapons = set(), set(), set(), set()
    for slug, needles in CHARACTERS.items():
        if any(needle.replace("-", "") in name.replace("-", "") for needle in needles):
            characters.add(slug)
    if "jason-and-lucia" in name or "jason-lucia" in name:
        characters.update(("jason", "lucia"))
    for slug, needles in LOCATIONS.items():
        if any(needle in name for needle in needles):
            locations.add(slug)
    for model in VEHICLE_MODELS:
        if model in name:
            vehicles.add(model)
    if any(word in name for word in WEAPON_WORDS):
        weapons.add("weapon")
    visual = VISUAL_SUBJECTS.get(Path(filename).name, {})
    characters.update(visual.get("characters", ()))
    locations.update(visual.get("locations", ()))
    vehicles.update(visual.get("vehicles", ()))
    weapons.update(visual.get("weapons", ()))

    categories = set()
    if characters:
        categories.add("characters")
    if "real-dimez" in name:
        categories.add("gangs")
    if vehicles:
        categories.add("vehicles")
    if weapons:
        categories.add("weapons")
    if locations:
        categories.add("map")
    if any(word in name for word in EDITORIAL_WORDS):
        categories.add("editorials")
    if "screenshot" in name or "clip" in name or "screen" in name:
        categories.add("scenes")
    if not categories:
        categories.add("scenes")

    if "real-dimez" in name:
        primary = "gangs"
    elif characters:
        primary = "characters"
    elif weapons:
        primary = "weapons"
    elif vehicles:
        primary = "vehicles"
    elif locations:
        primary = "map"
    elif "editorials" in categories:
        primary = "editorials"
    else:
        primary = "scenes"
    return name, characters, locations, vehicles, weapons, categories, primary

def destination(info, filename):
    _, chars, _, vehicles, weapons, _, primary = info
    if primary == "characters":
        if chars == {"jason", "lucia"}:
            folder = "characters/shared"
        else:
            folder = "characters/" + sorted(chars)[0]
        return ASSETS / folder / "screenshots" / filename, folder
    if primary == "gangs":
        return ASSETS / "gangs/real-dimez/screenshots" / filename, "gangs/real-dimez"
    if primary == "vehicles":
        model = sorted(vehicles)[0] if vehicles else "unclassified"
        if model in {"motorcycle", "electric-fang"}:
            kind = "moto"
        elif model == "aircraft":
            kind = "aeronef"
        elif model == "train":
            kind = "rail"
        elif model == "squalo":
            kind = "bateau"
        elif model in {"vapid-buggy", "one-eyed-willie"}:
            kind = "tout-terrain"
        elif model in {"grotti-cheetah", "car-bloomberg"}:
            kind = "sport"
        elif model == "vapid-stanier":
            kind = "berline"
        elif model == "stock-305":
            kind = "muscle"
        elif model == "vapid-ganado":
            kind = "suv"
        else:
            kind = "autres"
        folder = f"vehicles/{kind}/{model}"
        return ASSETS / folder / filename, folder
    if primary == "weapons":
        kind = "pistolet" if any("revolver" in w or "weapon" in w for w in weapons) else "fusil"
        folder = f"weapons/{kind}"
        return ASSETS / folder / filename, folder
    if primary == "map":
        location = sorted(info[2])[0]
        folder = f"map/regions/{location}/screenshots"
        return ASSETS / folder / filename, folder
    folder = "editorials" if primary == "editorials" else "scenes"
    return ASSETS / folder / filename, folder

def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    (ASSETS / "sources").mkdir(exist_ok=True)
    old_root = ASSETS / "characters/gta6_screenshots"
    old_sources = old_root / "sources/urls.txt"
    if old_sources.exists():
        SOURCE_LIST.write_text(old_sources.read_text(encoding="utf-8"), encoding="utf-8")
    sources = {}
    if SOURCE_LIST.exists():
        sources = {Path(line.strip()).name: line.strip() for line in SOURCE_LIST.read_text(encoding="utf-8").splitlines() if line.strip()}

    # Keep an existing catalog when re-running; it preserves manual metadata and paths.
    old_entries = {}
    if CATALOG.exists():
        try:
            old_entries = {a["filename"]: a for a in json.loads(CATALOG.read_text(encoding="utf-8")).get("assets", [])}
        except (ValueError, KeyError):
            old_entries = {}
    image_files = []
    if old_root.exists():
        image_files += [p for p in old_root.rglob("*") if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}]
    if INBOX.exists():
        image_files += [p for p in INBOX.rglob("*") if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}]
    # Recover files already moved by an earlier catalog version; source-list membership
    # distinguishes this archive from unrelated assets in the same project tree.
    image_files += [p for p in ASSETS.rglob("*") if p.is_file()
                    and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
                    and p.name in sources]
    image_files += [ASSETS / a["path"] for a in old_entries.values()
                    if a.get("path") and (ASSETS / a["path"]).is_file()]
    entries = []
    seen = set()
    for src in sorted(image_files, key=lambda p: p.name):
        if src.name in seen:
            continue
        seen.add(src.name)
        info = identify(src.name)
        dest, folder = destination(info, src.name)
        dest.parent.mkdir(parents=True, exist_ok=True)
        if src.resolve() != dest.resolve():
            if dest.exists():
                src.unlink()
            else:
                shutil.move(str(src), str(dest))
        name, chars, locations, vehicles, weapons, categories, primary = info
        prior = old_entries.get(src.name, {})
        entries.append({
            "id": re.sub(r"[^a-z0-9]+", "-", Path(name).stem.lower()).strip("-"),
            "filename": src.name,
            "path": dest.relative_to(ASSETS).as_posix(),
            "source": sources.get(src.name) or prior.get("source"),
            "sha256": hashlib.sha256(dest.read_bytes()).hexdigest(),
            "bytes": dest.stat().st_size,
            "primary_category": primary,
            "categories": sorted(categories),
            "subjects": {
                "characters": sorted(chars), "locations": sorted(locations),
                "vehicles": sorted(vehicles), "weapons": sorted(weapons),
                "groups": ["real-dimez"] if "real-dimez" in name else [],
            },
            "metadata_status": ("visually-reviewed" if src.name in VISUAL_SUBJECTS else
                                "name-inferred" if chars or locations or vehicles or weapons else
                                "series-indexed"),
        })
    by_category = defaultdict(list)
    by_subject = defaultdict(list)
    for entry in entries:
        for category in entry["categories"]:
            by_category[category].append(entry["id"])
        for subject_type, subjects in entry["subjects"].items():
            for subject in subjects:
                by_subject[f"{subject_type.rstrip('s')}:{subject}"].append(entry["id"])
    CATALOG.write_text(json.dumps({"version": 2, "assets": entries,
                                   "by_category": dict(by_category),
                                   "by_subject": dict(by_subject)}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if old_root.exists():
        if old_sources.exists():
            old_sources.unlink()
        stale_catalog = old_root / "catalog.json"
        if stale_catalog.exists():
            stale_catalog.unlink()
        # The folder is intentionally left only if it contains non-image source material.
        for p in sorted(old_root.rglob("*"), reverse=True):
            if p.is_dir():
                try: p.rmdir()
                except OSError: pass
        try: old_root.rmdir()
        except OSError: pass
    print(f"Classés {len(entries)} fichiers; catalogue: {CATALOG.relative_to(ASSETS)}")

if __name__ == "__main__":
    main()
