// Renders both films and publishes them to public/video. Needs FFmpeg on the PATH.
// Run from the repository root: node video-intro/render.mjs
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const root = process.cwd();
const project = path.join(root, 'video-intro');
const published = path.join(root, 'public/video');
const renders = path.join(project, 'renders');
const windows = process.platform === 'win32';
fs.mkdirSync(published, { recursive: true });
fs.mkdirSync(renders, { recursive: true });

const FILMS = [
  { name: 'landscape', orientation: '', scale: '1920:1080' },
  { name: 'portrait', orientation: 'portrait', scale: '720:1280' },
];

for (const { name, orientation, scale } of FILMS) {
  execFileSync(process.execPath, ['video-intro/build.mjs', ...(orientation ? [orientation] : [])], { cwd: root, stdio: 'inherit' });
  const master = path.join('renders', `master-${name}.mp4`);
  execFileSync(windows ? 'npx.cmd' : 'npx', ['hyperframes', 'render', '--output', master, '--fps', '30', '--crf', '16', '--quiet'], { cwd: project, stdio: 'ignore', shell: windows });
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(project, master), '-vf', `scale=${scale}:flags=lanczos`, '-c:v', 'libx264', '-preset', 'veryslow', '-tune', 'animation', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', path.join(published, `intro-${name}.mp4`)], { stdio: 'inherit' });
  console.log(name, fs.statSync(path.join(published, `intro-${name}.mp4`)).size);
}
// Leave the project on the landscape composition, the one the Studio preview opens.
execFileSync(process.execPath, ['video-intro/build.mjs'], { cwd: root, stdio: 'inherit' });
