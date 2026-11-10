import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Freeze,
  Img,
  OffthreadVideo,
  random,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DA, type Pace } from "./da/tokens";
import { MotionCanvas } from "./motion/MotionCanvas";
import type { MotionVisual } from "./motion/types";

export type CameraMove = "push" | "pull" | "pan-left" | "pan-right" | "arc-left" | "arc-right" | "whip-left" | "whip-right" | "tilt-up" | "tilt-down" | "static";
export type Entrance = "cut" | "fade" | "wipe" | "flash";

export type MontageCard = {
  type: "image" | "video";
  src: string;
  label: string;
  detail?: string;
  start?: number;
  end?: number;
  speed?: number;
  sourceFps?: number;
};

export type Media =
  | { type: "image"; src: string; camera?: CameraMove }
  | { type: "video"; src: string; start?: number; end?: number; speed?: number; pauses?: VideoPause[] }
  | { type: "pip"; src: string; start: number; end: number; background: string; camera?: CameraMove; speed?: number; pipSeconds?: number; sourceFps?: number }
  | { type: "montage"; layout: "fan" | "duo"; cards: MontageCard[]; pinned?: string; timeline?: boolean; reveal?: { card: number; at: number; seconds: number } }
  | MotionVisual
  | { type: "graphic"; style: "night" | "starfield" | "paper-grid" };

export type VideoMarker = { x: number; y: number; r: number; label: string; dx?: number; dy?: number };
export type VideoPause = { at: number; hold: number; markers: VideoMarker[] };

type Animation = "rise" | "pop" | "slide-left" | "slide-right" | "fade";
export type Overlay =
  | { kind: "headline"; t: number; text: string; kicker?: string; animation?: Animation; x?: number; y?: number; maxWidth?: number; fontSize?: number }
  | { kind: "caption"; t: number; text: string; animation?: Animation }
  | { kind: "quote"; t: number; text: string; source: string; highlight?: string; animation?: Animation }
  | { kind: "label"; t: number; x: number; y: number; text: string; detail?: string; color?: string; animation?: Animation }
  | { kind: "stat"; t: number; value: string; label: string; detail?: string; animation?: Animation }
  | { kind: "evidence"; t: number; title: string; lines: string[]; reveal?: string; animation?: Animation; x?: number; y?: number; width?: number }
  | { kind: "focus"; t: number; x: number; y: number; width: number; height: number; title: string; detail?: string; side?: "left" | "right"; color?: string }
  | { kind: "wanted"; t: number; stars: number; state: string; detail: string; mode: "pursuit" | "search" | "unknown" | "identified"; x?: number; y?: number }
  | { kind: "heat"; t: number; clues: string[]; title?: string }
  | { kind: "search"; t: number; title: string; detail: string; route: Array<[number, number]>; duration?: number }
  | { kind: "profile"; t: number; value: number; detail: string; shattered?: boolean };

export type Scene = {
  id: string;
  seconds: number;
  visual: Media;
  pace?: Pace;
  entrance?: { type: Entrance; seconds?: number };
  voice?: string;
  overlays: Overlay[];
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const ViceCityBackdrop: React.FC = () => (
  <AbsoluteFill style={{ overflow: "hidden", background: DA.colors.night }}>
    <Img src={staticFile("assets/background/vice-city-motion-stage.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.18)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(112deg, rgba(24,23,49,.82) 0%, rgba(35,23,53,.55) 44%, rgba(24,23,49,.8) 100%), linear-gradient(0deg, rgba(24,23,49,.7), transparent 44%, rgba(31,24,49,.34))" }} />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 54%, ${DA.colors.coral}25, transparent 50%)`, mixBlendMode: "screen" }} />
    <div style={{ position: "absolute", inset: 0, opacity: 0.18, backgroundImage: `repeating-linear-gradient(0deg, transparent 0 5px, ${DA.colors.ink}55 6px 7px)` }} />
  </AbsoluteFill>
);

const SceneImage: React.FC<{ src: string; camera: CameraMove; pace: Pace; frames: number }> = ({
  src,
  camera,
  pace,
  frames,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, Math.max(1, frames)], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const strength = pace === "slow" ? 0.095 : pace === "fast" ? 0.18 : 0.13;
  const zoom = camera === "push" ? 1.025 + strength * progress : camera === "pull" ? 1.18 - strength * progress : camera === "static" ? 1.015 : 1.1 + progress * 0.025;
  const pan = camera === "pan-left" || camera === "whip-left" ? 68 - progress * 136 : camera === "pan-right" || camera === "whip-right" ? -68 + progress * 136 : camera === "arc-left" ? 42 - progress * 84 : camera === "arc-right" ? -42 + progress * 84 : 0;
  const rotationY = camera === "arc-left" ? 4.5 - progress * 9 : camera === "arc-right" ? -4.5 + progress * 9 : 0;
  const rotationX = camera === "tilt-up" ? 3.2 - progress * 6.4 : camera === "tilt-down" ? -3.2 + progress * 6.4 : 0;
  const whip = camera === "whip-left" || camera === "whip-right";
  const whipOffset = whip ? interpolate(progress, [0, 0.16, 0.72, 1], [camera === "whip-left" ? 210 : -210, camera === "whip-left" ? 35 : -35, camera === "whip-left" ? -18 : 18, 0], clamp) : 0;
  const stageTilt = camera === "arc-left" ? interpolate(progress, [0, 1], [1.4, -1.4]) : camera === "arc-right" ? interpolate(progress, [0, 1], [-1.4, 1.4]) : interpolate(progress, [0, 1], [0.8, -0.8]);
  const stageRise = Math.sin(progress * Math.PI) * -13;
  const lightLeak = interpolate(progress, [0, 1], [-1150, 2200]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: DA.colors.night }}>
      <ViceCityBackdrop />
      <div style={{ position: "absolute", left: 88, top: 54, width: DA.width - 176, height: DA.height - 108, overflow: "hidden", borderRadius: 12, border: `2px solid ${DA.colors.gold}99`, boxShadow: `0 36px 100px #0c091acc, 0 0 0 7px ${DA.colors.magenta}18, 0 0 45px ${DA.colors.magenta}44`, transform: `perspective(1800px) translate3d(${pan * 0.16}px, ${stageRise}px, 0) rotateY(${stageTilt}deg) rotateX(${rotationX * 0.22}deg) scale(${1 + Math.sin(progress * Math.PI) * 0.012})`, transformOrigin: "50% 50%" }}>
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `perspective(1800px) translate3d(${pan + whipOffset}px, ${rotationX * -7}px, 0) rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale(${zoom})`,
            transformOrigin: camera === "arc-left" || camera === "pan-left" ? "64% 50%" : camera === "arc-right" || camera === "pan-right" ? "36% 50%" : "50% 50%",
            filter: whip ? `blur(${interpolate(progress, [0, 0.2, 0.55, 1], [9, 2, 0, 0], clamp)}px)` : "saturate(1.04) contrast(1.035)",
          }}
        />
        <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(16,12,27,.48), transparent 48%), linear-gradient(90deg, rgba(24,23,49,.12), transparent 35%, rgba(24,23,49,.12))", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, width: 260, transform: `translateX(${lightLeak}px) skewX(-18deg)`, background: `linear-gradient(90deg, transparent, ${DA.colors.coral}30, ${DA.colors.gold}22, transparent)`, pointerEvents: "none" }} />
        <svg width={DA.width} height={DA.height} viewBox={`0 0 ${DA.width} ${DA.height}`} style={{ position: "absolute", inset: 0, pointerEvents: "none", filter: `drop-shadow(0 0 7px ${DA.colors.magenta})` }}>
          <path d={`M 12 48 V 12 H 48 M ${DA.width - 48} 12 H ${DA.width - 12} V 48 M 12 ${DA.height - 48} V ${DA.height - 12} H 48 M ${DA.width - 48} ${DA.height - 12} H ${DA.width - 12} V ${DA.height - 48}`} fill="none" stroke={DA.colors.seafoam} strokeWidth={3} />
          <path d={`M 48 12 H 88 M ${DA.width - 88} 12 H ${DA.width - 48} M 48 ${DA.height - 12} H 88 M ${DA.width - 88} ${DA.height - 12} H ${DA.width - 48}`} fill="none" stroke={DA.colors.highlight} strokeWidth={1.5} />
        </svg>
      </div>
      <div style={{ position: "absolute", top: 20, left: 98, color: DA.colors.paper, font: `900 15px ${DA.font}`, letterSpacing: 5, textShadow: `0 2px 14px ${DA.colors.night}` }}>ELMACCATO <span style={{ color: DA.colors.coral }}>✦</span> VICE CITY</div>
      <div style={{ position: "absolute", right: 100, bottom: 22, display: "flex", gap: 8, alignItems: "center", color: DA.colors.paper, font: `800 13px ${DA.font}`, letterSpacing: 4, opacity: 0.86 }}><span style={{ width: 48, height: 2, background: `linear-gradient(90deg, ${DA.colors.magenta}, ${DA.colors.gold})` }} /> STATE OF LEONIDA · VISUAL ARCHIVE</div>
    </AbsoluteFill>
  );
};

