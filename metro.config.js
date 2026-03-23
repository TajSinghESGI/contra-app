const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Allow importing JSON files (e.g. fontello config.json)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'json'];

// Resolve the @/ alias to the project root
config.resolver.alias = {
  '@': path.resolve(__dirname),
};

module.exports = config;
