/**
 * Multi-Platform Build Script
 * 
 * Builds the Electron app for multiple platforms and architectures.
 * Usage: node scripts/build-all.js [--mac] [--win] [--all]
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const ELECTRON_DIR = __dirname.replace('/scripts', '');
const ROOT_DIR = path.join(ELECTRON_DIR, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIST = path.join(ELECTRON_DIR, 'frontend-dist');
const BACKEND_COPY = path.join(ELECTRON_DIR, 'backend');

// Parse arguments
const args = process.argv.slice(2);
const buildMac = args.includes('--mac') || args.includes('--all') || args.length === 0;
const buildWin = args.includes('--win') || args.includes('--all');

console.log('='.repeat(60));
console.log('  SUBCIO MULTI-PLATFORM BUILD');
console.log('='.repeat(60));
console.log(`  Build macOS: ${buildMac}`);
console.log(`  Build Windows: ${buildWin}`);
console.log('='.repeat(60));

function copyDir(src, dest, exclude = []) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (exclude.some(pattern => entry.name.includes(pattern))) {
            continue;
        }

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath, exclude);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function runCommand(cmd, cwd = ELECTRON_DIR) {
    console.log(`\n> ${cmd}\n`);
    execSync(cmd, { cwd, stdio: 'inherit' });
}

async function build() {
    try {
        // 1. Build Frontend
        console.log('\n[1/5] Building Frontend...');
        if (!fs.existsSync(path.join(FRONTEND_DIR, 'dist'))) {
            runCommand('npm run build', FRONTEND_DIR);
        } else {
            console.log('  Frontend dist exists, skipping build.');
        }

        // Copy frontend dist
        if (fs.existsSync(FRONTEND_DIST)) {
            fs.rmSync(FRONTEND_DIST, { recursive: true });
        }
        copyDir(path.join(FRONTEND_DIR, 'dist'), FRONTEND_DIST);
        console.log('  Frontend copied.');

        // 2. Copy Backend
        console.log('\n[2/5] Copying Backend...');
        if (fs.existsSync(BACKEND_COPY)) {
            fs.rmSync(BACKEND_COPY, { recursive: true });
        }
        copyDir(BACKEND_DIR, BACKEND_COPY, [
            '__pycache__', '.pyc', 'uploads', 'exports', 'logs', '.env', 'test_'
        ]);
        fs.mkdirSync(path.join(BACKEND_COPY, 'uploads'), { recursive: true });
        fs.mkdirSync(path.join(BACKEND_COPY, 'exports'), { recursive: true });
        fs.mkdirSync(path.join(BACKEND_COPY, 'logs'), { recursive: true });
        console.log('  Backend copied.');

        // 3. Prepare dependencies for target platforms
        console.log('\n[3/5] Preparing dependencies...');

        // For now, use native architecture dependencies
        // Cross-platform deps would require downloading for each target
        const pythonDir = path.join(ELECTRON_DIR, 'python-embedded');
        const ffmpegDir = path.join(ELECTRON_DIR, 'ffmpeg');

        if (!fs.existsSync(pythonDir) || !fs.existsSync(ffmpegDir)) {
            console.log('  Running prepare-python.js...');
            runCommand('node scripts/prepare-python.js');
        } else {
            console.log('  Dependencies already exist.');
        }

        // 4. Build for macOS
        if (buildMac) {
            console.log('\n[4/5] Building for macOS...');

            // Build for both architectures
            console.log('  Building macOS x64...');
            runCommand('npx electron-builder --mac --x64');

            console.log('  Building macOS arm64...');
            runCommand('npx electron-builder --mac --arm64');
        }

        // 5. Build for Windows
        if (buildWin) {
            console.log('\n[5/5] Building for Windows...');

            if (process.platform !== 'win32') {
                console.log('  ⚠️  Cross-compiling Windows from macOS requires Wine.');
                console.log('  Checking if Wine is available...');

                try {
                    execSync('which wine64 || which wine', { stdio: 'pipe' });
                    console.log('  Wine found, attempting Windows build...');
                    runCommand('npx electron-builder --win');
                } catch (e) {
                    console.log('  ❌ Wine not found. Skipping Windows build.');
                    console.log('  To build Windows, either:');
                    console.log('    1. Install Wine: brew install --cask wine-stable');
                    console.log('    2. Build on a Windows machine');
                    console.log('    3. Use GitHub Actions CI/CD');
                }
            } else {
                runCommand('npx electron-builder --win');
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('  BUILD COMPLETE!');
        console.log('='.repeat(60));

        // List output files
        const distDir = path.join(ELECTRON_DIR, 'dist');
        if (fs.existsSync(distDir)) {
            console.log('\nBuild artifacts:');
            const files = fs.readdirSync(distDir);
            for (const file of files) {
                const filePath = path.join(distDir, file);
                const stats = fs.statSync(filePath);
                if (stats.isFile() && (file.endsWith('.dmg') || file.endsWith('.exe') || file.endsWith('.zip'))) {
                    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
                    console.log(`  - ${file} (${sizeMB} MB)`);
                }
            }
        }

    } catch (error) {
        console.error('\n❌ Build failed:', error.message);
        process.exit(1);
    }
}

build();