const MontageCardView: React.FC<{ card: MontageCard; index: number; count: number; layout: "fan" | "duo"; frames: number; reveal?: { card: number; at: number; seconds: number } }> = ({ card, index, count, layout, frames, reveal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - index * 5, fps, config: { damping: 17, stiffness: 95, mass: 0.9 } });
  const cardProgress = interpolate(frame, [0, frames], [0, 1], clamp);
  const fan = layout === "fan";
  const width = fan ? 810 : 824;
  const height = fan ? 510 : 464;
  const fanSide = index === 0 ? 0 : (index % 2 === 1 ? -1 : 1) * Math.ceil(index / 2);
  const x = fan ? (DA.width - width) / 2 + fanSide * 250 : 104 + index * 888;
  const y = fan ? 225 + (index === 0 ? 0 : 40) : 284;
  const rotate = fan ? fanSide * (9 * (1 - enter) + 3) : interpolate(enter, [0, 1], [index === 0 ? -7 : 7, 0]);
  const scale = fan ? interpolate(enter, [0, 1], [index === 0 ? 0.78 : 0.72, index === 0 ? 1 : 0.87]) : interpolate(enter, [0, 1], [0.88, 1]);
  const z = fan ? Math.round(28 - index * 12) : 0;
  const mediaDrift = Math.sin(frame / 58 + index * 1.7);
  const mediaScale = 1.055 + cardProgress * 0.05 + mediaDrift * 0.009;
  const cardFloat = Math.sin(frame / 34 + index * 2.1) * 4;
  const isRevealCard = reveal?.card === index;
  const revealProgress = isRevealCard ? interpolate(frame, [reveal.at * fps, (reveal.at + reveal.seconds) * fps], [0, 1], clamp) : 0;
  const cardLeft = interpolate(revealProgress, [0, 1], [x, 0]);
  const cardTop = interpolate(revealProgress, [0, 1], [y + (fan ? (1 - enter) * 190 : (1 - enter) * 72) + enter * cardFloat, 0]);
  const cardWidth = interpolate(revealProgress, [0, 1], [width, DA.width]);
  const cardHeight = interpolate(revealProgress, [0, 1], [height, DA.height]);
  const labelOpacity = 1 - revealProgress;
  const from = card.start ?? 0;
  const speed = card.speed ?? 1;
  const sourceFps = card.sourceFps ?? fps;
  return (
    <div style={{ position: "absolute", left: cardLeft, top: cardTop, width: cardWidth, height: cardHeight, opacity: enter * (isRevealCard ? 1 : 1 - revealProgress), zIndex: isRevealCard && revealProgress > 0 ? 100 : fan ? count - index : index + 1, transform: `perspective(1500px) translateZ(${interpolate(revealProgress, [0, 1], [z, 0])}px) rotateY(${interpolate(revealProgress, [0, 1], [rotate, 0])}deg) rotateZ(${interpolate(revealProgress, [0, 1], [fan ? fanSide * 2.4 : 0, 0])}deg) scale(${interpolate(revealProgress, [0, 1], [scale, 1])})`, transformStyle: "preserve-3d", borderRadius: interpolate(revealProgress, [0, 1], [20, 0]), overflow: "hidden", background: "#080711", border: `${2 * (1 - revealProgress)}px solid ${index === 0 ? DA.colors.highlight : "rgba(243,234,216,.34)"}`, boxShadow: revealProgress > 0.98 ? "none" : index === 0 ? `0 32px 90px #000b, 0 0 36px ${DA.colors.magenta}66` : "0 25px 65px #0009" }}>
      {card.type === "image" ? <Img src={staticFile(card.src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${mediaScale}) translateX(${mediaDrift * 0.75}%)` }} /> : (
        <OffthreadVideo src={staticFile(card.src)} startFrom={Math.round(from * sourceFps)} endAt={card.end === undefined ? undefined : Math.round(card.end * sourceFps)} playbackRate={speed} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${mediaScale}) translateX(${mediaDrift * 0.45}%)` }} />
      )}
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(12,9,22,.94), transparent 60%)" }} />
        <div style={{ position: "absolute", left: 34, right: 30, bottom: 28, color: "white", fontFamily: DA.font, opacity: labelOpacity }}>
        <div style={{ display: "inline-flex", padding: "7px 13px", background: `linear-gradient(105deg, ${DA.colors.coral}, ${DA.colors.gold})`, color: DA.colors.ink, clipPath: "polygon(0 0, 100% 0, 91% 100%, 0 100%)", fontSize: 14, fontWeight: 900, letterSpacing: 2 }}>{String(index + 1).padStart(2, "0")} <span style={{ margin: "0 6px", color: DA.colors.magenta }}>✦</span> VICE CITY / FRAME</div>
        <div style={{ marginTop: 11, fontSize: 31, lineHeight: 1.05, fontWeight: 900, letterSpacing: 1, textShadow: `2px 3px 0 ${DA.colors.magenta}88` }}>{card.label.toUpperCase()}</div>
        {card.detail && <div style={{ display: "inline-block", marginTop: 8, padding: "5px 10px", fontSize: 18, color: DA.colors.paper, background: "rgba(24,23,49,.72)", borderLeft: `3px solid ${DA.colors.seafoam}` }}>{card.detail}</div>}
      </div>
    </div>
  );
};

