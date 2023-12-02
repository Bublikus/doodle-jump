import { RenderData } from "./types";

export class CanvasDoodleRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private resizeObserver: ResizeObserver;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    // Resize the canvas container to adapt the canvas ratio
    this.canvas.width = canvas.clientWidth;
    this.canvas.height = canvas.clientHeight;
    this.resizeObserver = new ResizeObserver((entries) => {
      this.canvas.width = entries[0].contentRect.width;
      this.canvas.height = entries[0].contentRect.height;
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

    // Draw the player
    this.ctx.fillStyle = "blue";
    this.ctx.fillRect(
      this.getCanvasX(player.position.x),
      this.getCanvasY(player.position.y),
      this.getCanvasX(player.size.width),
      this.getCanvasY(player.size.height)
    );

    // Draw the platforms
    this.ctx.fillStyle = "green";
    platforms.forEach((platform) => {
      this.ctx.fillRect(
        this.getCanvasX(platform.position.x),
        this.getCanvasY(platform.position.y),
        this.getCanvasX(platform.size.width),
        this.getCanvasY(platform.size.height)
      );
    });
  }

  public destroy() {
    this.resizeObserver.unobserve(this.canvas);
  }
}
