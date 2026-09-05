const { spawn } = require('child_process');
const extensionPath = __dirname;

let child;
if (process.platform === 'win32') {
  const quote = (value) => `"${value}"`;
  const command = `code ${quote(`--extensionDevelopmentPath=${extensionPath}`)} --new-window ${quote(extensionPath)}`;
  child = spawn(command, { stdio: 'inherit', shell: true });
} else {
  child = spawn('code', [`--extensionDevelopmentPath=${extensionPath}`, '--new-window', extensionPath], { stdio: 'inherit' });
}

child.on('exit', code => process.exit(code ?? 0));
