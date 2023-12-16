import { InputHandler } from "./InputHandler";
import { RenderData } from "./types";

const isTouch = Boolean("ontouchstart" in window || navigator.maxTouchPoints);

type Config = {
  renderer: Renderer;
  gravity?: number;
  jumpHeight?: number;
};

type Coords = { x: number; y: number };
type Size = { width: number; height: number };
type Player = {
  position: Coords;
  size: Size;
};
type Platform = {
  size: Size;
  position: Coords;
  type: "normal" | "moving" | "vanishing";
};
type Renderer = (data: RenderData) => void;

export class DoodleJump {
  private game = { width: 1, height: 1 };
  private player: Player = {
    position: { x: 0, y: 0 },
    size: { width: 0.1, height: 0.1 },
  };
  private acceleration: number = 0;
  private accelerationFactor: number = 0.7 * (isTouch ? 2 : 1);
  private accelerationMax: number = 5 * (isTouch ? 2 : 1);
  private platforms: Platform[] = [];
  private platformHeight: number = 0.04;
  private platformWidth: number = 0.14;
  private animationFrameRequest: number = 0;
  private platformsPerScreen: number = 10;
  private velocity: number = 0;
  private lastFrameTime: number = 0;
  private deltaTime: number = 0;
  private inputHandler: InputHandler | undefined;
  private renderer: Renderer = () => null;

  config: Required<Config>;
  score: number = 0;
  isPaused: boolean = false;
  isGameOver: boolean = false;

  constructor(config: Config) {
    this.config = {
      gravity: 1.6,
      jumpHeight: 1,
      ...config,
    };
    this.renderer = this.config.renderer;
    return this;
  }

  start() {
    this.bindKeys();
    this.init();
    this.animationFrameRequest = requestAnimationFrame(this.gameLoop);
    return this;
  }

  pause() {
    this.isPaused = true;
  }

  play() {
    this.isPaused = false;
  }

  destroy() {
    cancelAnimationFrame(this.animationFrameRequest);
    this.inputHandler?.destroy();
  }

  private init() {
    this.isGameOver = false;
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    this.score = 0;
    this.acceleration = 0;
    this.velocity = 0;
    this.platforms = [];

    this.generateInitialPlatforms();
    this.generateInitialPlayer();
  }

  private bindKeys() {
    this.inputHandler?.destroy();
    this.inputHandler = new InputHandler({
      swipeTickThresholdPX: 1,
      fireKeyHoldPerFrame: true,
    });
    this.inputHandler.handleActions({
      ArrowLeft: () => this.movePlayerLeft(),
      ArrowRight: () => this.movePlayerRight(),
      Space: () => this.pause(),
      swipeLeft: () => this.movePlayerLeft(),
      swipeRight: () => this.movePlayerRight(),
      tap: () => this.pause(),
    });
  }

  private movePlayerLeft() {
    this.play();
    this.acceleration = Math.max(
      -this.accelerationMax,
      this.acceleration - this.accelerationFactor
    );
  }

  private movePlayerRight() {
    this.play();
    this.acceleration = Math.min(
      this.acceleration + this.accelerationFactor,
      this.accelerationMax
    );
  }

  private generateInitialPlatforms() {
    const xRange = this.game.width - this.platformWidth;
    let firstPlatformX = this.game.width / 2 - this.platformWidth / 2;

    for (let i = 0; i < this.platformsPerScreen; i++) {
      let x = Math.random() * xRange;
      const y = i / this.platformsPerScreen;

      // Make sure the first platform is always in the middle
      if (i === this.platformsPerScreen - 1) {
        x = firstPlatformX;
      }

      // Make sure the second to 4th platforms are always X away from the first 4 platforms
      if (this.platformsPerScreen - i > 1 && this.platformsPerScreen - i < 5) {
        const range1 = (x / xRange) * (firstPlatformX - this.platformWidth);
        const range2 = range1 + (firstPlatformX + this.platformWidth);
        x = Math.random() > 0.5 ? range1 : range2;
      }

      this.platforms.push({
        size: {
          width: this.platformWidth,
          height: this.platformHeight,
        },
        position: { x, y },
        type: "normal",
      });
    }
  }

