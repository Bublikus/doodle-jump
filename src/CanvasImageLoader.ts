type ImageSrc = string

export class CanvasImageLoader {
  private images: Map<ImageSrc, HTMLImageElement>

  constructor() {
    this.images = new Map<ImageSrc, HTMLImageElement>()
  }

  // Load a single image
  loadSingleImage(src: ImageSrc): Promise<ImageSrc> {
    return new Promise((resolve, reject) => {
      if (this.images.has(src)) {
        // Resolve immediately if the image is already loaded
        resolve(src)
        return
      }

      const img = new Image()
      img.onload = () => {
        this.images.set(src, img)
        resolve(src)
      }
      img.onerror = reject
      img.src = src
    })
  }

  // Load multiple images
  loadMultipleImages(srcs: ImageSrc[]): Promise<ImageSrc[]> {
    return Promise.all(srcs.map(src => this.loadSingleImage(src)))
  }

  // Retrieve a loaded image
  getImage(src: ImageSrc): HTMLImageElement | undefined {
    return this.images.get(src)
  }
}
