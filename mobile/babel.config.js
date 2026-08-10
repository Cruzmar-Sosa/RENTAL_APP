module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@core': './src/core',
            '@platform': './src/platform',
            '@domain': './src/domain',
            '@application': './src/application',
            '@features': './src/features',
            '@design-system': './src/design-system',
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
      ],
    ],
  };
};
