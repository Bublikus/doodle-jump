import { InputHandler } from "./InputHandler";

type DoubleJumpConfig = {
  renderer: Renderer;
  width?: number;
  height?: number;
  tickMs?: number;
  characterSpeed?: number;
  maxScore?: number;
};

type PlayerState = {
  x: number;
  y: number;
  velocityY: number;
  isJumping: boolean;
  score: number;
};

type Obstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
  moveX?: number;
};

type Renderer = (
  player: PlayerState,
  obstacles: Obstacle[],
  score: number
) => void;

export class DoubleJump {
  private config: Required<DoubleJumpConfig>;
  private player: PlayerState;
  private obstacles: Obstacle[] = [];
  private tickInterval: ReturnType<typeof setInterval> | undefined;
  private renderer: Renderer = () => null;
  private inputHandler: InputHandler | undefined;

  spots: number = 0;
  isPaused: boolean = false;
  isEndGame: boolean = false;

  constructor(config: DoubleJumpConfig) {
    this.config = {
      renderer: config.renderer,
      width: config.width || 800,
      height: config.height || 600,
      tickMs: config.tickMs || 50,
      characterSpeed: config.characterSpeed || 5,
      maxScore: config.maxScore || 100,
    };

    this.player = {
      x: 100,
      y: this.config.height - 50,
      velocityY: 0,
      isJumping: false,
      score: 0,
    };

    this.renderer = this.config.renderer;
    this.initObstacles();
  }

  private initObstacles() {
    // Initialize obstacles with some logic
  }

  start() {
    this.isEndGame = false;
    this.player.score = 0;
    this.bindKeys();
    this.startTick();
  }

  pause() {
    this.isPaused = true;
    clearInterval(this.tickInterval);
  }

  play() {
    this.isPaused = false;
    this.startTick();
  }

  private bindKeys() {
    // Implement key bindings for jump and other actions
  }

  private startTick() {
    this.tickInterval = setInterval(() => {
      if (this.isPaused || this.isEndGame) return;

      this.gameTick();
      this.renderer(this.player, this.obstacles, this.player.score);
    }, this.config.tickMs);
  }

  private gameTick() {
    // Implement the logic for player movement, obstacle movement, collision detection, etc.
  }

  destroy() {
    this.inputHandler?.destroy();
  }
}
