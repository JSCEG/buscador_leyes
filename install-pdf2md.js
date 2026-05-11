const { spawnSync } = require('child_process');

const installArgs = process.platform === 'win32'
    ? ['+stable-x86_64-pc-windows-gnu', 'install', '--git', 'https://github.com/firecrawl/pdf-inspector', 'pdf-inspector', '--bin', 'pdf2md', '--force']
    : ['install', '--git', 'https://github.com/firecrawl/pdf-inspector', 'pdf-inspector', '--bin', 'pdf2md', '--force'];

const result = spawnSync('cargo', installArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
});

if (result.error) {
    console.error(result.error.message);
    process.exit(1);
}

process.exit(result.status || 0);