const MontageVisual: React.FC<{ media: Extract<Media, { type: "montage" }>; frames: number }> = ({ media, frames }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, frames], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: DA.colors.night, perspective: 1500 }}>
      <ViceCityBackdrop />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,14,34,.18), transparent 34%, rgba(20,14,34,.24))" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.075, backgroundImage: `linear-gradient(${DA.colors.rose}22 1px, transparent 1px), linear-gradient(90deg, ${DA.colors.rose}22 1px, transparent 1px)`, backgroundSize: "84px 84px", transform: `translateY(${(frame % 84)}px) rotate(-4deg) scale(1.2)` }} />
      <div style={{ position: "absolute", top: 78, left: 106, color: DA.colors.paper, font: `900 17px ${DA.font}`, letterSpacing: 7, textShadow: `0 3px 20px ${DA.colors.night}` }}>ELMACCATO <span style={{ color: DA.colors.coral }}>✦</span> VICE CITY</div>
      {media.pinned && <div style={{ position: "absolute", top: 116, left: 100, zIndex: 130, background: `linear-gradient(105deg, ${DA.colors.gold}, ${DA.colors.coral})`, color: DA.colors.ink, padding: "13px 22px", clipPath: "polygon(0 0, 100% 0, 93% 100%, 0 100%)", boxShadow: "0 12px 36px #0008", font: `900 22px ${DA.font}`, letterSpacing: 1.2, transform: `translateY(${interpolate(frame, [0, 16], [-34, 0], clamp)}px)`, opacity: interpolate(frame, [0, 12], [0, 1], clamp) }}><span style={{ color: DA.colors.magenta, marginRight: 10 }}>✦</span>{media.pinned.toUpperCase()}</div>}
      {media.cards.map((card, index) => <MontageCardView key={`${card.src}-${index}`} card={card} index={index} count={media.cards.length} layout={media.layout} frames={frames} reveal={media.reveal} />)}
      {media.timeline && <div style={{ position: "absolute", left: 140, right: 140, bottom: 78, height: 4, background: "#f3ead866", zIndex: 60 }}>
        <div style={{ position: "absolute", inset: "-2px auto -2px 0", width: `${progress * 100}%`, background: `linear-gradient(90deg, ${DA.colors.magenta}, ${DA.colors.coral}, ${DA.colors.gold})`, boxShadow: `0 0 16px ${DA.colors.coral}` }} />
        {media.cards.map((card, index) => <div key={card.src} style={{ position: "absolute", left: `${(index / Math.max(1, media.cards.length - 1)) * 100}%`, top: -5, width: 14, height: 14, borderRadius: "50%", background: DA.colors.paper, border: `3px solid ${DA.colors.magenta}`, transform: `translateX(-50%) scale(${0.8 + 0.3 * Math.sin(frame / 8 + index)})`, boxShadow: `0 0 14px ${DA.colors.magenta}` }} />)}
        <div style={{ position: "absolute", left: `${progress * 100}%`, top: -12, width: 5, height: 28, background: "white", boxShadow: "0 0 18px white", transform: "translateX(-50%)" }} />
      </div>}
    </AbsoluteFill>
  );
};

const GraphicBackground: React.FC<{ style: "night" | "starfield" | "paper-grid" }> = ({ style }) => {
  const frame = useCurrentFrame();
  if (style === "paper-grid") {
    return <AbsoluteFill style={{ backgroundColor: DA.colors.paper, backgroundImage: `linear-gradient(${DA.colors.ink}12 1px, transparent 1px), linear-gradient(90deg, ${DA.colors.ink}12 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />;
  }
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 70% 25%, ${DA.colors.plum}, ${DA.colors.night} 72%)` }}>
      {style === "starfield" && Array.from({ length: 86 }, (_, index) => (
        <div key={index} style={{ position: "absolute", left: random(`star-x-${index}`) * DA.width, top: random(`star-y-${index}`) * DA.height, width: 2 + random(`star-size-${index}`) * 3, height: 2 + random(`star-size-${index}`) * 3, borderRadius: "50%", backgroundColor: DA.colors.rose, opacity: 0.2 + 0.6 * Math.abs(Math.sin((frame + index * 13) / 44)) }} />
      ))}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 58%, rgba(24,23,49,.42))" }} />
    </AbsoluteFill>
  );
};

