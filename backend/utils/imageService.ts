import { createCanvas, loadImage, SKRSContext2D } from '@napi-rs/canvas';
import https from 'https';

export class ImageService {
  // Canvas dimensions (16:9 aspect ratio like reference)
  private static readonly WIDTH = 1200;
  private static readonly HEIGHT = 630;
  private static readonly AVATAR_SIZE = 280;

  /**
   * Generate quote image from avatar and text
   * @param avatarUrl - User's Discord avatar URL
   * @param quoteText - Message content
   * @param username - Author's username
   * @returns PNG image buffer
   */
  static async generateQuoteImage(
    avatarUrl: string,
    quoteText: string,
    username: string
  ): Promise<Buffer> {
    // Create canvas
    const canvas = createCanvas(this.WIDTH, this.HEIGHT);
    const ctx = canvas.getContext('2d');

    // Draw black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

    // Draw radial gradient spotlight on left side (extended radius)
    const spotlightX = this.AVATAR_SIZE / 2 + 60;
    const spotlightY = this.HEIGHT / 2;
    const spotlight = ctx.createRadialGradient(
      spotlightX,
      spotlightY,
      0,
      spotlightX,
      spotlightY,
      this.AVATAR_SIZE * 2.0
    );
    spotlight.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    spotlight.addColorStop(0.4, 'rgba(255, 255, 255, 0.2)');
    spotlight.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
    spotlight.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotlight;
    ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

    // Add horizontal gradient to fade white glow into black background
    const horizontalGradient = ctx.createLinearGradient(0, 0, this.WIDTH, 0);
    horizontalGradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent on left (preserve spotlight)
    horizontalGradient.addColorStop(0.3, 'rgba(0, 0, 0, 0)'); // Keep spotlight visible
    horizontalGradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.5)'); // Start fading to black
    horizontalGradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.9)'); // Almost black
    horizontalGradient.addColorStop(1, 'rgba(0, 0, 0, 1)'); // Pure black on right
    ctx.fillStyle = horizontalGradient;
    ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

    // Fetch and draw circular avatar (grayscale)
    const avatarBuffer = await this.fetchAvatar(avatarUrl);
    const avatar = await loadImage(avatarBuffer);

    const avatarX = 60;
    const avatarY = this.HEIGHT / 2 - this.AVATAR_SIZE / 2;

    // Draw circular clipped avatar with grayscale filter
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      avatarX + this.AVATAR_SIZE / 2,
      avatarY + this.AVATAR_SIZE / 2,
      this.AVATAR_SIZE / 2,
      0,
      Math.PI * 2
    );
    ctx.closePath();
    ctx.clip();

    // Apply grayscale filter to avatar
    ctx.filter = 'grayscale(100%)';
    ctx.drawImage(avatar, avatarX, avatarY, this.AVATAR_SIZE, this.AVATAR_SIZE);
    ctx.filter = 'none';

    ctx.restore();

    // Draw quote text on right side
    const textX = this.AVATAR_SIZE + 140;
    const textMaxWidth = this.WIDTH - textX - 80;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '42px sans-serif';
    ctx.textAlign = 'left';

    const wrappedLines = this.wrapText(ctx, quoteText, textMaxWidth);
    const lineHeight = 52;
    const totalTextHeight = wrappedLines.length * lineHeight;
    let textY = this.HEIGHT / 2 - totalTextHeight / 2 + 30;

    for (const line of wrappedLines) {
      ctx.fillText(line, textX, textY);
      textY += lineHeight;
    }

    // Draw username attribution below quote
    ctx.font = 'italic 28px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`- ${username}`, textX, textY + 20);

    // Add subtle "Make it" watermark in bottom right
    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'right';
    ctx.fillText('Make it a quote', this.WIDTH - 20, this.HEIGHT - 15);

    // Return PNG buffer
    return canvas.toBuffer('image/png');
  }

  /**
   * Fetch avatar from URL
   */
  private static async fetchAvatar(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        })
        .on('error', reject);
    });
  }

  /**
   * Wrap text to fit within max width
   */
  private static wrapText(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    // Limit to 10 lines with ellipsis
    if (lines.length > 10) {
      lines.splice(10);
      lines[9] += '...';
    }

    return lines;
  }
}