  private generateInitialPlayer() {
    const lastPlatform = this.platforms[this.platforms.length - 1];
    const lastPlatformWidth = lastPlatform.size.width;
    const lastPlatformCenterX = lastPlatform.position.x + lastPlatformWidth / 2;

    this.player.position.x = lastPlatformCenterX - this.player.size.width / 2;
    this.player.position.y = lastPlatform.position.y - this.player.size.height;
  }

  private gameLoop = (time: number) => {
    this.animationFrameRequest = requestAnimationFrame(this.gameLoop);

    // Calculate delta time
    const delta = time - this.lastFrameTime;
    this.deltaTime = this.lastFrameTime ? delta / 1000 : 0;
    this.lastFrameTime = time;

    // Don't update game logic if the game is paused or over
    if (this.isPaused || this.isGameOver) return;

    // Update game logic
    this.updatePlayer();

    // Update platforms if the player is near the top of the screen
    if (this.player.position.y < this.game.height / 2 && this.velocity < 0) {
      this.updatePlatforms();
    }

    this.checkCollisions();

    this.render();

    if (this.isGameOver) {
      this.destroy();
    }
  };

  private updatePlayer() {
    // calculate the player distance from the half of the screen
    const distanceAboveHalf = Math.max(
      0,
      this.game.height / 2 - this.player.position.y
    );

    // Apply gravity
    this.velocity += this.config.gravity * this.deltaTime;
    this.player.position.y +=
      this.velocity * this.deltaTime + distanceAboveHalf;

    // Move the player left or right
    this.acceleration /= 2;
    this.acceleration = Math.max(
      -this.accelerationMax,
      Math.min(this.acceleration, this.accelerationMax)
    );
    this.player.position.x += this.acceleration * this.deltaTime;

    // Boundary checks
    if (this.player.position.x < -this.player.size.width) {
      this.player.position.x = this.game.width;
    } else if (this.player.position.x > this.game.width) {
      this.player.position.x = -this.player.size.width;
    }

    // Check for game over
    if (this.player.position.y > this.game.height && !this.isGameOver) {
      this.isGameOver = true;
    }
  }

  private updatePlatforms() {
    // calculate the player distance from the half of the screen
    const distanceAboveHalf = Math.max(
      0,
      this.game.height / 2 - this.player.position.y
    );

    const movement =
      -this.velocity * this.deltaTime +
      (this.velocity < 0 ? distanceAboveHalf : 0) * this.deltaTime;

    this.platforms.forEach((platform) => {
      platform.position.y += movement;
    });

    // Check if platforms have moved off the bottom of the screen
    this.platforms = this.platforms.filter(
      (platform) => platform.position.y < this.game.height
    );

    // Update score
    const filteredPlatformsAmount =
      this.platformsPerScreen - this.platforms.length;
    this.score += filteredPlatformsAmount;

    // Add new platforms at the top as needed
    while (this.platforms.length < this.platformsPerScreen) {
      const x = Math.random() * (this.game.width - this.platformWidth);
      const y = -this.platformHeight;

      this.platforms.push({
        size: { width: this.platformWidth, height: this.platformHeight },
        position: { x, y },
        type: "normal",
      });
    }
  }

  private checkCollisions() {
    this.platforms.forEach((platform) => {
      const isXCollision =
        this.player.position.x + this.player.size.width >=
          platform.position.x &&
        this.player.position.x <= platform.position.x + this.platformWidth;

      const isYCollision =
        this.player.position.y + this.player.size.height >=
          platform.position.y &&
        this.player.position.y + this.player.size.height <=
          platform.position.y + platform.size.height;

      if (isXCollision && isYCollision && this.velocity > 0) {
        // Collision detected, make the player jump
        this.velocity = -this.config.jumpHeight;
      }
    });
  }

  private render() {
    this.renderer({
      player: this.player,
      platforms: this.platforms,
      score: this.score,
      acceleration: this.acceleration,
      isGameOver: this.isGameOver,
    });
  }
}