const PictureInPicture: React.FC<{ scene: Scene; media: Extract<Media, { type: "pip" }>; frames: number }> = ({ scene, media, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const speed = media.speed ?? 1;
  const sourceFps = media.sourceFps ?? fps;
  const clipSeconds = media.pipSeconds ?? (media.end - media.start) / speed;
  const clipFrames = Math.max(1, Math.round(Math.min(clipSeconds, (media.end - media.start) / speed) * fps));
  return (
    <AbsoluteFill style={{ backgroundColor: DA.colors.night }}>
      <SceneImage src={media.background} camera={media.camera ?? "push"} pace={scene.pace ?? "steady"} frames={frames} />
      <Sequence durationInFrames={clipFrames}>
        <div style={{ position: "absolute", right: 86, bottom: 80, width: 640, height: 360, overflow: "hidden", clipPath: "polygon(0 0, 100% 0, 100% 90%, 96% 100%, 0 100%)", border: `2px solid ${DA.colors.seafoam}`, boxShadow: `0 20px 60px #000a, 0 0 28px ${DA.colors.magenta}88`, background: DA.colors.night, transform: `perspective(1300px) translate(${(1 - enter) * 74}px, ${(1 - enter) * 34}px) rotateY(${(1 - enter) * -7}deg) scale(${0.92 + enter * 0.08})`, opacity: enter }}>
          <OffthreadVideo src={staticFile(media.src)} startFrom={Math.round(media.start * sourceFps)} endAt={Math.round(media.end * sourceFps)} playbackRate={speed} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", left: 0, top: 0, padding: "7px 13px", color: DA.colors.ink, background: `linear-gradient(100deg, ${DA.colors.gold}, ${DA.colors.coral})`, clipPath: "polygon(0 0, 100% 0, 92% 100%, 0 100%)", font: `900 13px ${DA.font}`, letterSpacing: 2 }}>VICE CITY ✦ SOURCE VIDÉO</div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 5, background: "#18173199" }}><div style={{ width: `${Math.min(1, frame / clipFrames) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${DA.colors.magenta}, ${DA.colors.coral}, ${DA.colors.gold})` }} /></div>
        </div>
      </Sequence>
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(24,23,49,.28), transparent 55%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

const FrozenMarker: React.FC<{ marker: VideoMarker; delay: number }> = ({ marker, delay }) => {
  const frame = Math.max(0, useCurrentFrame() - delay);
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 145 } });
  const labelAlpha = interpolate(frame, [12, 22], [0, 1], clamp);
  return (
    <>
      <div style={{ position: "absolute", left: marker.x - marker.r, top: marker.y - marker.r, width: marker.r * 2, height: marker.r * 2, border: `5px solid ${DA.colors.rose}`, borderRadius: "50%", boxShadow: `0 0 0 9px ${DA.colors.magenta}55`, transform: `scale(${scale})` }} />
      <div style={{ position: "absolute", left: marker.x + (marker.dx ?? 150), top: marker.y + (marker.dy ?? -80), opacity: labelAlpha, background: "rgba(24,23,49,.94)", border: `2px solid ${DA.colors.rose}`, color: "white", borderRadius: 999, padding: "10px 22px", font: `800 24px ${DA.font}`, whiteSpace: "nowrap" }}>{marker.label}</div>
    </>
  );
};

const VideoWithPauses: React.FC<{ media: Extract<Media, { type: "video" }>; seconds: number }> = ({ media, seconds }) => {
  const { fps } = useVideoConfig();
  const speed = media.speed ?? 1;
  const begin = media.start ?? 0;
  const holds = (media.pauses ?? []).reduce((sum, pause) => sum + pause.hold, 0);
  const end = media.end ?? begin + Math.max(0, seconds - holds) * speed;
  const pauses = [...(media.pauses ?? [])].sort((a, b) => a.at - b.at);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let sourceCursor = begin;
  const play = (to: number, key: string) => {
    const length = Math.round(((to - sourceCursor) / speed) * fps);
    if (length > 0) {
      parts.push(
        <Sequence key={key} from={cursor} durationInFrames={length}>
          <OffthreadVideo src={staticFile(media.src)} startFrom={Math.round(sourceCursor * fps)} playbackRate={speed} style={{ width: DA.width, height: DA.height, objectFit: "cover" }} />
        </Sequence>,
      );
      cursor += length;
    }
    sourceCursor = to;
  };
  pauses.forEach((pause, index) => {
    play(pause.at, `play-${index}`);
    const holdFrames = Math.max(1, Math.round(pause.hold * fps));
    parts.push(
      <Sequence key={`pause-${index}`} from={cursor} durationInFrames={holdFrames}>
        <AbsoluteFill style={{ background: "#000" }}>
          <Freeze frame={0}>
            <OffthreadVideo src={staticFile(media.src)} startFrom={Math.round(pause.at * fps)} style={{ width: DA.width, height: DA.height, objectFit: "cover" }} />
          </Freeze>
          <AbsoluteFill style={{ background: "rgba(24,23,49,.42)" }} />
          {pause.markers.map((marker, markerIndex) => <FrozenMarker key={markerIndex} marker={marker} delay={10 + markerIndex * 32} />)}
        </AbsoluteFill>
      </Sequence>,
    );
    cursor += holdFrames;
  });
  play(end, "play-final");
  return <AbsoluteFill style={{ background: "#000" }}>{parts}</AbsoluteFill>;
};

