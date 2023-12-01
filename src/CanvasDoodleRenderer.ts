type Coords = { x: number; y: number };
type Platform = { position: Coords; type: "normal" | "moving" | "vanishing" };
type RenderData = {
  player: Coords;
  platforms: Platform[];
  score: number;
};

export class CanvasDoodleRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private resizeObserver: ResizeObserver;
  private playerNormalizedSize: { width: number; height: number };
  private platformNormalizedSize: { width: number; height: number };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Resize the canvas container to adapt the canvas ratio
    this.canvas.width = canvas.clientWidth;
    this.canvas.height = canvas.clientHeight;
    this.resizeObserver = new ResizeObserver((entries) => {
      this.canvas.width = entries[0].contentRect.width;
      this.canvas.height = entries[0].contentRect.height;
    });
    this.resizeObserver.observe(canvas);

    this.ctx = canvas.getContext("2d")!;
    this.playerNormalizedSize = { width: 0.1, height: 0.1 };
    this.platformNormalizedSize = { width: 0.14, height: 0.04 };
  }

  private getCanvasX(x: number): number {
    return x * this.canvas.width;
  }

  private getCanvasY(y: number): number {
    return y * this.canvas.height;
  }

  private getCanvasWidth(width: number): number {
    return width * this.canvas.width;
  }

  private getCanvasHeight(height: number): number {
    return height * this.canvas.height;
  }

  public update({ player, platforms }: RenderData): void {
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw the player
    this.ctx.fillStyle = "blue";
    this.ctx.fillRect(
      this.getCanvasX(player.x),
      this.getCanvasY(player.y),
      this.getCanvasWidth(this.playerNormalizedSize.width),
      this.getCanvasHeight(this.playerNormalizedSize.height)
    );

    // Draw the platforms
    this.ctx.fillStyle = "green";
    platforms.forEach((platform) => {
      this.ctx.fillRect(
        this.getCanvasX(platform.position.x),
        this.getCanvasY(platform.position.y),
        this.getCanvasWidth(this.platformNormalizedSize.width),
        this.getCanvasHeight(this.platformNormalizedSize.height)
      );
    });
  }

  public destroy() {
    this.resizeObserver.unobserve(this.canvas);
  }
}
