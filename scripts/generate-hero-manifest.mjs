import fs from 'fs';
import path from 'path';

const HERO_DIR = path.join(process.cwd(), 'public', 'hero');
// User requested: public/hero/desktop/frames/ AND public/hero/mobile/frames/
const DESKTOP_DIR = path.join(HERO_DIR, 'desktop', 'frames');
const MOBILE_DIR = path.join(HERO_DIR, 'mobile', 'frames');

function getFrames(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter(file => file.endsWith('.webp'))
        .sort() // Ensure alphabetical order e.g. _001, _002
        .map(file => {
            // Return relative public path: /hero/desktop/frames/frame_001.webp
            // Convert backslashes to forward slashes for URL compatibility
            const relativePath = path.join(dir.split('public')[1], file).replace(/\\/g, '/');
            return relativePath;
        });
}

function generateManifest(platform, dir) {
    const frames = getFrames(dir);
    const manifest = {
        frameCount: frames.length,
        frames: frames
    };

    // Output manifests: /public/hero/manifest.desktop.json
    const manifestPath = path.join(HERO_DIR, `manifest.${platform}.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`Generated manifest.${platform}.json with ${frames.length} frames.`);
}

console.log('Generating Hero Frame Manifests...');
// Ensure directories exist or warn
if (!fs.existsSync(DESKTOP_DIR)) console.warn(`Warning: Desktop frames dir not found: ${DESKTOP_DIR}`);
if (!fs.existsSync(MOBILE_DIR)) console.warn(`Warning: Mobile frames dir not found: ${MOBILE_DIR}`);

generateManifest('desktop', DESKTOP_DIR);
generateManifest('mobile', MOBILE_DIR);
console.log('Done.');
