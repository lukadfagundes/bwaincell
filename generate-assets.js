const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Ensure assets directory exists
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Function to create Onion Knight icon (1024x1024)
function createIcon() {
    const canvas = createCanvas(1024, 1024);
    const ctx = canvas.getContext('2d');

    // Clear background (transparent)
    ctx.clearRect(0, 0, 1024, 1024);

    // Draw onion-shaped helmet
    ctx.fillStyle = '#E6D7FF'; // Light purple for onion
    ctx.strokeStyle = '#8B7AB8'; // Darker purple outline
    ctx.lineWidth = 8;

    // Onion body (helmet)
    ctx.beginPath();
    ctx.ellipse(512, 512, 280, 340, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Onion top point
    ctx.beginPath();
    ctx.moveTo(512, 172);
    ctx.quadraticCurveTo(480, 250, 440, 320);
    ctx.lineTo(584, 320);
    ctx.quadraticCurveTo(544, 250, 512, 172);
    ctx.fillStyle = '#E6D7FF';
    ctx.fill();
    ctx.stroke();

    // Face visor area
    ctx.fillStyle = '#2C2C2C';
    ctx.beginPath();
    ctx.ellipse(512, 520, 180, 140, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (cute dots)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(460, 500, 25, 0, Math.PI * 2);
    ctx.arc(564, 500, 25, 0, Math.PI * 2);
    ctx.fill();

    // Cute smile
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(512, 520, 60, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    // Armor layers (onion rings)
    ctx.strokeStyle = '#8B7AB8';
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(512, 400 + i * 80, 260 - i * 20, 40, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Little highlight on helmet
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(420, 380, 60, 80, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Save icon
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(assetsDir, 'bwaincell-icon.png'), buffer);
    console.log('✅ Icon created: assets/bwaincell-icon.png (1024x1024)');
}

// Function to create Onion Knight banner (680x240)
function createBanner() {
    const canvas = createCanvas(680, 240);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 680, 240);
    gradient.addColorStop(0, '#9B88D3');
    gradient.addColorStop(1, '#6B5A9B');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 680, 240);

    // Draw pattern of small onions
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#FFFFFF';
    for (let x = 20; x < 680; x += 80) {
        for (let y = 20; y < 240; y += 80) {
            ctx.beginPath();
            ctx.ellipse(x, y, 25, 30, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;

    // Main onion knight (left side)
    ctx.fillStyle = '#E6D7FF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;

    // Helmet
    ctx.beginPath();
    ctx.ellipse(120, 120, 70, 85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Onion top
    ctx.beginPath();
    ctx.moveTo(120, 35);
    ctx.quadraticCurveTo(110, 55, 100, 75);
    ctx.lineTo(140, 75);
    ctx.quadraticCurveTo(130, 55, 120, 35);
    ctx.fill();
    ctx.stroke();

    // Face
    ctx.fillStyle = '#2C2C2C';
    ctx.beginPath();
    ctx.ellipse(120, 125, 45, 35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(105, 120, 8, 0, Math.PI * 2);
    ctx.arc(135, 120, 8, 0, Math.PI * 2);
    ctx.fill();

    // Text "Bwaincell"
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Bwaincell', 400, 120);

    // Subtitle
    ctx.font = '24px Arial';
    ctx.fillStyle = '#E6D7FF';
    ctx.fillText('Your Onion Knight Assistant', 400, 170);

    // Save banner
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(assetsDir, 'bwaincell-banner.png'), buffer);
    console.log('✅ Banner created: assets/bwaincell-banner.png (680x240)');
}

// Check if canvas is installed
try {
    createIcon();
    createBanner();
    console.log('\n🎨 Assets generated successfully in assets/ folder!');
    console.log('   - assets/bwaincell-icon.png (1024x1024)');
    console.log('   - assets/bwaincell-banner.png (680x240)');
} catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
        console.log('📦 Canvas module not found. Installing...');
        console.log('Run: npm install canvas');
        console.log('\nNote: Canvas requires additional system dependencies.');
        console.log('On Windows, it should auto-install.');
        console.log('On Mac: brew install pkg-config cairo pango libpng jpeg giflib librsvg');
        console.log('On Linux: sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev');
    } else {
        console.error('Error generating assets:', error);
    }
}