const SceneEntrance: React.FC<{ type: Entrance; seconds: number; children: React.ReactNode }> = ({
  type,
  seconds,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const length = Math.max(1, Math.round(seconds * fps));
  if (type === "cut") return <>{children}</>;
  const p = interpolate(frame, [0, length], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  if (type === "fade") return <AbsoluteFill style={{ opacity: p }}>{children}</AbsoluteFill>;
  if (type === "wipe") {
    return <AbsoluteFill style={{ clipPath: `inset(0 ${100 - p * 100}% 0 0)` }}>{children}</AbsoluteFill>;
  }
  const flash = interpolate(frame, [0, 3, 9], [0, 0.9, 0], clamp);
  return (
    <AbsoluteFill>
      {children}
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

const AnimatedOverlay: React.FC<{ animation: Animation; children: React.ReactNode; style?: React.CSSProperties }> = ({
  animation,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const fade = interpolate(frame, [0, Math.max(1, Math.round(0.24 * fps))], [0, 1], clamp);
  const movement = animation === "pop" ? `scale(${0.78 + progress * 0.22})` :
    animation === "slide-left" ? `translateX(${(1 - progress) * 90}px)` :
    animation === "slide-right" ? `translateX(${(progress - 1) * 90}px)` :
    animation === "rise" ? `translateY(${(1 - progress) * 54}px)` : "none";
  return <div style={{ ...style, opacity: fade, transform: movement }}>{children}</div>;
};

const FocusOverlay: React.FC<{ item: Extract<Overlay, { kind: "focus" }> }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const color = item.color ?? DA.colors.highlight;
  const panelX = item.side === "left" ? Math.max(48, item.x - 420) : Math.min(1480, item.x + item.width + 34);
  const panelY = Math.max(54, Math.min(900, item.y + item.height / 2 - 72));
  const targetX = item.side === "left" ? panelX + 340 : panelX;
  const targetY = panelY + 40;
  const anchorX = item.side === "left" ? item.x : item.x + item.width;
  const anchorY = item.y + item.height / 2;
  const midX = (anchorX + targetX) / 2;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={DA.width} height={DA.height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={`M ${anchorX} ${anchorY} C ${midX} ${anchorY}, ${midX} ${targetY}, ${targetX} ${targetY}`} fill="none" stroke={color} strokeWidth={3} strokeDasharray={520} strokeDashoffset={520 * (1 - reveal)} opacity={0.95} />
        <circle cx={anchorX} cy={anchorY} r={12 + Math.sin(frame / 5) * 3} fill={color} opacity={0.9} />
        <circle cx={anchorX} cy={anchorY} r={26 + Math.sin(frame / 5) * 5} fill="none" stroke={color} strokeWidth={3} opacity={0.6} />
      </svg>
      <div style={{ position: "absolute", left: item.x, top: item.y, width: item.width, height: item.height, border: `2px dashed ${DA.colors.seafoam}`, boxShadow: `0 0 0 9999px rgba(10,9,22,${0.22 * reveal}), inset 0 0 30px ${color}22, 0 0 36px ${color}88`, clipPath: `inset(0 0 0 0)`, opacity: reveal }}>
        <div style={{ position: "absolute", left: -3, top: -3, width: 34, height: 34, borderTop: `8px solid ${color}`, borderLeft: `8px solid ${color}`, filter: `drop-shadow(0 0 7px ${color})` }} />
        <div style={{ position: "absolute", right: -3, bottom: -3, width: 34, height: 34, borderBottom: `8px solid ${DA.colors.coral}`, borderRight: `8px solid ${DA.colors.coral}`, filter: `drop-shadow(0 0 7px ${DA.colors.coral})` }} />
      </div>
      <div style={{ position: "absolute", left: panelX, top: panelY, width: 338, padding: "18px 22px", clipPath: "polygon(0 0, 100% 0, 100% 86%, 88% 100%, 0 100%)", background: `linear-gradient(125deg, ${DA.colors.paper}, #f7c8be)`, borderTop: `5px solid ${color}`, color: DA.colors.ink, fontFamily: DA.font, opacity: reveal, transform: `translateX(${(1 - reveal) * (item.side === "left" ? -28 : 28)}px)` }}>
        <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 4, color: DA.colors.magenta, marginBottom: 8 }}>VICE CITY · REPÈRE VISUEL</div>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 0.5, textShadow: `1px 2px 0 ${DA.colors.coral}55` }}>{item.title.toUpperCase()}</div>
        {item.detail && <div style={{ marginTop: 8, fontSize: 18, lineHeight: 1.3, color: DA.colors.ink }}>{item.detail}</div>}
      </div>
    </AbsoluteFill>
  );
};

const WantedOverlay: React.FC<{ item: Extract<Overlay, { kind: "wanted" }> }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 115 } });
  const palette = { pursuit: DA.colors.highlight, search: DA.colors.red, unknown: DA.colors.paper, identified: "#a8a5b5" };
  const accent = palette[item.mode];
  return (
    <div style={{ position: "absolute", left: item.x ?? 1188, top: item.y ?? 116, width: 620, padding: "28px 32px", clipPath: "polygon(0 0, 100% 0, 100% 88%, 96% 100%, 0 100%)", borderTop: `5px solid ${accent}`, background: "linear-gradient(145deg, rgba(24,23,49,.97), rgba(48,32,54,.94))", boxShadow: "0 18px 55px #0009", color: "white", fontFamily: DA.font, opacity: enter, transform: `translateY(${(1 - enter) * -32}px)` }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 162, height: 4, background: `linear-gradient(90deg, ${DA.colors.coral}, ${DA.colors.gold})` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: DA.colors.gold, fontSize: 15, fontWeight: 900, letterSpacing: 4 }}><span>VICE CITY · RECHERCHE</span><span style={{ color: accent }}>{item.stars}/6</span></div>
      <div style={{ display: "flex", gap: 12, margin: "18px 0 15px" }}>
        {Array.from({ length: 6 }, (_, i) => {
          const on = i < item.stars ? interpolate(frame, [10 + i * 7, 22 + i * 7], [0.2, 1], clamp) : 0.13;
          return <div key={i} style={{ width: 68, height: 64, display: "grid", placeItems: "center", color: accent, fontSize: 56, lineHeight: 1, opacity: on, textShadow: on > 0.5 ? `0 0 24px ${accent}99` : "none", transform: `scale(${i < item.stars ? 0.82 + 0.18 * spring({ frame: frame - 10 - i * 7, fps, config: { damping: 12, stiffness: 150 } }) : 0.82})` }}>{item.mode === "unknown" ? "☆" : "★"}</div>;
        })}
      </div>
      <div style={{ color: accent, fontSize: 27, fontWeight: 900, letterSpacing: 1 }}>{item.state.toUpperCase()}</div>
      <div style={{ marginTop: 7, color: "#fff", fontSize: 19, lineHeight: 1.35 }}>{item.detail}</div>
    </div>
  );
};

const HeatOverlay: React.FC<{ item: Extract<Overlay, { kind: "heat" }> }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const known = ["CAMÉRA", "TENUE", "VISAGE", "ARME", "VÉHICULE", "BINÔME"];
  const glyph: Record<string, string> = { "CAMÉRA": "◉", "TENUE": "▤", "VISAGE": "◌", "ARME": "⌁", "VÉHICULE": "▰", "BINÔME": "Ⅱ" };
  return (
    <div style={{ position: "absolute", left: 112, right: 112, bottom: 94, padding: "22px 26px 24px", clipPath: "polygon(0 0, 100% 0, 100% 92%, 98% 100%, 0 100%)", background: "linear-gradient(115deg, rgba(24,23,49,.97), rgba(49,30,55,.94))", borderTop: `3px solid ${DA.colors.coral}`, boxShadow: "0 18px 60px #0009", color: "white", fontFamily: DA.font }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 3, textShadow: `2px 2px 0 ${DA.colors.magenta}66` }}>{(item.title ?? "MÉMOIRE POLICIÈRE · CHALEUR").toUpperCase()}</div>
        <div style={{ color: DA.colors.gold, fontSize: 15, letterSpacing: 3, fontWeight: 900 }}>VICE CITY / INDICES CONNUS</div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {known.map((name, i) => {
          const active = item.clues.includes(name);
          const p = spring({ frame: frame - i * 7, fps, config: { damping: 16, stiffness: 125 } });
          return <div key={name} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 10px", border: `1px solid ${active ? DA.colors.coral : "#ffffff22"}`, borderBottom: `3px solid ${active ? DA.colors.gold : "#ffffff22"}`, background: active ? `linear-gradient(140deg, ${DA.colors.magenta}55, ${DA.colors.coral}24)` : "#ffffff06", opacity: active ? p : 0.36, transform: `translateY(${(1 - p) * 15}px) skewY(-0.6deg)` }}><div style={{ fontSize: 31, fontWeight: 900, color: active ? DA.colors.gold : DA.colors.rose, textShadow: active ? `0 0 16px ${DA.colors.coral}` : "none" }}>{glyph[name]}</div><div style={{ fontSize: 19, fontWeight: 900, letterSpacing: 1 }}>{name}</div></div>;
        })}
      </div>
    </div>
  );
};

