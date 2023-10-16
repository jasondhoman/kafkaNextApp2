export class CanvasProps {
  constructor(
    public width: number,
    public height: number,
    public scale: number,
  ) {}

  get canvasScaledWidth(): number {
    return this.width * this.scale;
  }

  get canvasScaledHeight(): number {
    return this.height * this.scale;
  }
}
