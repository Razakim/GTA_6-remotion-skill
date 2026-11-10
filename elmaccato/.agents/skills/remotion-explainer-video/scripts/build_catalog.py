#!/usr/bin/env python3
"""Build/update the searchable media catalog for all Elmaccato public assets.

Run from any directory: python3 .agents/skills/remotion-explainer-video/scripts/build_catalog.py
Human-authored descriptions, tags, mood and framing are preserved across rebuilds.
"""
import hashlib
import json
import re
import shutil
import subprocess
from collections import defaultdict
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[4]
PUBLIC = PROJECT / "public"
ASSETS_CATALOG = PUBLIC / "assets/catalog/gta6-screenshots.json"
OUTPUT = PUBLIC / "assets/catalog/media.json"
MEDIA_TYPES = {
    ".jpg": "image", ".jpeg": "image", ".png": "image", ".webp": "image", ".avif": "image",
    ".mp4": "video", ".mov": "video", ".m4v": "video", ".webm": "video",
    ".mp3": "audio", ".wav": "audio", ".m4a": "audio", ".aac": "audio", ".ogg": "audio",
}

def load_json(path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return fallback

def probe_media(path):
    if not shutil.which("ffprobe"):
        return {}
    try:
        raw = subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries",
            "format=duration:stream=codec_type,width,height,avg_frame_rate",
            "-of", "json", str(path),
        ], stderr=subprocess.DEVNULL, timeout=15)
        info = json.loads(raw)
        video = next((stream for stream in info.get("streams", []) if stream.get("codec_type") == "video"), {})
        rate = video.get("avg_frame_rate", "0/1").split("/")
        fps = round(int(rate[0]) / int(rate[1]), 3) if len(rate) == 2 and int(rate[1]) else None
        duration = float(info.get("format", {}).get("duration", 0)) or None
        return {"width": video.get("width"), "height": video.get("height"), "fps": fps, "seconds": duration}
    except (OSError, ValueError, subprocess.SubprocessError, ZeroDivisionError):
        return {}

def main():
    if not PUBLIC.is_dir():
        raise SystemExit(f"Dossier public absent: {PUBLIC}")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    previous = load_json(OUTPUT, {"assets": []})
    old = {item.get("path"): item for item in previous.get("assets", []) if item.get("path")}
    gta = load_json(ASSETS_CATALOG, {"assets": []})
    gta_by_path = {f"assets/{item['path']}": item for item in gta.get("assets", []) if item.get("path")}

    entries = []
    for path in sorted(PUBLIC.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in MEDIA_TYPES:
            continue
        relative = path.relative_to(PUBLIC).as_posix()
        prior = old.get(relative, {})
        source = gta_by_path.get(relative, {})
        media_type = MEDIA_TYPES[path.suffix.lower()]
        entry = {
            "id": re.sub(r"[^a-z0-9]+", "-", relative.lower()).strip("-"),
            "path": relative,
            "type": media_type,
            "bytes": path.stat().st_size,
            "availability": "available" if path.stat().st_size > 0 else "empty",
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "description": prior.get("description", ""),
            "tags": sorted(set(prior.get("tags", [])) | set(source.get("categories", []))),
            "subjects": prior.get("subjects", source.get("subjects", {})),
            "mood": prior.get("mood", []),
            "framing": prior.get("framing", ""),
            "source": source.get("source", prior.get("source")),
            "metadata_status": prior.get("metadata_status", source.get("metadata_status", "needs-visual-review")),
        }
        if media_type == "image":
            try:
                from PIL import Image
                with Image.open(path) as image:
                    width, height = image.size
                entry.update(width=width, height=height, ratio=round(width / height, 3))
            except (ImportError, OSError, ZeroDivisionError):
                pass
        elif media_type in {"video", "audio"} and path.stat().st_size > 0:
            entry.update({k: v for k, v in probe_media(path).items() if v is not None})
        entries.append(entry)

    by_tag, by_subject = defaultdict(list), defaultdict(list)
    for entry in entries:
        for tag in entry["tags"]:
            by_tag[tag].append(entry["id"])
        for kind, values in entry["subjects"].items():
            for value in values if isinstance(values, list) else []:
                by_subject[f"{kind}:{value}"].append(entry["id"])
    payload = {"version": 1, "assets": entries, "by_tag": dict(by_tag), "by_subject": dict(by_subject)}
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    needs_review = sum(not item["description"] for item in entries)
    empty = sum(item["availability"] == "empty" for item in entries)
    print(f"{len(entries)} médias indexés dans {OUTPUT.relative_to(PROJECT)} ; descriptions visuelles à compléter : {needs_review} ; fichiers vides : {empty}.")

if __name__ == "__main__":
    main()