const SearchOverlay: React.FC<{ item: Extract<Overlay, { kind: "search" }> }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [0, Math.max(1, Math.round((item.duration ?? 5) * fps))], [0, 1], clamp);
  const cx = 1340, cy = 465;
  const points = item.route;
  const routePath = points.map((point, i) => `${i === 0 ? "M" : "L"} ${point[0]} ${point[1]}`).join(" ");
  const segment = Math.min(points.length - 2, Math.floor(p * (points.length - 1)));
  const local = p * (points.length - 1) - segment;
  const from = points[segment] ?? points[0];
  const to = points[Math.min(points.length - 1, segment + 1)] ?? points[points.length - 1];
  const carX = from[0] + (to[0] - from[0]) * local;
  const carY = from[1] + (to[1] - from[1]) * local;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={DA.width} height={DA.height} style={{ position: "absolute", inset: 0 }}>
        <circle cx={cx} cy={cy} r={246 * p} fill={`${DA.colors.red}12`} stroke={DA.colors.highlight} strokeWidth={3} strokeDasharray="11 14" opacity={0.74} />
        <circle cx={cx} cy={cy} r={150 * p} fill={`${DA.colors.red}18`} stroke={DA.colors.red} strokeWidth={4} opacity={0.9} />
        <circle cx={cx} cy={cy} r={12} fill={DA.colors.highlight} />
        <circle cx={cx} cy={cy} r={32 + 7 * Math.sin(frame / 6)} fill="none" stroke={DA.colors.highlight} strokeWidth={3} opacity={0.75} />
        <path d={routePath} fill="none" stroke={DA.colors.magenta} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={900} strokeDashoffset={900 * (1 - p)} />
        <path d={routePath} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 18" opacity={0.8} />
        <g transform={`translate(${carX} ${carY}) rotate(-24)`}><path d="M0 -21 L15 16 L0 10 L-15 16 Z" fill={DA.colors.highlight} stroke={DA.colors.night} strokeWidth={3} /></g>
      </svg>
      <div style={{ position: "absolute", left: 112, bottom: 114, width: 650, padding: "23px 30px", clipPath: "polygon(0 0, 100% 0, 100% 87%, 94% 100%, 0 100%)", borderTop: `4px solid ${DA.colors.coral}`, background: "linear-gradient(125deg, rgba(24,23,49,.97), rgba(42,31,55,.94))", color: "white", fontFamily: DA.font, opacity: p, transform: `translateX(${(1 - p) * -60}px)` }}>
        <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: 4, color: DA.colors.gold }}>VICE CITY · BALAYAGE POLICIER</div>
        <div style={{ marginTop: 10, fontSize: 34, fontWeight: 900, textShadow: `2px 3px 0 ${DA.colors.magenta}99` }}>{item.title}</div>
        <div style={{ marginTop: 8, fontSize: 21, color: DA.colors.seafoam }}>{item.detail}</div>
      </div>
    </AbsoluteFill>
  );
};

const ProfileOverlay: React.FC<{ item: Extract<Overlay, { kind: "profile" }> }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });
  const labels = ["PROFESSIONNEL", "AGRESSIF", "VIOLENT", "PSYCHO"];
  return (
    <div style={{ position: "absolute", left: 112, right: 112, bottom: 102, padding: "24px 30px", clipPath: "polygon(0 0, 100% 0, 100% 92%, 98% 100%, 0 100%)", background: "linear-gradient(120deg, rgba(24,23,49,.97), rgba(48,32,54,.95))", borderTop: `4px solid ${item.shattered ? DA.colors.red : DA.colors.coral}`, boxShadow: "0 18px 55px #0009", color: "white", fontFamily: DA.font }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 30, alignItems: "baseline" }}><div style={{ fontSize: 21, fontWeight: 900, letterSpacing: 3, textShadow: `2px 2px 0 ${DA.colors.magenta}66` }}>VICE CITY · PROFIL CRIMINEL</div><div style={{ color: DA.colors.gold, fontSize: 20 }}>{item.detail}</div></div>
      <div style={{ display: "flex", gap: 9, marginTop: 19, height: 54 }}>
        {labels.map((label, i) => {
          const fill = interpolate(p, [i / 4, Math.min(1, (i + 1) / 4)], [0, 1], clamp);
          const active = item.value >= i + 1;
          const color = i > 1 ? DA.colors.coral : DA.colors.seafoam;
          return <div key={label} style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", clipPath: "polygon(0 0, 100% 0, 96% 100%, 0 100%)", border: `1px solid ${active ? color : "#ffffff26"}`, borderBottom: `3px solid ${active ? DA.colors.gold : "#ffffff26"}`, color: active ? "#fff" : DA.colors.rose, background: "#ffffff08", fontSize: 19, fontWeight: 900, letterSpacing: 1.2 }}>
            <div style={{ position: "absolute", inset: 0, width: `${Math.min(1, Math.max(0, (item.value - i + fill * 0.12))) * 100}%`, background: `linear-gradient(90deg, ${color}cc, ${DA.colors.magenta}aa)`, opacity: active ? 0.8 : 0.18 }} />
            <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
            {item.shattered && i === 3 && <span style={{ position: "absolute", fontSize: 66, color: "#fff", opacity: 0.9, transform: `rotate(${Math.sin(frame / 3) * 3}deg)` }}>╱</span>}
          </div>;
        })}
      </div>
    </div>
  );
};

