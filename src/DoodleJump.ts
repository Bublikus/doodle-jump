import { InputHandler } from './handlers/InputHandler'
import { Config, Platform, PlatformType, Player, Renderer, Size } from './types'

export class DoodleJump {
  private game = { width: 1, height: 1 }
  private player: Player = {
    position: { x: 0, y: 0 },
    size: { width: 0.14, height: 0.14 },
  }
  private acceleration: number = 0
  private accelerationFactor: number = 0.8
  private accelerationMax: number = 7
  private platforms: Platform[] = []
  private platformSpeed: number = 0.1
  private platformSpeedMax: number = 1.5
  private platformHeight: number = 0.1
  private platformWidth: number = 0.2
  private platformSizeTolerance: number = 1
  private animationFrameRequest: number = 0
  private platformsPerScreen: number = 15
  private normalPlatformFrequency: number = 1
  private lastNonVanishingPlatformY: number = 0
  private velocity: number = 0
  private lastFrameTime: number = 0
  private deltaTime: number = 0
  private inputHandler: InputHandler | undefined
  private initialTouchX: number | null = null
  private touchMoveXDistance: number = 0
  private renderer: Renderer = () => null

  private SCORES_TO_MIN_PLATFORM_SIZE: number = 200
  private SCORES_TO_ONLY_MOVING_PLATFORMS: number = 400
  private SCORES_TO_MAX_SPEED: number = 600

  config: Required<Config>
  score: number = 0
  isPaused: boolean = false
  isGameOver: boolean = false

  constructor(config: Config) {
    this.config = {
      gravity: 1.6,
      jumpHeight: 1,
      ...config,
    }
    this.renderer = this.config.renderer
    return this
  }

  start() {
    this.bindKeys()
    this.init()
    this.animationFrameRequest = requestAnimationFrame(this.gameLoop)
    return this
  }

  pause() {
    this.isPaused = true
  }

  play() {
    this.isPaused = false
  }

  destroy() {
    cancelAnimationFrame(this.animationFrameRequest)
    this.inputHandler?.destroy()
  }

  private init() {
    this.isGameOver = false
    this.lastFrameTime = 0
    this.deltaTime = 0
    this.score = 0
    this.acceleration = 0
    this.velocity = 0
    this.lastNonVanishingPlatformY = 0
    this.normalPlatformFrequency = 1
    this.platformSizeTolerance = 1
    this.touchMoveXDistance = 0
    this.initialTouchX = null
    this.platforms = []

    this.generateInitialPlatforms()
    this.generateInitialPlayer()
  }

  private bindKeys() {
    this.inputHandler?.destroy()
    this.inputHandler = new InputHandler({
      swipeTickThresholdPX: 5,
      fireKeyHoldPerFrame: true,
    })
    this.inputHandler.handleActions({
      ArrowLeft: () => this.movePlayerLeft(),
      ArrowRight: () => this.movePlayerRight(),
      touchstart: e => this.handleStartPlayerMove(e),
      swipeLeft: e => this.setPlayerDirection(e),
      swipeRight: e => this.setPlayerDirection(e),
      touchmove: e => this.handleMovePlayer(e),
      touchend: () => this.handleEndPlayerMove(),
      touchcancel: () => this.handleEndPlayerMove(),
    })
  }

  private setPlayerDirection(e: TouchEvent) {
    const touch = e.touches[0]
    const touchX = touch.clientX
    this.initialTouchX = touchX
    this.touchMoveXDistance = 0
  }

  private handleStartPlayerMove(e: TouchEvent) {
    const touch = e.touches[0]
    const touchX = touch.clientX
    this.initialTouchX = touchX
    this.touchMoveXDistance = 0
  }

  private handleMovePlayer(e: TouchEvent) {
    if (this.initialTouchX === null) return
    const touch = e.touches[0]
    const touchX = touch.clientX
    this.touchMoveXDistance = touchX - this.initialTouchX
  }

  private handleEndPlayerMove() {
    this.initialTouchX = null
    this.touchMoveXDistance = 0
  }

  private movePlayerLeft() {
    this.play()
    this.acceleration = Math.max(-this.accelerationMax, this.acceleration - this.accelerationFactor)
  }

  private movePlayerRight() {
    this.play()
    this.acceleration = Math.min(this.acceleration + this.accelerationFactor, this.accelerationMax)
  }

