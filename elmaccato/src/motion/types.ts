export type MotionEase = "linear" | "in" | "out" | "in-out" | "spring";

export type MotionKeyframe = {
  /** Time in seconds relative to the element's start. */
  t: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
  rotation?: number;
  rotationX?: number;
  rotationY?: number;
  opacity?: number;
  blur?: number;
  draw?: number;
  mediaScale?: number;
  mediaX?: number;
  mediaY?: number;
  backgroundColor?: string;
  color?: string;
  fillColor?: string;
  strokeColor?: string;
  ease?: MotionEase;
};

type MotionBase = {
  id: string;
  kind: "group" | "image" | "video" | "text" | "panel" | "shape" | "path";
  /** Start time in seconds from the beginning of the scene. */
  start: number;
  /** Visible duration in seconds. */
  duration: number;
  x: number;
  y: number;
  width: number;
  height: number;
  z?: number;
  rotation?: number;
  rotationX?: number;
  rotationY?: number;
  scale?: number;
  opacity?: number;
  motion?: MotionKeyframe[];
  style?: {
    background?: string;
    color?: string;
    border?: string;
    borderRadius?: number | string;
    boxShadow?: string;
    clipPath?: string;
    overflow?: "hidden" | "visible";
    padding?: number | string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number | string;
    lineHeight?: number | string;
    letterSpacing?: number | string;
    textAlign?: "left" | "center" | "right";
    objectFit?: "cover" | "contain" | "fill";
    objectPosition?: string;
    textShadow?: string;
  };
};

export type MotionElement =
  | (MotionBase & { kind: "group"; children: MotionElement[] })
  | (MotionBase & { kind: "image"; src: string })
  | (MotionBase & { kind: "video"; src: string; sourceFps: number; sourceStart?: number; speed?: number })
  | (MotionBase & { kind: "text"; text: string })
  | (MotionBase & { kind: "panel" | "shape"; shape?: "rect" | "ellipse" | "diamond"; label?: string })
  | (MotionBase & { kind: "path"; d: string; stroke?: string; strokeWidth?: number; pathLength: number; fill?: string });

export type MotionVisual = {
  type: "motion";
  /** Choose a stage per beat. "vice-city" is available, but not forced. */
  stage?: "vice-city" | "plum" | "transparent";
  background?: string;
  elements: MotionElement[];
};
