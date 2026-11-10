#!/usr/bin/env bash
# Extrait des images fixes d'un clip pour placer les repères / vérifier un rendu.
# Usage: extract_frames.sh clip.mp4 sortie_dir t1 [t2 ...]   (t en secondes)
set -e
clip="$1"; out="$2"; shift 2; mkdir -p "$out"
for t in "$@"; do ffmpeg -v error -y -ss "$t" -i "$clip" -frames:v 1 -vf scale=1920:1080 "$out/frame_${t}s.png"; echo "$out/frame_${t}s.png"; done
