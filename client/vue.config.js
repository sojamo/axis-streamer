module.exports = {
  lintOnSave: false,

  outputDir: '../server/public',

  devServer: {
    proxy: {
      '^/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
};
