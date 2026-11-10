#!/usr/bin/env python3
"""Validate the active explainer scene plan against public/ media files."""
import json
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[4]
PUBLIC = PROJECT / "public"
SCENE_FILE = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else PROJECT / "src/data/scenes.json"
errors, warnings = [], []

def check_file(rel, where):
    if not isinstance(rel, str) or not rel or not (PUBLIC / rel).is_file() or (PUBLIC / rel).stat().st_size == 0:
        errors.append(f"{where}: média absent de public/{rel}")
        return False
    return True

def validate_motion_node(node, scene_seconds, where, nested=False):
    if not isinstance(node, dict):
        errors.append(f"{where}: couche motion doit être un objet")
        return
    kind = node.get("kind")
    if kind not in {"group", "image", "video", "text", "panel", "shape", "path"}:
        errors.append(f"{where}: type de couche motion inconnu")
        return
    start, duration = node.get("start"), node.get("duration")
    if not isinstance(start, (int, float)) or start < 0 or not isinstance(duration, (int, float)) or duration <= 0:
        errors.append(f"{where}: start/duration motion invalides")
        return
    if start + duration > scene_seconds + 0.12:
        errors.append(f"{where}: couche motion plus longue que son conteneur")
    for key in ("x", "y", "width", "height"):
        if not isinstance(node.get(key), (int, float)):
            errors.append(f"{where}: {key} numérique requis")
    if kind in {"image", "video"}:
        check_file(node.get("src"), where)
    if kind == "video":
        if not isinstance(node.get("sourceFps"), (int, float)) or node["sourceFps"] <= 0:
            errors.append(f"{where}: sourceFps requis pour la vidéo")
        if not isinstance(node.get("speed", 1), (int, float)) or node.get("speed", 1) <= 0:
            errors.append(f"{where}: vitesse vidéo invalide")
    if kind == "text" and not isinstance(node.get("text"), str):
        errors.append(f"{where}: texte requis")
    if kind == "path" and (not isinstance(node.get("d"), str) or not isinstance(node.get("pathLength"), (int, float)) or node.get("pathLength", 0) <= 0):
        errors.append(f"{where}: chemin SVG et pathLength requis")
    motion = node.get("motion", [])
    if not isinstance(motion, list):
        errors.append(f"{where}: motion doit être une liste de poses")
    else:
        prior = -1
        for keyframe in motion:
            if not isinstance(keyframe, dict) or not isinstance(keyframe.get("t"), (int, float)) or keyframe["t"] < 0 or keyframe["t"] > duration + 0.12:
                errors.append(f"{where}: temps de pose motion hors de sa durée")
                continue
            if keyframe["t"] < prior:
                errors.append(f"{where}: poses motion non triées par temps")
            prior = keyframe["t"]
            if keyframe.get("ease", "out") not in {"linear", "in", "out", "in-out", "spring"}:
                errors.append(f"{where}: easing motion inconnu")
            for key in ("x", "y", "width", "height", "scale", "rotation", "rotationX", "rotationY", "opacity", "blur", "draw", "mediaScale", "mediaX", "mediaY"):
                if key in keyframe and not isinstance(keyframe[key], (int, float)):
                    errors.append(f"{where}: {key} doit être numérique dans une pose")
            for key in ("backgroundColor", "color", "fillColor", "strokeColor"):
                if key in keyframe and not isinstance(keyframe[key], str):
                    errors.append(f"{where}: {key} doit être une chaîne de couleur")
    if kind == "group":
        children = node.get("children")
        if not isinstance(children, list):
            errors.append(f"{where}: un groupe motion doit avoir children")
        else:
            child_ids = set()
            for child in children:
                child_id = child.get("id") if isinstance(child, dict) else None
                if not isinstance(child_id, str) or not child_id or child_id in child_ids:
                    errors.append(f"{where}: id de couche enfant absent ou dupliqué")
                child_ids.add(child_id)
                validate_motion_node(child, duration, f"{where}/{child_id}", nested=True)

try:
    scenes = json.loads(SCENE_FILE.read_text(encoding="utf-8"))
except (OSError, ValueError) as exc:
    raise SystemExit(f"Impossible de lire {SCENE_FILE}: {exc}")
