
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Script starting...');
fs.writeFileSync('test_write.txt', 'Script started\n');

const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
const out = fs.openSync('./server.log', 'a');
const err = fs.openSync('./server.err', 'a');

console.log('Starting next from:', nextBin);
fs.appendFileSync('test_write.txt', `Next bin: ${nextBin}\n`);

const child = spawn('node', [nextBin, 'dev'], {
  stdio: ['ignore', out, err],
  cwd: __dirname
});

child.on('error', (err) => {
    console.log('Child error:', err);
    fs.appendFileSync('test_write.txt', `Child error: ${err}\n`);
});

child.on('exit', (code) => {
  console.log('Next.js exited with code:', code);
  fs.appendFileSync('test_write.txt', `Exit code: ${code}\n`);
});

console.log('Spawned child pid:', child.pid);
