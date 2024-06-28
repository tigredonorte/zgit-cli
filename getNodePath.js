// Get the current Node.js version
const nodeVersion = process.version;

// Construct the path
const nodePath = `${process.env.HOME}/.nvm/versions/node/${nodeVersion}/bin/zgit-cli`;

console.log(nodePath);