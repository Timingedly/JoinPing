const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // 开发服务器配置
  devServer: {
    port: 8082,
    open: true,
    // 代理配置 - 解决开发环境跨域问题
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080', // 后端API地址
        changeOrigin: true,
        pathRewrite: {
          '^/api': '' // 移除/api前缀
        }
      },
      // 处理其他API请求，确保所有API请求都能正确代理
      '/upload': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/document': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/user': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/topic': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/thing': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/comment': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/like': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      // 处理图片请求
      '/image': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      }
    }
  },
  // Vue配置
  runtimeCompiler: true,
  // 生产环境配置
  productionSourceMap: false,
  // CSS配置
  css: {
    loaderOptions: {
      // 向预处理器 Loader 传递选项
      sass: {
        additionalData: `@import "@/assets/css/variables.scss";`
      }
    }
  },
  // 配置webpack
  configureWebpack: {
    // 性能提示
    performance: {
      hints: false
    },
    // 优化配置
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    }
  },
  // PWA配置
  pwa: {
    name: 'JoinPing',
    themeColor: '#ff3b30',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    workboxOptions: {
      // 自定义缓存策略
      runtimeCaching: [
        {
          urlPattern: new RegExp('^https://api.example.com/'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 30 * 24 * 60 * 60 // 30天
            }
          }
        }
      ]
    }
  }
})