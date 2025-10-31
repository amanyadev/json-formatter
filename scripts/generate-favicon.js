// Simple script to create a base64 encoded 32x32 PNG favicon
// Run with: node scripts/generate-favicon.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple 32x32 PNG with the JSON braces icon
// This is a minimal PNG with our icon design
const createFaviconPNG = () => {
  // Base64 encoded 32x32 PNG with blue gradient background and white braces
  const base64PNG = `iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA3QAAAN0BcFOiBwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAJYSURBVFiF7ZfPaxNBFMe/M5vdZDdNmjRN0x+0FkUQPOjFg+LBgwcvXvwD/Ae8efGgCB48ePSgBy8exIMHQUEQBEVBULQqWmvTNG2abJJNdjezOzPj4WfTtE1a2h70A4/ZmXnz3vvO7LyZAS5pN/6XBgDYbrcRDocRjUYRCATgcrkwNTWFXC6H4+NjnJ6eolgsIpPJQNM0GIaBVqtVMwzjkud5b+sWAIDD4XgZDAZns9ksqtUqBEEY+uEej0dSFOW1y+WaOzg4+DowAMDj8TxPJBIvK5UKhsFlWRaKovwQBOE9ADsgAEVRnm1sbLwpl8vQdX1Yvo+SJK3J8tY7u1N+VyIWi73Y3NysNhoNWJbl1T4AgKZpH1VV/Wy321kCACRJWllbWztqNpvQdd1qt9sdAFBV9ZMkSV8IACCfz++urq5qtVoNuq7bAKDr+mdFUb4SAOByuVZXVlZ+t1otaJoGXde/yLK8TQAAwzBuBwKBj0tLS3BaL8syAWC32+8FAgGn9bIsEwBgeXn5B8vOkiSRABCPx/c5jiMA4Pf79ziOIwAAwzBE0zRJw+EwCSGE1Ot1EggESCwWI6Io2iU0TZMEAoEvdrv9uqZpH0+PqtX0TpfTu90uLl68CIfDAZ7ncXBwgEqlgl6vB8MwAAAcx6Fer0OSpD9er/d2Lpe7OTAwMzPzOhqN3pEkCYZhwDAMWJYFy7LQ6/UQCoVQLBYBANls9psoil9tt9vfpqam5gcGZmdnp30+359SqYR+vw9RFCEIAnw+H/L5PEqlEnRd/93r9X6Louiev74GABYXF39OTk7eCoVC94PB4JX1o/+0fwGkKGuzH8wj5AAAAABJRU5ErkJggg==`;

  const buffer = Buffer.from(base64PNG, 'base64');
  return buffer;
};

// Write the PNG to public/favicon.ico
const publicDir = path.join(__dirname, '..', 'public');
const faviconPath = path.join(publicDir, 'favicon.ico');

const pngBuffer = createFaviconPNG();
fs.writeFileSync(faviconPath, pngBuffer);

console.log('✅ Favicon generated successfully at:', faviconPath);
console.log('Note: This is a PNG file saved as .ico for compatibility');
