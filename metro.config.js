const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Настройка для Tamagui
config.resolver.alias = {
  ...config.resolver.alias,
  '@tamagui/core': '@tamagui/core',
  '@tamagui/config': '@tamagui/config',
};

module.exports = config;