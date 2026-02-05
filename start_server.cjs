
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Script starting...');
try {
    fs.writeFileSync('test_write.txt', 'Script started\n');
} catch (e) {
    console.error('Error writing test_write.txt:', e);
}

const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
let out, err;
try {
    out = fs.openSync('./server.log', 'a');
    err = fs.openSync('./server.err', 'a');
} catch (e) {
    console.error('Error opening logs:', e);
}

console.log('Starting next from:', nextBin);
try {
    fs.appendFileSync('test_write.txt', `Next bin: ${nextBin}\n`);
} catch (e) {}

const child = spawn('node', [nextBin, 'dev'], {
  stdio: ['ignore', out, err],
  cwd: __dirname
});

child.on('error', (err) => {
    console.log('Child error:', err);
    try {
        fs.appendFileSync('test_write.txt', `Child error: ${err}\n`);
    } catch (e) {}
});

child.on('exit', (code) => {
  console.log('Next.js exited with code:', code);
  try {
      fs.appendFileSync('test_write.txt', `Exit code: ${code}\n`);
  } catch (e) {}
});

console.log('Spawned child pid:', child.pid);
