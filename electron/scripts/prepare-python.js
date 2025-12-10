/**
 * Embedded Python & FFmpeg Preparation Script
 * 
 * Downloads Python Embedded (Win) or Standalone (Mac) and FFmpeg.
 * Must be run before build.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const PYTHON_VERSION = '3.11.7';
// Windows
const PYTHON_EMBED_URL_WIN = `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip`;
// macOS (using indygreg/python-build-standalone)
// macOS (using indygreg/python-build-standalone)
const PYTHON_STANDALONE_MAC_URL_X64 = `https://github.com/indygreg/python-build-standalone/releases/download/20240107/cpython-3.11.7+20240107-x86_64-apple-darwin-install_only.tar.gz`;
const PYTHON_STANDALONE_MAC_URL_ARM64 = `https://github.com/indygreg/python-build-standalone/releases/download/20240107/cpython-3.11.7+20240107-aarch64-apple-darwin-install_only.tar.gz`;

const GET_PIP_URL = 'https://bootstrap.pypa.io/get-pip.py';

// FFmpeg
const FFMPEG_URL_WIN = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';
const FFMPEG_URL_MAC = 'https://evermeet.cx/ffmpeg/getrelease/zip'; // Gets latest stable ffmpeg

const ELECTRON_DIR = path.resolve(__dirname, '..');
const PYTHON_DIR = path.join(ELECTRON_DIR, 'python-embedded');
const FFMPEG_DIR = path.join(ELECTRON_DIR, 'ffmpeg');
const BACKEND_DIR = path.join(ELECTRON_DIR, '..', 'backend');

const IS_MAC = process.platform === 'darwin';

// Required Python packages
const REQUIRED_PACKAGES = [
  'uvicorn[standard]',
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${url}`);
    const file = fs.createWriteStream(dest);

    const doRequest = (requestUrl) => {
      // Handle relative URLs
      if (!requestUrl.startsWith('http')) {
        reject(new Error(`Invalid redirect URL: ${requestUrl}`));
        return;
      }

      https.get(requestUrl, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          let newUrl = response.headers.location;
          if (!newUrl.startsWith('http')) {
            const u = new URL(requestUrl);
            // Ensure trailing slash if relative needs it? 
            // Normally headers.location is absolute or path absolute.
            // If resolves to root, u.origin handles it.
            // If relative to current path, we need to be careful.
            // evermeet redirects are usually root-relative or absolute.
            if (newUrl.startsWith('/')) {
              newUrl = `${u.origin}${newUrl}`;
            } else {
              // relative to path
              const pathDir = u.pathname.substring(0, u.pathname.lastIndexOf('/'));
              newUrl = `${u.origin}${pathDir}/${newUrl}`;
            }
          }
          doRequest(newUrl);
        } else if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        } else {
          reject(new Error(`HTTP ${response.statusCode}`));
        }
      }).on('error', reject);
    };

    doRequest(url);
  });
}

function extractZip(zipPath, destPath) {
  console.log(`Extracting: ${zipPath} -> ${destPath}`);
  try {
    if (IS_MAC) {
      execSync(`unzip -o "${zipPath}" -d "${destPath}"`, { stdio: 'inherit' });
    } else {
      execSync(
        `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destPath}' -Force"`,
        { stdio: 'inherit' }
      );
    }
  } catch (e) {
    console.error('Extract failed:', e);
    throw e;
  }
}

function extractTarGz(tarPath, destPath) {
  console.log(`Extracting tar.gz: ${tarPath} -> ${destPath}`);
  try {
    if (IS_MAC) {
      // Create dest if not exists
      if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
      execSync(`tar -xzf "${tarPath}" -C "${destPath}"`, { stdio: 'inherit' });
    } else {
      execSync(`tar -xzf "${tarPath}" -C "${destPath}"`, { stdio: 'inherit' });
    }
  } catch (e) {
    console.error('Extract failed:', e);
    throw e;
  }
}

async function preparePython() {
  console.log('='.repeat(50));
  console.log('Preparing Python...');
  console.log('='.repeat(50));

  if (fs.existsSync(PYTHON_DIR)) {
    console.log('Cleaning existing Python directory...');
    fs.rmSync(PYTHON_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(PYTHON_DIR, { recursive: true });

  if (IS_MAC) {
    // macOS Setup using Python Standalone
    const tarPath = path.join(PYTHON_DIR, 'python-standalone.tar.gz');
    const url = process.arch === 'arm64' ? PYTHON_STANDALONE_MAC_URL_ARM64 : PYTHON_STANDALONE_MAC_URL_X64;
    console.log(`Detected architecture: ${process.arch}`);
    await download(url, tarPath);
    extractTarGz(tarPath, PYTHON_DIR);
    fs.unlinkSync(tarPath);

  } else {
    // Windows Setup using Python Embed
    const zipPath = path.join(PYTHON_DIR, 'python-embed.zip');
    await download(PYTHON_EMBED_URL_WIN, zipPath);
    extractZip(zipPath, PYTHON_DIR);
    fs.unlinkSync(zipPath);

    const pthFile = path.join(PYTHON_DIR, `python311._pth`);
    if (fs.existsSync(pthFile)) {
      let content = fs.readFileSync(pthFile, 'utf8');
      content = content.replace('#import site', 'import site');
      content += '\nLib\nLib\\site-packages\n';
      fs.writeFileSync(pthFile, content);
      console.log('python311._pth updated');
    }
  }

  // Determine paths
  let pythonExe, pipExe, sitePackages;

  if (IS_MAC) {
    const contents = fs.readdirSync(PYTHON_DIR);
    let baseDir = PYTHON_DIR;
    if (contents.includes('python')) {
      baseDir = path.join(PYTHON_DIR, 'python');
    }

    const possibleBin = path.join(baseDir, 'bin', 'python3');
    const possibleInstallBin = path.join(baseDir, 'install', 'bin', 'python3');

    if (fs.existsSync(possibleBin)) {
      pythonExe = possibleBin;
      pipExe = path.join(baseDir, 'bin', 'pip3');
      sitePackages = path.join(baseDir, 'lib', 'python3.11', 'site-packages');
    } else if (fs.existsSync(possibleInstallBin)) {
      pythonExe = possibleInstallBin;
      pipExe = path.join(baseDir, 'install', 'bin', 'pip3');
      sitePackages = path.join(baseDir, 'install', 'lib', 'python3.11', 'site-packages');
    } else {
      pythonExe = path.join(PYTHON_DIR, 'python', 'bin', 'python3');
      pipExe = path.join(PYTHON_DIR, 'python', 'bin', 'pip3');
      sitePackages = path.join(PYTHON_DIR, 'python', 'lib', 'python3.11', 'site-packages');
    }

    try {
      if (fs.existsSync(pythonExe)) execSync(`chmod +x "${pythonExe}"`);
      if (fs.existsSync(pipExe)) execSync(`chmod +x "${pipExe}"`);
    } catch (e) { }

  } else {
    pythonExe = path.join(PYTHON_DIR, 'python.exe');
    pipExe = path.join(PYTHON_DIR, 'Scripts', 'pip.exe');
    sitePackages = path.join(PYTHON_DIR, 'Lib', 'site-packages');

    const getPipPath = path.join(PYTHON_DIR, 'get-pip.py');
    await download(GET_PIP_URL, getPipPath);
    console.log('Installing pip...');
    execSync(`"${pythonExe}" "${getPipPath}" --no-warn-script-location`, {
      cwd: PYTHON_DIR,
      stdio: 'inherit'
    });
    fs.unlinkSync(getPipPath);

    fs.mkdirSync(sitePackages, { recursive: true });
  }

  // Install Packages
  console.log('Installing requirements...');
  const requirementsPath = path.join(BACKEND_DIR, 'requirements.txt');

  if (fs.existsSync(requirementsPath)) {
    try {
      if (IS_MAC) {
        execSync(`"${pythonExe}" -m pip install -r "${requirementsPath}"`, {
          cwd: PYTHON_DIR,
          stdio: 'inherit'
        });
      } else {
        execSync(`"${pipExe}" install -r "${requirementsPath}" --no-warn-script-location --target "${sitePackages}"`, {
          cwd: PYTHON_DIR,
          stdio: 'inherit'
        });
      }
    } catch (e) {
      console.error('Failed to install backend requirements:', e.message);
    }
  }

  for (const pkg of REQUIRED_PACKAGES) {
    console.log(`Installing: ${pkg}`);
    try {
      if (IS_MAC) {
        execSync(`"${pythonExe}" -m pip install "${pkg}"`, {
          cwd: PYTHON_DIR,
          stdio: 'inherit'
        });
      } else {
        execSync(`"${pipExe}" install "${pkg}" --no-warn-script-location --target "${sitePackages}"`, {
          cwd: PYTHON_DIR,
          stdio: 'inherit'
        });
      }
    } catch (e) {
      console.error(`Failed to install ${pkg}:`, e.message);
    }
  }

  console.log('Python preparation complete!');
}

async function prepareFFmpeg() {
  console.log('='.repeat(50));
  console.log('Preparing FFmpeg...');
  console.log('='.repeat(50));

  if (fs.existsSync(FFMPEG_DIR)) {
    console.log('Cleaning existing FFmpeg directory...');
    fs.rmSync(FFMPEG_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(FFMPEG_DIR, { recursive: true });

  const zipPath = path.join(FFMPEG_DIR, 'ffmpeg.zip');
  const url = IS_MAC ? FFMPEG_URL_MAC : FFMPEG_URL_WIN;

  await download(url, zipPath);

  // Extract
  if (IS_MAC) {
    const tempDir = path.join(FFMPEG_DIR, 'temp');
    fs.mkdirSync(tempDir);
    execSync(`unzip -o "${zipPath}" -d "${tempDir}"`, { stdio: 'inherit' });

    if (fs.existsSync(path.join(tempDir, 'ffmpeg'))) {
      fs.copyFileSync(path.join(tempDir, 'ffmpeg'), path.join(FFMPEG_DIR, 'ffmpeg'));
      execSync(`chmod +x "${path.join(FFMPEG_DIR, 'ffmpeg')}"`);
    }

    console.log('Downloading FFprobe for Mac...');
    const probeZip = path.join(FFMPEG_DIR, 'ffprobe.zip');
    await download('https://evermeet.cx/ffprobe/getrelease/zip', probeZip);
    execSync(`unzip -o "${probeZip}" -d "${tempDir}"`, { stdio: 'inherit' });
    if (fs.existsSync(path.join(tempDir, 'ffprobe'))) {
      fs.copyFileSync(path.join(tempDir, 'ffprobe'), path.join(FFMPEG_DIR, 'ffprobe'));
      execSync(`chmod +x "${path.join(FFMPEG_DIR, 'ffprobe')}"`);
    }
    fs.unlinkSync(probeZip);

    fs.rmSync(tempDir, { recursive: true, force: true });

  } else {
    const tempDir = path.join(FFMPEG_DIR, 'temp');
    extractZip(zipPath, tempDir);

    const extractedDirs = fs.readdirSync(tempDir);
    const ffmpegInnerDir = extractedDirs.find(d => d.startsWith('ffmpeg'));

    if (ffmpegInnerDir) {
      const binDir = path.join(tempDir, ffmpegInnerDir, 'bin');
      if (fs.existsSync(binDir)) {
        const filesToCopy = ['ffmpeg.exe', 'ffprobe.exe'];
        for (const file of filesToCopy) {
          const src = path.join(binDir, file);
          const dest = path.join(FFMPEG_DIR, file);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
          }
        }
      }
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  fs.unlinkSync(zipPath);
  console.log('FFmpeg preparation complete!');
}

async function main() {
  try {
    await preparePython();
    await prepareFFmpeg();
    console.log('\n✅ Dependencies prepared!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
