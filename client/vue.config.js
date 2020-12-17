module.exports = {
  lintOnSave: false,

  outputDir: '../public',

  devServer: {
    proxy: {
      '^/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
};
