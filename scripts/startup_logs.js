#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.resolve(__dirname, 'startup_latest.log');

function log(str) { process.stdout.write(str); fs.appendFileSync(LOG_FILE, str); }

log('Starting backend with startup log capture...\n');

const server = spawn('node', ['app.js'], {
  cwd: path.resolve(__dirname, '..'),
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe']
});

server.stdout.on('data', (data) => {
  log(data.toString());
});
server.stderr.on('data', (data) => {
  log(data.toString());
});

server.on('close', (code) => {
  log(`\nServer process exited with code ${code}\n`);
});
