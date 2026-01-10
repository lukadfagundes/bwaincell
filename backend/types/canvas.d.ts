declare module 'canvas' {
  export type CanvasTextAlign = 'left' | 'right' | 'center' | 'start' | 'end';
  export type CanvasTextBaseline =
    | 'top'
    | 'hanging'
    | 'middle'
    | 'alphabetic'
    | 'ideographic'
    | 'bottom';

  export interface CanvasGradient {
    addColorStop(offset: number, color: string): void;
  }

  export interface CanvasPattern {
    setTransform(transform?: any): void;
  }

  export interface TextMetrics {
    width: number;
    actualBoundingBoxAscent: number;
    actualBoundingBoxDescent: number;
    actualBoundingBoxLeft: number;
    actualBoundingBoxRight: number;
    fontBoundingBoxAscent: number;
    fontBoundingBoxDescent: number;
  }

  export interface CanvasRenderingContext2D {
    roundRect?: (
      x: number,
      y: number,
      width: number,
      height: number,
      radii?: number | number[]
    ) => void;
    fillStyle: string | CanvasGradient | CanvasPattern;
    strokeStyle: string | CanvasGradient | CanvasPattern;
    lineWidth: number;
    font: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    fillRect(x: number, y: number, width: number, height: number): void;
    strokeRect(x: number, y: number, width: number, height: number): void;
    fillText(text: string, x: number, y: number, maxWidth?: number): void;
    strokeText(text: string, x: number, y: number, maxWidth?: number): void;
    drawImage(image: any, dx: number, dy: number, dw?: number, dh?: number): void;
    beginPath(): void;
    closePath(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    arc(
      x: number,
      y: number,
      radius: number,
      startAngle: number,
      endAngle: number,
      anticlockwise?: boolean
    ): void;
    fill(): void;
    stroke(): void;
    save(): void;
    restore(): void;
    translate(x: number, y: number): void;
    rotate(angle: number): void;
    scale(x: number, y: number): void;
    clearRect(x: number, y: number, width: number, height: number): void;
    measureText(text: string): TextMetrics;
  }

  export function createCanvas(width: number, height: number): any;
  export function loadImage(src: string | Buffer): Promise<any>;
  export function registerFont(
    path: string,
    options: { family: string; weight?: string; style?: string }
  ): void;

  export class Canvas {
    width: number;
    height: number;
    getContext(contextId: '2d'): CanvasRenderingContext2D;
    toBuffer(type?: string): Buffer;
    toDataURL(type?: string): string;
  }

  export class Image {
    src: string | Buffer;
    width: number;
    height: number;
    onload?: () => void;
    onerror?: (err: Error) => void;
  }
}