const OverlayView: React.FC<{ item: Overlay }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const animation = "animation" in item ? item.animation ?? "rise" : "rise";
  const enter = (children: React.ReactNode, style?: React.CSSProperties) => (
    <AnimatedOverlay animation={animation} style={style}>{children}</AnimatedOverlay>
  );

  if (item.kind === "focus") return <FocusOverlay item={item} />;
  if (item.kind === "wanted") return <WantedOverlay item={item} />;
  if (item.kind === "heat") return <HeatOverlay item={item} />;
  if (item.kind === "search") return <SearchOverlay item={item} />;
  if (item.kind === "profile") return <ProfileOverlay item={item} />;

  if (item.kind === "headline") {
    return enter(
      <div style={{ position: "relative", fontFamily: DA.font, color: "white", maxWidth: item.maxWidth ?? 1480, padding: "0 32px 14px 29px", borderLeft: `8px solid ${DA.colors.coral}`, background: "linear-gradient(90deg, rgba(24,23,49,.78), rgba(24,23,49,.38) 70%, transparent)", filter: `drop-shadow(0 10px 20px ${DA.colors.night}99)` }}>
        {item.kicker && <div style={{ display: "inline-flex", alignItems: "center", gap: 9, color: DA.colors.ink, clipPath: "polygon(0 0, 100% 0, 92% 100%, 0 100%)", background: `linear-gradient(100deg, ${DA.colors.gold}, ${DA.colors.coral})`, padding: "8px 19px 8px 14px", fontSize: 17, fontWeight: 900, letterSpacing: 3, marginBottom: 15 }}><span style={{ color: DA.colors.magenta }}>✦</span>{item.kicker.toUpperCase()}</div>}
        <div style={{ fontSize: item.fontSize ?? 88, lineHeight: 0.99, fontWeight: 1000, letterSpacing: -1.5, color: "#fff7ef", textShadow: `3px 4px 0 ${DA.colors.magenta}bb, -1px -1px 0 ${DA.colors.seafoam}88, 0 10px 38px #000c`, WebkitTextStroke: `1px ${DA.colors.ink}88`, whiteSpace: "pre-line" }}>{item.text}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 17 }}><div style={{ width: interpolate(frame, [0, 18], [0, 225], clamp), height: 4, background: `linear-gradient(90deg, ${DA.colors.magenta}, ${DA.colors.coral}, ${DA.colors.gold})`, boxShadow: `0 0 16px ${DA.colors.coral}99` }} /><span style={{ width: 8, height: 8, background: DA.colors.seafoam, transform: "rotate(45deg)" }} /></div>
      </div>,
      { position: "absolute", left: item.x ?? 118, top: item.y ?? 156 },
    );
  }

  if (item.kind === "caption") {
    return enter(
      <div style={{ position: "relative", clipPath: "polygon(0 0, 100% 0, 100% 87%, 98% 100%, 0 100%)", borderTop: `3px solid ${DA.colors.gold}`, borderLeft: `9px solid ${DA.colors.coral}`, background: "linear-gradient(105deg, rgba(24,23,49,.96), rgba(34,21,48,.85) 82%, rgba(34,21,48,.42))", color: "#fff8f1", padding: "20px 29px 24px", maxWidth: 1450, font: `750 34px/1.23 ${DA.font}`, letterSpacing: 0.2, textShadow: `1px 2px 0 ${DA.colors.magenta}66`, boxShadow: `0 14px 0 ${DA.colors.magenta}88, 0 24px 46px #0008` }}>{item.text}</div>,
      { position: "absolute", left: 118, bottom: 105 },
    );
  }

  if (item.kind === "quote") {
    const quote = item.highlight && item.text.includes(item.highlight)
      ? item.text.split(item.highlight)
      : [item.text];
    return enter(
      <div style={{ position: "relative", width: 960, padding: "42px 50px", clipPath: "polygon(0 0, 96% 0, 100% 8%, 100% 100%, 0 100%)", borderLeft: `8px solid ${DA.colors.magenta}`, borderTop: `2px solid ${DA.colors.gold}`, background: `linear-gradient(135deg, ${DA.colors.paper}, #fff3dc 60%, #f6c8c0)`, boxShadow: `13px 14px 0 ${DA.colors.magenta}99, 0 26px 56px #0009`, color: DA.colors.ink, fontFamily: DA.font }}>
        <div style={{ color: DA.colors.magenta, fontSize: 17, letterSpacing: 5, fontWeight: 900, marginBottom: 22 }}>VICE CITY ✦ SOURCE / GTA VI</div>
        <div style={{ fontSize: 43, fontWeight: 900, lineHeight: 1.2, textShadow: `1px 2px 0 ${DA.colors.coral}66` }}>
          {quote.length === 1 ? item.text : <>{quote[0]}<span style={{ background: `linear-gradient(transparent 48%, ${DA.colors.gold} 48%)`, color: DA.colors.ink }}>{item.highlight}</span>{quote.slice(1).join(item.highlight)}</>}
        </div>
        <div style={{ marginTop: 26, paddingTop: 14, borderTop: `1px solid ${DA.colors.magenta}88`, color: DA.colors.magenta, opacity: 0.9, fontSize: 18, letterSpacing: 2, fontWeight: 800 }}>{item.source}</div>
      </div>,
      { position: "absolute", left: 118, top: 185 },
    );
  }

  if (item.kind === "label") {
    const color = item.color ?? DA.colors.orange;
    return enter(
      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontFamily: DA.font, alignItems: "flex-start" }}>
        <div style={{ position: "relative", clipPath: "polygon(0 0, 100% 0, 92% 100%, 0 100%)", color: DA.colors.ink, background: `linear-gradient(100deg, ${color}, ${DA.colors.gold})`, padding: "13px 34px 13px 21px", fontSize: 25, fontWeight: 1000, letterSpacing: 1.2, boxShadow: `7px 7px 0 ${DA.colors.magenta}99, 0 12px 26px #0008`, textShadow: `1px 1px 0 ${DA.colors.paper}` }}><span style={{ color: DA.colors.magenta, marginRight: 11 }}>✦</span>{item.text.toUpperCase()}</div>
        {item.detail && <div style={{ color: DA.colors.paper, background: "linear-gradient(90deg, rgba(24,23,49,.96), rgba(24,23,49,.72))", borderLeft: `3px solid ${DA.colors.seafoam}`, padding: "9px 16px", font: `650 19px ${DA.font}`, boxShadow: "0 8px 20px #0006" }}>{item.detail}</div>}
        <div style={{ position: "absolute", left: -8, top: -8, width: 17, height: 17, background: DA.colors.seafoam, transform: "rotate(45deg)", boxShadow: `0 0 0 5px ${DA.colors.seafoam}33` }} />
      </div>,
      { position: "absolute", left: item.x, top: item.y },
    );
  }

  if (item.kind === "stat") {
    const count = spring({ frame, fps, config: { damping: 20, stiffness: 90 } });
    return enter(
      <div style={{ position: "relative", minWidth: 370, padding: "26px 34px 30px", clipPath: "polygon(0 0, 100% 0, 100% 91%, 94% 100%, 0 100%)", background: "linear-gradient(135deg, rgba(24,23,49,.97), rgba(48,32,54,.92))", borderTop: `4px solid ${DA.colors.coral}`, borderLeft: `5px solid ${DA.colors.seafoam}`, fontFamily: DA.font, color: "white", boxShadow: `8px 10px 0 ${DA.colors.magenta}88, 0 20px 48px #0008` }}>
        <div style={{ position: "absolute", right: 20, top: 14, fontSize: 13, fontWeight: 900, color: DA.colors.gold, letterSpacing: 3 }}>VICE CITY / FILE</div>
        <div style={{ fontSize: 72, lineHeight: 1, fontWeight: 1000, color: DA.colors.gold, transform: `scale(${0.8 + count * 0.2})`, transformOrigin: "left center", textShadow: `3px 4px 0 ${DA.colors.magenta}` }}>{item.value}</div>
        <div style={{ marginTop: 12, fontSize: 23, fontWeight: 900, letterSpacing: 2, textShadow: `2px 2px 0 ${DA.colors.magenta}77` }}>{item.label.toUpperCase()}</div>
        {item.detail && <div style={{ marginTop: 10, color: DA.colors.seafoam, fontSize: 18 }}>{item.detail}</div>}
      </div>,
      { position: "absolute", right: 118, bottom: 105 },
    );
  }

  const row = (text: string, index: number, color: string) => {
    const shown = interpolate(frame, [8 + index * 9, 18 + index * 9], [0, 1], clamp);
    return <div key={`${index}-${text}`} style={{ display: "flex", gap: 18, alignItems: "center", opacity: shown, padding: "13px 0", borderBottom: `1px solid ${DA.colors.magenta}33`, color, fontSize: 23, fontWeight: 850 }}><span style={{ color: index === item.lines.length ? DA.colors.coral : DA.colors.magenta, textShadow: `0 0 12px ${DA.colors.coral}99` }}>{index === item.lines.length ? "✦" : "◆"}</span>{text}</div>;
  };
  return enter(
    <div style={{ position: "relative", width: 670, background: `linear-gradient(135deg, ${DA.colors.paper}, #fff4e4 72%, #f5c2b7)`, color: DA.colors.ink, padding: "30px 38px", clipPath: "polygon(0 0, 96% 0, 100% 4%, 100% 100%, 0 100%)", boxShadow: `10px 12px 0 ${DA.colors.magenta}99, 0 28px 70px #0009`, fontFamily: DA.font, transform: `perspective(1000px) rotateY(${interpolate(frame, [0, 18], [14, 0], clamp)}deg)` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 18, fontWeight: 900, letterSpacing: 3, paddingBottom: 18, borderBottom: `3px solid ${DA.colors.magenta}`, color: DA.colors.ink }}><span>{item.title.toUpperCase()}</span><span style={{ background: DA.colors.magenta, color: "white", padding: "5px 9px", fontSize: 13 }}>VC / DOSSIER</span></div>
      {item.lines.map((line, index) => row(line, index, DA.colors.ink))}
      {item.reveal && row(item.reveal, item.lines.length, DA.colors.red)}
    </div>,
    { position: "absolute", left: item.x ?? 118, top: item.y ?? 155, width: item.width ?? 670 },
  );
};

