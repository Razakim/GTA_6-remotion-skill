/** Shared visual identity for every Elmaccato GTA VI explainer. */
export const DA = {
  colors: {
    night: "#181731",
    plum: "#302036",
    rose: "#e0c9da",
    magenta: "#d6447f",
    highlight: "#f49ac1",
    paper: "#f3ead8",
    ink: "#2a2233",
    green: "#37c28a",
    orange: "#f5a524",
    red: "#d93a4a",
    sunset: "#ffad8b",
    coral: "#f36f83",
    seafoam: "#84dfd0",
    electric: "#8ed8f2",
    gold: "#ffdc9f",
  },
  font: 'Montserrat, Inter, "Arial Narrow", sans-serif',
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

export type Pace = "slow" | "steady" | "fast";
