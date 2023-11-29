import { InputHandler } from "./InputHandler";

type Config = {
  renderer: Renderer;
  width?: number;
  height?: number;
  gravity?: number;
  jumpHeight?: number;
  platformSpeed?: number;
  scorePerPlatform?: number;
};

type Coords = { x: number; y: number };
type Platform = { position: Coords; type: "normal" | "moving" | "vanishing" };
type Renderer = (data: {
  player: Coords;
  platforms: Platform[];
  score: number;
}) => void;

export class DoodleJump {
  private playerPosition: Coords;
  private playerHeight: number = 50;
  private playerWidth: number = 50;
  private platforms: Platform[];
  private platformHeight: number = 20;
  private platformWidth: number = 50;
  private animationFrameRequest: number = 0;
  private velocity: number;
  private renderer: Renderer;
  private keys: { [key: string]: boolean };
  private inputHandler: InputHandler | undefined;

  config: Required<Config>;
  score: number;
  isPaused: boolean;
  isGameOver: boolean;

  constructor(config: Config) {
    this.config = {
      width: 500,
      height: 500,
      gravity: 0.3,
      jumpHeight: 10,
      platformSpeed: 1,
      scorePerPlatform: 1,
      ...config,
    };
    this.playerPosition = {
      x: this.config.width / 2,
      y: this.config.height / 2,
    };
    this.platforms = [];
    this.score = 0;
    this.velocity = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.renderer = config.renderer;
    this.keys = {};

    this.init();
  }

  start() {
    this.isGameOver = false;
    this.score = 0;
    this.generateInitialPlatforms();
    this.bindKeys();
    this.animationFrameRequest = requestAnimationFrame(this.gameLoop);
  }

  pause() {
    this.isPaused = true;
    cancelAnimationFrame(this.animationFrameRequest);
  }

  play() {
    if (this.isPaused) {
      this.isPaused = false;
      this.animationFrameRequest = requestAnimationFrame(this.gameLoop);
    }
  }

  destroy() {
    cancelAnimationFrame(this.animationFrameRequest);
    this.inputHandler?.destroy();
  }

  private init() {
    this.render();
  }

  private bindKeys() {
    this.inputHandler?.destroy();
    this.inputHandler = new InputHandler({ swipeTickThresholdPX: 40 });
    this.inputHandler.handleActions({
      ArrowLeft: () => this.movePlayerLeft(),
      ArrowRight: () => this.movePlayerRight(),
      swipeLeft: () => this.movePlayerLeft(),
      swipeRight: () => this.movePlayerRight(),
    });
  }

  private movePlayerLeft() {
    this.keys["ArrowRight"] = false;
    this.keys["ArrowLeft"] = true;
  }

  private movePlayerRight() {
    this.keys["ArrowLeft"] = false;
    this.keys["ArrowRight"] = true;
  }

  private generateInitialPlatforms() {
    for (let i = 0; i < 10; i++) {
      this.platforms.push({
        position: {
          x: Math.random() * this.config.width,
          y: (this.config.height / 10) * i,
        },
        type: "normal",
      });
    }
  }

  private gameLoop = () => {
    if (this.isPaused || this.isGameOver) return;

    this.updatePlayer();
    this.updatePlatforms();
    this.checkCollisions();
    this.render();

    this.animationFrameRequest = requestAnimationFrame(this.gameLoop);
  };

  private updatePlayer() {
    // Apply gravity
    this.velocity += this.config.gravity;
    this.playerPosition.y += this.velocity;

    // Horizontal movement
    if (this.keys["ArrowLeft"]) {
      this.playerPosition.x -= 5;
    }
    if (this.keys["ArrowRight"]) {
      this.playerPosition.x += 5;
    }

    // Boundary checks
    if (this.playerPosition.x < 0) {
      this.playerPosition.x = 0;
    } else if (this.playerPosition.x > this.config.width) {
      this.playerPosition.x = this.config.width;
    }

    // Check for game over
    if (this.playerPosition.y > this.config.height) {
      this.isGameOver = true;
      this.destroy();
    }
  }

  private updatePlatforms() {
    // Move platforms downward
    this.platforms.forEach((platform) => {
      platform.position.y += this.config.platformSpeed;
    });

    // Remove platforms that have moved off screen
    this.platforms = this.platforms.filter(
      (platform) => platform.position.y < this.config.height
    );

    // Add new platforms
    while (this.platforms.length < 10) {
      let yPos =
        this.platforms[this.platforms.length - 1].position.y -
        this.config.height / 10;
      this.platforms.push({
        position: { x: Math.random() * this.config.width, y: yPos },
        type: "normal",
      });
    }
  }

  private checkCollisions() {
    this.platforms.forEach((platform) => {
      if (
        this.playerPosition.x >= platform.position.x &&
        this.playerPosition.x <= platform.position.x + this.platformWidth &&
        this.playerPosition.y + this.playerHeight >= platform.position.y &&
        this.playerPosition.y + this.playerHeight <=
          platform.position.y + this.platformHeight &&
        this.velocity > 0
      ) {
        // Collision detected, make the player jump
        this.velocity = -this.config.jumpHeight;
        this.score += this.config.scorePerPlatform;
      }
    });
  }

  private render() {
    this.renderer({
      player: this.playerPosition,
      platforms: this.platforms,
      score: this.score,
    });
  }
}
