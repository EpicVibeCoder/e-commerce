const base = require('@repo/jest-config/node.js');
module.exports = { ...base, rootDir: __dirname, roots: ['<rootDir>', '<rootDir>/test'] };