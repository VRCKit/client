import cp from 'child_process';
import util from 'util';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';

async function fileMD5(filePath) {
  return crypto.createHash('md5').update(await fs.promises.readFile(filePath)).digest('hex');
}

const execAsync = util.promisify(cp.exec);

async function compressArchive(filesPath, destinationPath) {
  const isWindows = os.platform() === 'win32';
  const res = await execAsync(
    isWindows ? `powershell "Compress-Archive -Force -CompressionLevel 'Fastest' -Path '${path.join(filesPath)}' -DestinationPath '${path.join(destinationPath)}'"`
      : `zip -r '${path.join(destinationPath)}' '${path.join(filesPath)}'`,
    {
      cwd: process.cwd(),
    }
  );
  return !res.stderr?.trim?.();
}

async function main() {
  console.log('Starting build process...');
  console.time('Total build time');
  if (fs.existsSync('./build')) {
    await fs.promises.rm('./build', { recursive: true, force: true });
    console.log('Removed existing build directory.');
  }

  if (!fs.existsSync('./out')) {
    await fs.promises.mkdir('./out', { recursive: true });
    console.log('Created output directory ./out');
  }

  console.log('Building SvelteKit project...');
  console.time('Building SvelteKit project...');
  await execAsync('pnpm run build');
  console.timeEnd('Building SvelteKit project...');

  console.log('Removing map files...');
  console.time('Removing map files...');
  function removeMapFiles(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        removeMapFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.map')) {
        fs.unlinkSync(fullPath);
      }
    });
  }
  removeMapFiles('./build');
  console.timeEnd('Removing map files...');

  console.time('Compressing build directory...');
  console.log(`Compressing build directory to ./out/build.zip...`);
  const success = await compressArchive('./build', './out/build.zip');
  if (!success) {
    console.error('Failed to compress build directory.');
    return;
  }
  console.timeEnd('Compressing build directory...');

  console.time('Calculating MD5 checksum...');
  const md5 = await fileMD5('./out/build.zip');
  await fs.promises.writeFile(
    './out/build.md5.txt',
    md5,
    'utf8'
  );

  console.log(`MD5 checksum: ${md5}`);

  if (!fs.existsSync(path.join(process.cwd(), '../backend/files/builds/v1/latest'))) {
    await fs.promises.mkdir(path.join(process.cwd(), '../backend/files/builds/v1/latest'), { recursive: true });
    console.log('Created directory for latest build files.');
  }

  console.log("Copying files to backend files directory...");
  console.time('Copying files to backend files directory...');
  await fs.promises.cp('./out/build.zip', path.join(process.cwd(), '../backend/files/builds/v1/latest/build.zip'), { force: true });
  await fs.promises.cp('./out/build.md5.txt', path.join(process.cwd(), '../backend/files/builds/v1/latest/build.md5.txt'), { force: true });
  console.timeEnd('Copying files to backend files directory...');
  console.log("Files copied successfully.");

  console.log('Build process completed successfully.');
  console.timeEnd('Total build time');
}

main();