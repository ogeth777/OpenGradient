
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'server_out.log');
const errPath = path.join(__dirname, 'server_err.log');

console.log('Logs at:', logPath);

const out = fs.openSync(logPath, 'a');
const err = fs.openSync(errPath, 'a');

console.log('Spawning Next.js server...');

const child = spawn('node', ['node_modules/next/dist/bin/next', 'dev', '-p', '3005'], {
  cwd: __dirname,
  stdio: [ 'ignore', out, err ]
});

child.on('exit', (code, signal) => {
  console.log(`Child exited with code ${code}`);
});

child.on('error', (err) => {
  console.error('Failed to spawn:', err);
});

console.log('Server spawned with PID:', child.pid);
