// Toast插件 - 全局提示功能
// 功能：提供简单的消息提示功能
// 使用：this.$toast('提示信息')

const Toast = {
  install(Vue) {
    // 创建toast构造函数
    const ToastConstructor = Vue.extend({
      data() {
        return {
          visible: false,
          message: '',
          duration: 2000
        }
      },
      methods: {
        show(message, duration = 2000) {
          this.message = message
          this.duration = duration
          this.visible = true
          
          // 指定时间后自动隐藏
          setTimeout(() => {
            this.visible = false
          }, this.duration)
        }
      },
      template: `
        <div v-if="visible" class="toast-container">
          <div class="toast-message">{{ message }}</div>
        </div>
      `
    })
    
    // 创建toast实例并挂载到body
    const toastInstance = new ToastConstructor()
    const toastEl = toastInstance.$mount()
    document.body.appendChild(toastEl.$el)
    
    // 添加到Vue原型上
    Vue.prototype.$toast = (message, duration) => {
      toastInstance.show(message, duration)
    }
  }
}

export default Toast