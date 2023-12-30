export type Config = {
  renderer: Renderer
  gravity?: number
  jumpHeight?: number
}

export type Coords = { x: number; y: number }
export type Speed = { x: number; y: number }
export type Size = { width: number; height: number }
export type Player = {
  position: Coords
  size: Size
}
export type Renderer = (data: RenderData) => void

export enum PlatformType {
  Normal = 'normal',
  Moving = 'moving',
  Vanishing = 'vanishing',
}

export type Platform = {
  size: Size
  position: Coords
  speed: Speed
  collisions: number
  collisionsTime: number | null
  type: PlatformType
}

export type RenderData = {
  player: { position: Coords; size: Size }
  platforms: Platform[]
  score: number
  acceleration: number
  isGameOver: boolean
}