if not isinstance(scenes, list):
    raise SystemExit("Le fichier de scènes doit contenir un tableau JSON.")

ids = set()
for index, scene in enumerate(scenes):
    label = f"scène {scene.get('id', index)}" if isinstance(scene, dict) else f"scène {index}"
    if not isinstance(scene, dict):
        errors.append(f"{label}: objet attendu")
        continue
    scene_id = scene.get("id")
    if not isinstance(scene_id, str) or not scene_id:
        errors.append(f"{label}: id texte requis")
    elif scene_id in ids:
        errors.append(f"{label}: id en double")
    else:
        ids.add(scene_id)
    seconds = scene.get("seconds")
    if not isinstance(seconds, (int, float)) or seconds <= 0:
        errors.append(f"{label}: seconds doit être supérieur à zéro")
        seconds = 0
    visual = scene.get("visual", {})
    if not isinstance(visual, dict) or visual.get("type") not in {"image", "video", "pip", "montage", "graphic", "motion"}:
        errors.append(f"{label}: visual.type doit être image, video, pip, montage, graphic ou motion")
    else:
        if visual["type"] == "motion":
            elements = visual.get("elements")
            if not isinstance(elements, list) or not elements:
                errors.append(f"{label}: motion.elements doit contenir des couches")
            else:
                element_ids = set()
                for node in elements:
                    node_id = node.get("id") if isinstance(node, dict) else None
                    if not isinstance(node_id, str) or not node_id or node_id in element_ids:
                        errors.append(f"{label}: id de couche motion absent ou dupliqué")
                    element_ids.add(node_id)
                    validate_motion_node(node, seconds, f"{label}/{node_id}")
            if visual.get("stage", "plum") not in {"vice-city", "plum", "transparent"}:
                errors.append(f"{label}: stage motion inconnu")
        if visual["type"] in {"image", "video", "pip"}:
            check_file(visual.get("src"), label)
        if visual["type"] in {"image", "pip"} and visual.get("camera", "push") not in {"push", "pull", "pan-left", "pan-right", "arc-left", "arc-right", "whip-left", "whip-right", "tilt-up", "tilt-down", "static"}:
            errors.append(f"{label}: mouvement de caméra inconnu")
        if visual["type"] == "montage":
            cards = visual.get("cards")
            if visual.get("layout") not in {"fan", "duo"}:
                errors.append(f"{label}: montage.layout doit être fan ou duo")
            if not isinstance(cards, list) or not 2 <= len(cards) <= 5:
                errors.append(f"{label}: un montage requiert 2 à 5 cartes")
            else:
                for card_index, card in enumerate(cards):
                    card_label = f"{label}, carte {card_index + 1}"
                    if not isinstance(card, dict) or card.get("type") not in {"image", "video"}:
                        errors.append(f"{card_label}: type image ou video requis")
                        continue
                    check_file(card.get("src"), card_label)
                    if not isinstance(card.get("label"), str) or not card["label"].strip():
                        errors.append(f"{card_label}: label requis")
                    if card["type"] == "video":
                        start, end = card.get("start"), card.get("end")
                        speed, source_fps = card.get("speed", 1), card.get("sourceFps")
                        if not isinstance(start, (int, float)) or start < 0 or not isinstance(end, (int, float)) or end <= start:
                            errors.append(f"{card_label}: start/end de l’extrait vidéo invalides")
                        elif isinstance(speed, (int, float)) and speed > 0 and (end - start) / speed > seconds + 0.12:
                            errors.append(f"{card_label}: extrait vidéo plus long que la scène")
                        if not isinstance(speed, (int, float)) or speed <= 0:
                            errors.append(f"{card_label}: speed doit être supérieur à zéro")
                        if not isinstance(source_fps, (int, float)) or source_fps <= 0:
                            errors.append(f"{card_label}: sourceFps requis pour caler l’extrait")
                reveal = visual.get("reveal")
                if reveal is not None:
                    if not isinstance(reveal, dict):
                        errors.append(f"{label}: montage.reveal doit être un objet")
                    else:
                        card_index, at, duration = reveal.get("card"), reveal.get("at"), reveal.get("seconds")
                        if not isinstance(card_index, int) or not 0 <= card_index < len(cards):
                            errors.append(f"{label}: montage.reveal.card doit pointer vers une carte existante")
                        if not isinstance(at, (int, float)) or at < 0 or not isinstance(duration, (int, float)) or duration <= 0 or (isinstance(at, (int, float)) and isinstance(duration, (int, float)) and at + duration > seconds + 0.12):
                            errors.append(f"{label}: montage.reveal.at/seconds hors de la scène")
        if visual["type"] == "pip":
            check_file(visual.get("background"), label + " arrière-plan")
            start, end = visual.get("start"), visual.get("end")
            speed = visual.get("speed", 1)
            if not isinstance(start, (int, float)) or start < 0 or not isinstance(end, (int, float)) or end <= start:
                errors.append(f"{label}: plage vidéo PIP invalide")
            if not isinstance(speed, (int, float)) or speed <= 0:
                errors.append(f"{label}: visual.speed doit être supérieur à zéro")
            pip_seconds = visual.get("pipSeconds", (end - start) / speed if isinstance(start, (int, float)) and isinstance(end, (int, float)) and end > start and isinstance(speed, (int, float)) and speed > 0 else 0)
            if not isinstance(pip_seconds, (int, float)) or pip_seconds <= 0 or pip_seconds > seconds + 0.12:
                errors.append(f"{label}: visual.pipSeconds doit tenir dans la scène")
            source_fps = visual.get("sourceFps")
            if source_fps is not None and (not isinstance(source_fps, (int, float)) or source_fps <= 0):
                errors.append(f"{label}: visual.sourceFps doit être supérieur à zéro")
        if visual["type"] == "graphic" and visual.get("style") not in {"night", "starfield", "paper-grid"}:
            errors.append(f"{label}: style de graphic inconnu")
        if visual["type"] == "video":
            start, end = visual.get("start", 0), visual.get("end")
            if not isinstance(start, (int, float)) or start < 0:
                errors.append(f"{label}: visual.start doit être positif ou nul")
            if end is not None and (not isinstance(end, (int, float)) or end <= start):
                errors.append(f"{label}: visual.end doit dépasser visual.start")
            speed = visual.get("speed", 1)
            if not isinstance(speed, (int, float)) or speed <= 0:
                errors.append(f"{label}: visual.speed doit être supérieur à zéro")
                speed = 1
            previous_at, hold_total = start, 0
            for pause in visual.get("pauses", []):
                at, hold = pause.get("at"), pause.get("hold")
                if not isinstance(at, (int, float)) or at < previous_at or (end is not None and at > end):
                    errors.append(f"{label}: pauses vidéo non triées ou hors de l'extrait")
                if not isinstance(hold, (int, float)) or hold <= 0:
                    errors.append(f"{label}: chaque pause doit avoir un hold positif")
                    hold = 0
                previous_at, hold_total = at if isinstance(at, (int, float)) else previous_at, hold_total + hold
                for marker in pause.get("markers", []):
                    for axis, maximum in (("x", 1920), ("y", 1080)):
                        if not isinstance(marker.get(axis), (int, float)) or not 0 <= marker[axis] <= maximum:
                            errors.append(f"{label}: marqueur de pause hors cadre ({axis})")
            if end is not None and isinstance(start, (int, float)) and isinstance(end, (int, float)) and end > start:
                expected = (end - start) / speed + hold_total
                if abs(expected - seconds) > 0.12:
                    warnings.append(f"{label}: durée de scène ({seconds}s) différente de l'extrait et de ses pauses ({expected:.2f}s)")
    if scene.get("voice"):
        check_file(scene["voice"], label + " voix")
    entrance = scene.get("entrance", {})
    if entrance and entrance.get("type") not in {"cut", "fade", "wipe", "flash"}:
        errors.append(f"{label}: entrance.type inconnu")
    if entrance and entrance.get("seconds", 0.45) > seconds:
        warnings.append(f"{label}: transition plus longue que la scène")
    overlays = scene.get("overlays", [])
    if not isinstance(overlays, list):
        errors.append(f"{label}: overlays doit être un tableau")
        continue
    for item in overlays:
        if not isinstance(item, dict):
            errors.append(f"{label}: overlay doit être un objet")
            continue
        kind, at = item.get("kind"), item.get("t")
        if kind not in {"headline", "caption", "quote", "label", "stat", "evidence", "focus", "wanted", "heat", "search", "profile"}:
            errors.append(f"{label}: type d’overlay inconnu ({kind})")
        if not isinstance(at, (int, float)) or at < 0 or at >= seconds:
            errors.append(f"{label}: temps d’overlay {at} hors des {seconds}s")
        if kind == "headline":
            if "x" in item and (not isinstance(item["x"], (int, float)) or not 0 <= item["x"] <= 1920):
                errors.append(f"{label}: headline.x hors cadre")
            if "y" in item and (not isinstance(item["y"], (int, float)) or not 0 <= item["y"] <= 1080):
                errors.append(f"{label}: headline.y hors cadre")
            if "maxWidth" in item and (not isinstance(item["maxWidth"], (int, float)) or not 0 < item["maxWidth"] <= 1920):
                errors.append(f"{label}: headline.maxWidth invalide")
            if "fontSize" in item and (not isinstance(item["fontSize"], (int, float)) or not 12 <= item["fontSize"] <= 180):
                errors.append(f"{label}: headline.fontSize invalide")
        if kind == "label" and any(not isinstance(item.get(key), (int, float)) or not 0 <= item[key] <= 1920 for key in ("x",)):
            errors.append(f"{label}: position x du label hors cadre")
        if kind == "label" and (not isinstance(item.get("y"), (int, float)) or not 0 <= item["y"] <= 1080):
            errors.append(f"{label}: position y du label hors cadre")
        if kind == "focus":
            for key, limit in (("x", 1920), ("y", 1080), ("width", 1920), ("height", 1080)):
                if not isinstance(item.get(key), (int, float)) or item[key] <= 0 or item[key] > limit:
                    errors.append(f"{label}: dimensions/position de focus invalides ({key})")
            if item.get("side", "right") not in {"left", "right"}:
                errors.append(f"{label}: focus.side doit être left ou right")
        if kind == "wanted":
            if not isinstance(item.get("stars"), int) or not 1 <= item["stars"] <= 6:
                errors.append(f"{label}: wanted.stars doit être entre 1 et 6")
            if item.get("mode") not in {"pursuit", "search", "unknown", "identified"}:
                errors.append(f"{label}: état wanted inconnu")
        if kind == "heat":
            known_clues = {"CAMÉRA", "TENUE", "VISAGE", "ARME", "VÉHICULE", "BINÔME"}
            if not isinstance(item.get("clues"), list) or any(clue not in known_clues for clue in item["clues"]):
                errors.append(f"{label}: heat.clues contient une catégorie inconnue")
        if kind == "search":
            route = item.get("route")
            if not isinstance(route, list) or len(route) < 2:
                errors.append(f"{label}: search.route requiert au moins deux points")
            else:
                for point in route:
                    if not isinstance(point, list) or len(point) != 2 or any(not isinstance(value, (int, float)) for value in point) or not (0 <= point[0] <= 1920 and 0 <= point[1] <= 1080):
                        errors.append(f"{label}: point search.route hors cadre")
        if kind == "profile" and (not isinstance(item.get("value"), (int, float)) or not 0 <= item["value"] <= 4):
            errors.append(f"{label}: profile.value doit être entre 0 et 4")
        if kind == "evidence":
            for key, limit in (("x", 1920), ("y", 1080)):
                if key in item and (not isinstance(item[key], (int, float)) or not 0 <= item[key] < limit):
                    errors.append(f"{label}: evidence.{key} hors cadre")
            if "width" in item and (not isinstance(item["width"], (int, float)) or item["width"] <= 0 or item["width"] > 1200):
                errors.append(f"{label}: evidence.width invalide")
    if len(overlays) > 6:
        warnings.append(f"{label}: nombreux overlays, vérifier la lisibilité")

for warning in warnings:
    print("⚠", warning)
for error in errors:
    print("✗", error)
print(f"{len(scenes)} scènes — {len(errors)} erreur(s), {len(warnings)} avertissement(s)")
sys.exit(1 if errors else 0)
