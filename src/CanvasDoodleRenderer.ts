import { RenderData } from "./types";
import { CanvasImageLoader } from "./CanvasImageLoader";
import platformImg from "./assets/platform.png";
import doodleRightImg from "./assets/doodle-right.png";

const imageLoader = new CanvasImageLoader();

const imagesMap = new Map<string, CanvasImageSource>();

imageLoader.loadMultipleImages([platformImg, doodleRightImg]).then(() => {
  imagesMap.set(platformImg, imageLoader.getImage(platformImg)!);
  imagesMap.set(doodleRightImg, imageLoader.getImage(doodleRightImg)!);
});

export class CanvasDoodleRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private canvasRatio: number;
  private resizeObserver: ResizeObserver;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    // Resize the canvas container to adapt the canvas ratio
    this.canvas.width = canvas.clientWidth;
    this.canvas.height = canvas.clientHeight;
    this.canvasRatio = this.canvas.width / this.canvas.height;
    this.resizeObserver = new ResizeObserver((entries) => {
      this.canvas.width = entries[0].contentRect.width;
      this.canvas.height = entries[0].contentRect.height;
      this.canvasRatio = this.canvas.width / this.canvas.height;
    });
    this.resizeObserver.observe(canvas);
  }

  private getCanvasX(x: number): number {
    return x * this.canvas.width;
  }

  private getCanvasY(y: number): number {
    return y * this.canvas.height;
  }

  public update({ player, platforms }: RenderData): void {
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!imagesMap.has(doodleRightImg) || !imagesMap.has(platformImg)) {
      return;
    }

    // Draw the platforms images
    platforms.forEach((platform) => {
      const platformImage = imagesMap.get(platformImg)!;
      // @ts-ignore
      const platformAspectRatio = platformImage.width / platformImage.height;
      this.ctx.drawImage(
        platformImage,
        this.getCanvasX(platform.position.x),
        this.getCanvasY(platform.position.y),
        this.getCanvasX(platform.size.width),
        this.getCanvasY(
          (platform.size.width / platformAspectRatio) * this.canvasRatio
        )
      );
    });

    // Draw the player image
    const playerImage = imagesMap.get(doodleRightImg)!;
    // @ts-ignore
    const playerAspectRatio = playerImage.width / playerImage.height;
    this.ctx.drawImage(
      playerImage,
      this.getCanvasX(player.position.x),
      this.getCanvasY(player.position.y),
      this.getCanvasX(player.size.width),
      this.getCanvasY(
        (player.size.width / playerAspectRatio) * this.canvasRatio
      )
    );
  }

  public destroy() {
    this.resizeObserver.unobserve(this.canvas);
  }
}
