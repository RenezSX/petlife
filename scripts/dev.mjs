import { spawn } from 'node:child_process';

function run(prefix) {
  if (process.platform === 'win32') {
    return spawn('cmd.exe', ['/d', '/s', '/c', `npm --prefix ${prefix} run dev`], {
      stdio: 'inherit',
      windowsHide: false,
    });
  }
  return spawn('npm', ['--prefix', prefix, 'run', 'dev'], { stdio: 'inherit' });
}

const commands = [run('apps/api'), run('apps/web')];
function stop() { for (const command of commands) command.kill('SIGTERM'); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
commands.forEach((command) => command.on('exit', (code) => {
  if (code && code !== 0) process.exitCode = code;
}));