  private generateInitialPlatforms() {
    for (let i = 0; i < this.platformsPerScreen; i++) {
      const { width: platformWidth, height: platformHeight } = this.getPlatformSize()

      const xRange = this.game.width - platformWidth
      let firstPlatformX = this.game.width / 2 - platformWidth / 2

      // Calculate each part of the equation and store them in variables
      const totalHeight = this.game.height + this.platformHeight
      const inverseIndexRatio = (this.platformsPerScreen - i - 1) / this.platformsPerScreen

      let x = Math.random() * xRange
      let y = totalHeight * inverseIndexRatio - this.platformHeight

      // Make sure the first platform is always in the middle
      if (i === 0) {
        x = firstPlatformX
      }

      // Make sure the second to 4th platforms are always X away from the first 4 platforms
      if (i > 0 && i < 5) {
        const range1 = (x / xRange) * (firstPlatformX - platformWidth)
        const range2 = range1 + (firstPlatformX + platformWidth)
        x = Math.random() > 0.5 ? range1 : range2
      }

      // Record the last non-vanishing platform's Y position for generating new platforms
      if (i === 0) {
        this.lastNonVanishingPlatformY = y
      }

      this.platforms.push({
        size: {
          width: platformWidth,
          height: platformHeight,
        },
        collisions: 0,
        collisionsTime: null,
        position: { x, y },
        speed: { x: 0, y: 0 },
        type: PlatformType.Normal,
      })
    }
  }

  private generateInitialPlayer() {
    const lastPlatform = this.platforms[0]
    const lastPlatformWidth = lastPlatform.size.width
    const lastPlatformCenterX = lastPlatform.position.x + lastPlatformWidth / 2

    this.player.position.x = lastPlatformCenterX - this.player.size.width / 2
    this.player.position.y = lastPlatform.position.y - this.player.size.height
  }

  private gameLoop = (time: number) => {
    this.animationFrameRequest = requestAnimationFrame(this.gameLoop)

    // Calculate delta time
    const maxDelta = 0.1 // For example, 100 milliseconds
    const delta = time - this.lastFrameTime
    this.deltaTime = this.lastFrameTime ? Math.min(delta / 1000, maxDelta) : 0
    this.lastFrameTime = time

    // Don't update game logic if the game is paused or over
    if (this.isPaused || this.isGameOver) return

    // Change platform frequency based on score
    this.normalPlatformFrequency = Math.max(0, 1 - Math.min(1, this.score / this.SCORES_TO_ONLY_MOVING_PLATFORMS))

    // Change platform speed based on score
    this.platformSpeed = Math.min(
      Math.max(this.platformSpeed, this.platformSpeedMax * Math.min(1, this.score / this.SCORES_TO_MAX_SPEED)),
      this.platformSpeedMax,
    )

    // Change platform size tolerance based on score
    this.platformSizeTolerance = Math.max(0, 1 - Math.min(1, this.score / this.SCORES_TO_MIN_PLATFORM_SIZE))

    // Update game logic
    this.updatePlayer()

    // Update moving platforms
    this.platforms.forEach(platform => {
      if (platform.type === PlatformType.Moving) {
        this.updateMovingPlatform(platform)
      }
    })

    // Update platforms if the player is near the top of the screen
    if (this.player.position.y < this.game.height / 2 && this.velocity < 0) {
      this.updatePlatforms()
    }

    this.checkCollisions()
    this.render()

    if (this.isGameOver) {
      this.destroy()
    }
  }

  private updatePlayer() {
    // Move the player left or right based on touch move distance
    if (this.touchMoveXDistance) {
      if (this.touchMoveXDistance > 0) {
        this.movePlayerRight()
      } else {
        this.movePlayerLeft()
      }
    }

    // calculate the player distance from the half of the screen
    const distanceAboveHalf = Math.max(0, this.game.height / 2 - this.player.position.y)

    // Apply gravity
    this.velocity += this.config.gravity * this.deltaTime
    this.player.position.y += this.velocity * this.deltaTime + distanceAboveHalf

    // Move the player left or right
    this.acceleration /= 2
    this.acceleration = Math.max(-this.accelerationMax, Math.min(this.acceleration, this.accelerationMax))
    this.player.position.x += this.acceleration * this.deltaTime

    // Boundary checks
    if (this.player.position.x < -this.player.size.width) {
      this.player.position.x = this.game.width
    } else if (this.player.position.x > this.game.width) {
      this.player.position.x = -this.player.size.width
    }

    // Check for game over
    if (this.player.position.y > this.game.height && !this.isGameOver) {
      this.isGameOver = true
    }
  }

