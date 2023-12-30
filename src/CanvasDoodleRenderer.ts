import { PlatformType, RenderData } from './types'
import { CanvasImageLoader } from './CanvasImageLoader'
import platformNormalImg from './assets/normal-platform.png'
import platformMovingImg from './assets/moving-platform.png'
import platformVanishing0Img from './assets/vanishing-platform-0.png'
import platformVanishing1Img from './assets/vanishing-platform-1.png'
import platformVanishing2Img from './assets/vanishing-platform-2.png'
import platformVanishing3Img from './assets/vanishing-platform-3.png'
import doodleRightImg from './assets/doodle-right.png'

const imageLoader = new CanvasImageLoader()
const imagesMap = new Map<string, CanvasImageSource>()
let imagesLoaded = false

imageLoader
  .loadMultipleImages([
    doodleRightImg,
    platformNormalImg,
    platformMovingImg,
    platformVanishing0Img,
    platformVanishing1Img,
    platformVanishing2Img,
    platformVanishing3Img,
  ])
  .then(images => {
    imagesLoaded = true
    images.forEach(image => imagesMap.set(image, imageLoader.getImage(image)!))
  })

export class CanvasDoodleRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private canvasRatio: number
  private resizeObserver: ResizeObserver

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!

    // Resize the canvas container to adapt the canvas ratio
    this.canvas.width = canvas.clientWidth
    this.canvas.height = canvas.clientHeight
    this.canvasRatio = this.canvas.width / this.canvas.height
    this.resizeObserver = new ResizeObserver(entries => {
      this.canvas.width = entries[0].contentRect.width
      this.canvas.height = entries[0].contentRect.height
      this.canvasRatio = this.canvas.width / this.canvas.height
    })
    this.resizeObserver.observe(canvas)
  }

  private getCanvasX(x: number): number {
    return x * this.canvas.width
  }

  private getCanvasY(y: number): number {
    return y * this.canvas.height
  }

  public update({ player, platforms, acceleration }: RenderData): void {
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    if (!imagesLoaded) return

    const getVanishingPlatformImage = (
      collisionsTime: number | null,
    ): { index: number; src: CanvasImageSource | null } => {
      const platformVanishingImages = [
        imagesMap.get(platformVanishing0Img)!,
        imagesMap.get(platformVanishing1Img)!,
        imagesMap.get(platformVanishing2Img)!,
        imagesMap.get(platformVanishing3Img)!,
      ]

      // change the image every 100ms after collisionsTime and return nothing if no more images
      if (collisionsTime === null) {
        return {
          index: 0,
          src: platformVanishingImages[0],
        }
      }

      const imgIndex = Math.floor((Date.now() - collisionsTime) / 100)
      const index = imgIndex >= platformVanishingImages.length ? -1 : imgIndex

      return { index, src: platformVanishingImages[index] || null }
    }

    // Draw the platforms images
    platforms.forEach(platform => {
      const vanishImage = getVanishingPlatformImage(platform.collisionsTime)

      const platformImage = (
        {
          [PlatformType.Normal]: imagesMap.get(platformNormalImg)!,
          [PlatformType.Moving]: imagesMap.get(platformMovingImg)!,
          [PlatformType.Vanishing]: vanishImage.src,
        } as Record<PlatformType, CanvasImageSource>
      )[platform.type]

      if (!platformImage) return

      // @ts-ignore
      const platformAspectRatio = platformImage.width / platformImage.height
      let y = platform.position.y

      if (platform.type === PlatformType.Vanishing) {
        y += vanishImage.index * 0.015
      }

      this.ctx.drawImage(
        platformImage,
        this.getCanvasX(platform.position.x),
        this.getCanvasY(y),
        this.getCanvasX(platform.size.width),
        this.getCanvasY((platform.size.width / platformAspectRatio) * this.canvasRatio),
      )
    })

    // Draw the player image
    const playerImage = imagesMap.get(doodleRightImg)!
    // @ts-ignore
    const playerAspectRatio = playerImage.width / playerImage.height

    if (acceleration < 0) {
      this.ctx.save() // save the current state
      this.ctx.scale(-1, 1) // flip context horizontally
      this.ctx.drawImage(
        playerImage,
        -this.getCanvasX(player.position.x) - this.getCanvasX(player.size.width), // posX needs to be inverted too
        this.getCanvasY(player.position.y),
        this.getCanvasX(player.size.width),
        this.getCanvasY((player.size.width / playerAspectRatio) * this.canvasRatio),
      )
      this.ctx.restore() // restore previous state
    } else {
      this.ctx.save() // save the current state
      this.ctx.scale(1, 1) // flip context horizontally
      this.ctx.drawImage(
        playerImage,
        this.getCanvasX(player.position.x),
        this.getCanvasY(player.position.y),
        this.getCanvasX(player.size.width),
        this.getCanvasY((player.size.width / playerAspectRatio) * this.canvasRatio),
      )
      this.ctx.restore() // restore previous state
    }
  }

  public destroy() {
    this.resizeObserver.unobserve(this.canvas)
  }
}
