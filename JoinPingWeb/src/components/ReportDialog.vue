<template>
  <!-- 举报确认弹窗组件 -->
  <div v-if="visible" class="dialog-overlay" @click="handleClose">
    <div class="dialog-content" @click.stop>
      <div class="dialog-title">确认举报</div>
      <div class="dialog-message">
        确定要举报该{{ getTargetTypeText() }}吗？举报后管理员会进行审核处理。
      </div>
      <div class="dialog-buttons">
        <button class="cancel-button" @click="handleCancel">取消</button>
        <button class="confirm-button-red" @click="handleConfirm">确认</button>
      </div>
    </div>
  </div>
</template>

<script>
// ReportDialog.vue - 公共举报弹窗组件
// 功能：统一的举报确认弹窗，支持不同举报类型
// 设计要点：
// 1. 支持话题、主体、评论、回复等多种举报类型
// 2. 统一的样式和交互逻辑
// 3. 通过props控制显示和类型
// 4. 通过事件通知父组件用户操作

export default {
  name: 'ReportDialog',
  props: {
    // 弹窗显示状态
    visible: {
      type: Boolean,
      default: false
    },
    // 举报目标类型：'topic' | 'subject' | 'comment' | 'reply'
    targetType: {
      type: String,
      default: 'topic'
    }
  },
  methods: {
    // 获取举报目标类型的中文描述
    getTargetTypeText() {
      const typeMap = {
        'topic': '话题',
        'subject': '主体', 
        'comment': '评论',
        'reply': '回复'
      }
      return typeMap[this.targetType] || '内容'
    },
    
    // 处理取消操作
    handleCancel() {
      this.$emit('cancel')
    },
    
    // 处理确认操作
    handleConfirm() {
      this.$emit('confirm')
    },
    
    // 处理点击遮罩层关闭
    handleClose() {
      this.$emit('cancel')
    }
  }
}
</script>

<style scoped>
/* 弹窗样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.dialog-content {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 24px;
  width: 80%;
  max-width: 300px;
  text-align: center;
}

.dialog-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333333;
}

.dialog-message {
  font-size: 16px;
  color: #666666;
  margin-bottom: 24px;
  line-height: 1.5;
}

.dialog-buttons {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.cancel-button {
  flex: 1;
  background-color: #f5f5f5;
  color: #666666;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background-color: #e8e8e8;
  border-color: #d0d0d0;
}

.confirm-button-red {
  flex: 1;
  background-color: #FF0000;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 10px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.confirm-button-red:hover {
  background-color: #CC0000;
}
</style>