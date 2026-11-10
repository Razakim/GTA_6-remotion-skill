import { Composition, type CalculateMetadataFunction } from "remotion";
import { ExplainerVideo, framesForScenes, type Scene } from "./ExplainerVideo";
import { DA } from "./da/tokens";
import sceneData from "./data/scenes.json";
import motionRecipeData from "./data/motion-recipes.example.json";

type Props = { scenes: Scene[] };
const scenes = sceneData as Scene[];
const motionRecipe = motionRecipeData as Scene[];

const calculateMetadata: CalculateMetadataFunction<Props> = ({ props }) => ({
  durationInFrames: Math.max(DA.fps * 5, framesForScenes(props.scenes, DA.fps)),
});

export const MyComposition = () => (
  <>
    <Composition
      id="GTA6Explainer"
      component={ExplainerVideo}
      durationInFrames={DA.fps * 5}
      fps={DA.fps}
      width={DA.width}
      height={DA.height}
      defaultProps={{ scenes }}
      calculateMetadata={calculateMetadata}
    />
    <Composition
      id="MotionCanvasLab"
      component={ExplainerVideo}
      durationInFrames={DA.fps * 6}
      fps={DA.fps}
      width={DA.width}
      height={DA.height}
      defaultProps={{ scenes: motionRecipe }}
      calculateMetadata={calculateMetadata}
    />
  </>
);
