import React from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, interpolateColors, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DA } from "../da/tokens";
import type { MotionEase, MotionElement, MotionKeyframe, MotionVisual } from "./types";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const easingFor = (ease: MotionEase = "out") => {
  if (ease === "linear") return Easing.linear;
  if (ease === "in") return Easing.in(Easing.cubic);
  if (ease === "in-out") return Easing.inOut(Easing.cubic);
  if (ease === "spring") return Easing.out(Easing.back(1.25));
  return Easing.out(Easing.cubic);
};

const valueAt = (frame: number, fps: number, track: MotionKeyframe[] | undefined, key: keyof MotionKeyframe, fallback: number) => {
  const points = (track ?? []).filter((point) => typeof point[key] === "number").sort((a, b) => a.t - b.t);
  if (points.length === 0) return fallback;
  const time = frame / fps;
  if (time <= points[0].t) return points[0][key] as number;
  if (time >= points[points.length - 1].t) return points[points.length - 1][key] as number;
  const index = points.findIndex((point, pointIndex) => pointIndex < points.length - 1 && point.t <= time && points[pointIndex + 1].t >= time);
  const from = points[index];
  const to = points[index + 1];
  const progress = interpolate(time, [from.t, to.t], [0, 1], { ...clamp, easing: easingFor(to.ease) });
  if (to.ease === "spring") {
    const springProgress = spring({ frame: frame - Math.round(from.t * fps), fps, config: { damping: 15, stiffness: 110, mass: 0.8 } });
    return interpolate(springProgress, [0, 1], [from[key] as number, to[key] as number], clamp);
  }
  return interpolate(progress, [0, 1], [from[key] as number, to[key] as number], clamp);
};

const colorAt = (frame: number, fps: number, track: MotionKeyframe[] | undefined, key: "backgroundColor" | "color" | "fillColor" | "strokeColor", fallback: string) => {
  const points = (track ?? []).filter((point) => typeof point[key] === "string").sort((a, b) => a.t - b.t);
  if (points.length === 0) return fallback;
  const time = frame / fps;
  if (time <= points[0].t) return points[0][key] as string;
  if (time >= points[points.length - 1].t) return points[points.length - 1][key] as string;
  const index = points.findIndex((point, pointIndex) => pointIndex < points.length - 1 && point.t <= time && points[pointIndex + 1].t >= time);
  const from = points[index];
  const to = points[index + 1];
  const progress = interpolate(time, [from.t, to.t], [0, 1], { ...clamp, easing: easingFor(to.ease) });
  return interpolateColors(progress, [0, 1], [from[key] as string, to[key] as string]);
};

