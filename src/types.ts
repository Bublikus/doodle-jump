type Coords = { x: number; y: number };
type Size = { width: number; height: number };
type Platform = {
  position: Coords;
  size: Size;
  type: "normal" | "moving" | "vanishing";
};

export type RenderData = {
  player: { position: Coords; size: Size };
  platforms: Platform[];
  score: number;
  isGameOver: boolean;
};