  private updateMovingPlatform(platform: Platform) {
    // Update the platform's X position within the range
    platform.position.x += platform.speed.x * this.deltaTime

    if (platform.position.x < 0 || platform.position.x > this.game.width - platform.size.width) {
      // Reverse direction when hitting the boundaries
      platform.position.x = Math.max(0, Math.min(this.game.width - platform.size.width, platform.position.x))
      platform.speed.x *= -1
    }
  }

  private updatePlatforms() {
    // calculate the player distance from the half of the screen
    const distanceAboveHalf = Math.max(0, this.game.height / 2 - this.player.position.y)

    const movement = -this.velocity * this.deltaTime + (this.velocity < 0 ? distanceAboveHalf : 0) * this.deltaTime

    this.platforms.forEach(platform => {
      platform.position.y += movement
    })

    // Update the last non-vanishing platform's Y position
    this.lastNonVanishingPlatformY += movement

    // Check if platforms have moved off the bottom of the screen
    const filteredPlatforms = this.platforms.filter(platform => platform.position.y < this.game.height)

    // Update score
    const filteredPlatformsAmount = this.platforms.length - filteredPlatforms.length
    this.platforms = filteredPlatforms
    this.score += filteredPlatformsAmount

    // Calculate the distance from the last platform to the top of the screen
    const distanceToTop = this.platforms[this.platforms.length - 1].position.y + this.platformHeight

    // Add a new platform when the distance to the last one is enough
    if (distanceToTop >= (this.game.height + this.platformHeight) / this.platformsPerScreen) {
      this.addNewPlatform()
    }
  }

  private addNewPlatform() {
    const randomSign = Math.random() > 0.5 ? 1 : -1

    const { width: platformWidth, height: platformHeight } = this.getPlatformSize()

    const x = Math.random() * (this.game.width - platformWidth)
    const y = -this.platformHeight
    const type = this.getNextPlatformType(y)
    const xSpeed = type === PlatformType.Moving ? this.platformSpeed * randomSign : 0

    if (type !== PlatformType.Vanishing) {
      this.lastNonVanishingPlatformY = y
    }

    this.platforms.push({
      size: { width: platformWidth, height: platformHeight },
      position: { x, y },
      collisions: 0,
      collisionsTime: null,
      speed: { x: xSpeed, y: 0 },
      type,
    })
  }

  private getNextPlatformType(currentY: number): PlatformType {
    // Check the distance from the last non-vanishing platform
    const distanceFromLast = Math.abs(currentY - this.lastNonVanishingPlatformY)

    // Define a threshold distance for creating a non-vanishing platform
    const safeDistance = this.config.jumpHeight ** 2 / (2 * this.config.gravity) - this.platformHeight / 1.5 // 1.5 is a tolerance

    if (distanceFromLast > safeDistance) {
      return Math.random() > 0.5 * this.normalPlatformFrequency ? PlatformType.Moving : PlatformType.Normal // Choose a stable platform if too far from the last one
    }

    // Otherwise, randomly determine the type with a chance for vanishing platforms
    return Math.random() < this.normalPlatformFrequency
      ? PlatformType.Normal
      : Math.random() < 0.5 * this.normalPlatformFrequency
        ? PlatformType.Moving
        : PlatformType.Vanishing
  }

  private checkCollisions() {
    this.platforms.forEach(platform => {
      const isXCollision =
        this.player.position.x + this.player.size.width >= platform.position.x &&
        this.player.position.x <= platform.position.x + platform.size.width

      const isYCollision =
        this.player.position.y + this.player.size.height >= platform.position.y + platform.size.height / 2 && // small tolerance
        this.player.position.y + this.player.size.height <= platform.position.y + platform.size.height

      const isSolidPlatform = [PlatformType.Normal, PlatformType.Moving].includes(platform.type)

      if (isXCollision && isYCollision && this.velocity > 0) {
        platform.collisions++
        platform.collisionsTime = platform.collisionsTime || Date.now()

        if (isSolidPlatform) {
          // Collision detected, make the player jump
          this.velocity = -this.config.jumpHeight
        }
      }
    })
  }

  private getPlatformSize(): Size {
    const widthDiff = this.platformWidth / 5
    const heightDiff = this.platformHeight / 5

    const minWidth = this.platformWidth - widthDiff
    const minHeight = this.platformHeight - heightDiff

    const width = minWidth + Math.random() * widthDiff * this.platformSizeTolerance
    const height = minHeight + Math.random() * heightDiff * this.platformSizeTolerance

    return { width, height }
  }

  private render() {
    this.renderer({
      player: this.player,
      platforms: this.platforms,
      score: this.score,
      acceleration: this.acceleration,
      isGameOver: this.isGameOver,
    })
  }
}