const SceneContent: React.FC<{ scene: Scene; frames: number }> = ({ scene, frames }) => {
  const { fps } = useVideoConfig();
  const pace = scene.pace ?? "steady";
  return (
    <AbsoluteFill style={{ backgroundColor: DA.colors.night }}>
      {scene.visual.type === "image" ? (
        <SceneImage src={scene.visual.src} camera={scene.visual.camera ?? "push"} pace={pace} frames={frames} />
      ) : scene.visual.type === "video" ? (
        <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
          <VideoWithPauses media={scene.visual} seconds={scene.seconds} />
          <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(24,23,49,.36), transparent 58%)" }} />
        </AbsoluteFill>
      ) : scene.visual.type === "pip" ? (
        <PictureInPicture scene={scene} media={scene.visual} frames={frames} />
      ) : scene.visual.type === "montage" ? (
        <MontageVisual media={scene.visual} frames={frames} />
      ) : scene.visual.type === "motion" ? (
        <MotionCanvas visual={scene.visual} />
      ) : (
        <GraphicBackground style={scene.visual.style} />
      )}
      {scene.voice && (
        <Sequence durationInFrames={Math.round(scene.seconds * fps)}>
          <Audio src={staticFile(scene.voice)} />
        </Sequence>
      )}
      {scene.overlays.map((item, index) => (
        <Sequence key={`${scene.id}-${index}`} from={Math.round(item.t * fps)} layout="none">
          <OverlayView item={item} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const framesForScenes = (scenes: Scene[], fps: number) =>
  scenes.reduce((total, scene) => total + Math.max(1, Math.round(scene.seconds * fps)), 0);

export const ExplainerVideo: React.FC<{ scenes: Scene[] }> = ({ scenes }) => {
  const { fps } = useVideoConfig();
  if (scenes.length === 0) {
    return (
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 68% 32%, ${DA.colors.plum}, ${DA.colors.night} 70%)`, color: "white", alignItems: "center", justifyContent: "center", fontFamily: DA.font }}>
        <div style={{ color: DA.colors.highlight, fontSize: 26, fontWeight: 900, letterSpacing: 10 }}>ELMACCATO · GTA VI</div>
        <div style={{ marginTop: 24, fontSize: 68, fontWeight: 900 }}>EXPLAINER</div>
        <div style={{ marginTop: 18, color: DA.colors.rose, fontSize: 22 }}>Le moteur attend le script et son découpage en scènes.</div>
      </AbsoluteFill>
    );
  }

  let cursor = 0;
  return (
    <AbsoluteFill
      style={{
        background: DA.colors.night,
        translate: "-3px 0px"
      }}
    >
      {scenes.map((scene, index) => {
        const duration = Math.max(1, Math.round(scene.seconds * fps));
        const entrance = scene.entrance ?? { type: index === 0 ? "cut" as const : "fade" as const, seconds: 0.45 };
        const overlap = index > 0 ? Math.round((entrance.seconds ?? 0.45) * fps) : 0;
        const from = Math.max(0, cursor - overlap);
        const frameCount = duration + overlap;
        cursor += duration;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={frameCount}>
            <SceneEntrance type={entrance.type} seconds={entrance.seconds ?? 0.45}>
              <SceneContent scene={scene} frames={duration} />
            </SceneEntrance>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
