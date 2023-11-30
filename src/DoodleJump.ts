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
type Size = { width: number; height: number };
type Platform = {
  size: Size;
  position: Coords;
  type: "normal" | "moving" | "vanishing";
};
type Renderer = (data: {
  player: Coords;
  platforms: Platform[];
  score: number;
}) => void;

export class DoodleJump {
  private playerPosition: Coords;
  private playerHeight: number = 0.1;
  private playerWidth: number = 0.1;
  private platforms: Platform[];
  private platformHeight: number = 0.04;
  private platformWidth: number = 0.14;
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
      width: 1,
      height: 1,
      gravity: 0.001,
      jumpHeight: 0.03,
      platformSpeed: 0.001,
      scorePerPlatform: 1,
      ...config,
    };
    this.playerPosition = { x: 0.5, y: 0.5 };
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
    this.inputHandler = new InputHandler({ swipeTickThresholdPX: 20 });
    this.inputHandler.handleActions({
      ArrowLeft: () => this.movePlayerLeft(),
      ArrowRight: () => this.movePlayerRight(),
      swipeLeft: () => this.movePlayerLeft(),
      swipeRight: () => this.movePlayerRight(),
    });
  }

  private movePlayerLeft() {
    const moveAmount = 0.05;
    this.playerPosition.x = Math.max(0, this.playerPosition.x - moveAmount);
  }

  private movePlayerRight() {
    const moveAmount = 0.05;
    this.playerPosition.x = Math.min(
      this.config.width,
      this.playerPosition.x + moveAmount
    );
  }

  private generateInitialPlatforms() {
    for (let i = 0; i < 10; i++) {
      this.platforms.push({
        size: {
          width: this.platformWidth,
          height: this.platformHeight,
        },
        position: {
          x: Math.random() * this.config.width,
          y: i / 10,
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
        size: { width: this.platformWidth, height: this.platformHeight },
        position: { x: Math.random() * this.config.width, y: yPos },
        type: "normal",
      });
    }
  }

  private checkCollisions() {
    this.platforms.forEach((platform) => {
      if (
        this.playerPosition.x + this.playerWidth >= platform.position.x &&
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
    // Adjust the render call to account for normalized coordinates
    this.renderer({
      player: this.playerPosition,
      platforms: this.platforms.map((platform) => ({
        size: platform.size,
        position: platform.position,
        type: platform.type,
      })),
      score: this.score,
    });
  }
}
