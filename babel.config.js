module.exports = function (api) {
  api.cache(true);
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      // Отключаем Tamagui babel plugin для production сборки
      // Это уберет оптимизацию, но решит проблему со сборкой
      ...(!isProduction ? [
        [
          '@tamagui/babel-plugin',
          {
            components: ['tamagui'],
            config: './tamagui.config.ts',
            logTimings: true,
            disableExtraction: true
          }
        ]
      ] : []),
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src'
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
        }
      ],
      'react-native-reanimated/plugin' // должен быть последним
    ]
  };
};