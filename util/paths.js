const path = require('path');

const configDir = () => process.env.CONFIG_DIR || path.resolve(__dirname, `..`);

const getDirFromConfig = (...paths) => path.resolve(configDir(), ...paths);

module.exports = {
    configDir,
    getDirFromConfig,
}
