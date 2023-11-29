type Coords = { x: number; y: number };
type Platform = { position: Coords; type: "normal" | "moving" | "vanishing" };
type RenderData = {
  player: Coords;
  platforms: Platform[];
  score: number;
};

export class DoodleRenderer {
  private gameContainer: HTMLElement;
  private playerElement: HTMLElement;
  private platformElements: HTMLElement[];
  private scoreElement: HTMLElement;

  constructor(gameContainer: HTMLElement) {
    this.gameContainer = gameContainer;
    this.playerElement = this.createPlayerElement();
    this.platformElements = [];
    this.scoreElement = this.createScoreElement();
  }

  private createPlayerElement(): HTMLElement {
    const player = document.createElement("div");
    player.style.position = "absolute";
    player.style.width = "50px";
    player.style.height = "50px";
    player.style.backgroundColor = "blue";
    this.gameContainer.appendChild(player);
    return player;
  }

  private createScoreElement(): HTMLElement {
    const score = document.createElement("div");
    score.style.position = "absolute";
    score.style.top = "0";
    score.style.left = "0";
    this.gameContainer.appendChild(score);
    return score;
  }

  public update({ player, platforms, score }: RenderData): void {
    // Update player position
    this.playerElement.style.transform = `translate(${player.x}px, ${player.y}px)`;

    // Update platforms
    platforms.forEach((platform, index) => {
      if (!this.platformElements[index]) {
        const platformElement = document.createElement("div");
        platformElement.style.position = "absolute";
        platformElement.style.width = "50px";
        platformElement.style.height = "20px";
        platformElement.style.backgroundColor = "green";
        this.gameContainer.appendChild(platformElement);
        this.platformElements[index] = platformElement;
      }
      this.platformElements[
        index
      ].style.transform = `translate(${platform.position.x}px, ${platform.position.y}px)`;
    });

    // Remove excess platform elements if any
    this.platformElements
      .slice(platforms.length)
      .forEach((elem) => elem.remove());
    this.platformElements = this.platformElements.slice(0, platforms.length);

    // Update score
    this.scoreElement.textContent = `Score: ${score}`;
  }

  public destroy(): void {
    this.playerElement.remove();
    this.platformElements.forEach((elem) => elem.remove());
    this.scoreElement.remove();
  }
}