const MotionNode: React.FC<{ node: MotionElement }> = ({ node }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const x = valueAt(frame, fps, node.motion, "x", node.x);
  const y = valueAt(frame, fps, node.motion, "y", node.y);
  const width = valueAt(frame, fps, node.motion, "width", node.width);
  const height = valueAt(frame, fps, node.motion, "height", node.height);
  const scale = valueAt(frame, fps, node.motion, "scale", node.scale ?? 1);
  const rotation = valueAt(frame, fps, node.motion, "rotation", node.rotation ?? 0);
  const rotationX = valueAt(frame, fps, node.motion, "rotationX", node.rotationX ?? 0);
  const rotationY = valueAt(frame, fps, node.motion, "rotationY", node.rotationY ?? 0);
  const opacity = valueAt(frame, fps, node.motion, "opacity", node.opacity ?? 1);
  const blur = valueAt(frame, fps, node.motion, "blur", 0);
  const mediaScale = valueAt(frame, fps, node.motion, "mediaScale", 1);
  const mediaX = valueAt(frame, fps, node.motion, "mediaX", 0);
  const mediaY = valueAt(frame, fps, node.motion, "mediaY", 0);
  const backgroundColor = colorAt(frame, fps, node.motion, "backgroundColor", node.style?.background ?? "transparent");
  const color = colorAt(frame, fps, node.motion, "color", node.style?.color ?? "white");
  const style: React.CSSProperties = {
    position: "absolute", left: x, top: y, width, height, zIndex: node.z ?? 0,
    opacity, transform: `perspective(1600px) rotateX(${rotationX}deg) rotateY(${rotationY}deg) rotateZ(${rotation}deg) scale(${scale})`,
    transformOrigin: "50% 50%", filter: blur > 0 ? `blur(${blur}px)` : undefined,
    background: backgroundColor, color, border: node.style?.border,
    borderRadius: node.style?.borderRadius, boxShadow: node.style?.boxShadow,
    clipPath: node.style?.clipPath, overflow: node.style?.overflow ?? (node.kind === "group" ? "visible" : "hidden"),
    padding: node.style?.padding, fontFamily: node.style?.fontFamily ?? DA.font,
    fontSize: node.style?.fontSize, fontWeight: node.style?.fontWeight,
    lineHeight: node.style?.lineHeight, letterSpacing: node.style?.letterSpacing,
    textAlign: node.style?.textAlign,
    textShadow: node.style?.textShadow,
  };
  if (node.kind === "shape") {
    const shape = "shape" in node ? node.shape : undefined;
    if (shape === "ellipse") style.borderRadius = "50%";
    if (shape === "diamond") style.clipPath = "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)";
  }
  const objectFit = node.style?.objectFit ?? "cover";
  const objectPosition = node.style?.objectPosition ?? "50% 50%";
  const local = <div style={style}>
    {node.kind === "group" && node.children.map((child) => <MotionNode key={child.id} node={child} />)}
    {node.kind === "image" && <Img src={staticFile(node.src)} style={{ width: "100%", height: "100%", objectFit, objectPosition, transform: `translate(${mediaX}%, ${mediaY}%) scale(${mediaScale})` }} />}
    {node.kind === "video" && <OffthreadVideo src={staticFile(node.src)} startFrom={Math.round((node.sourceStart ?? 0) * node.sourceFps)} playbackRate={node.speed ?? 1} muted style={{ width: "100%", height: "100%", objectFit, objectPosition, transform: `translate(${mediaX}%, ${mediaY}%) scale(${mediaScale})` }} />}
    {node.kind === "text" && <div style={{ width: "100%", height: "100%", whiteSpace: "pre-line" }}>{node.text}</div>}
    {(node.kind === "panel" || node.kind === "shape") && node.label && <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>{node.label}</div>}
    {node.kind === "path" && <svg width="100%" height="100%" viewBox={`0 0 ${node.width} ${node.height}`} style={{ overflow: "visible" }}><path d={node.d} fill={colorAt(frame, fps, node.motion, "fillColor", node.fill ?? "none")} stroke={colorAt(frame, fps, node.motion, "strokeColor", node.stroke ?? DA.colors.coral)} strokeWidth={node.strokeWidth ?? 4} strokeLinecap="round" strokeLinejoin="round" pathLength={node.pathLength} strokeDasharray={node.pathLength} strokeDashoffset={node.pathLength * (1 - valueAt(frame, fps, node.motion, "draw", 1))} /></svg>}
  </div>;
  return <Sequence from={Math.round(node.start * fps)} durationInFrames={Math.max(1, Math.round(node.duration * fps))}>{local}</Sequence>;
};

export const MotionCanvas: React.FC<{ visual: MotionVisual }> = ({ visual }) => {
  const stage = visual.stage === "vice-city"
    ? <><Img src={staticFile("assets/background/vice-city-motion-stage.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} /><AbsoluteFill style={{ background: "linear-gradient(110deg, #181731dd, #27183299 55%, #181731dc)" }} /></>
    : null;
  return <AbsoluteFill style={{ overflow: "hidden", background: visual.stage === "transparent" ? "transparent" : visual.background ?? (visual.stage === "plum" ? `radial-gradient(ellipse at 50% 50%, ${DA.colors.plum}, ${DA.colors.night} 72%)` : DA.colors.night) }}>
    {stage}
    {visual.elements.map((node) => <MotionNode key={node.id} node={node} />)}
  </AbsoluteFill>;
};
