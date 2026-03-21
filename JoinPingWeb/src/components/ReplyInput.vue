<template>
  <div class="reply-input-container" v-if="visible">
    <!-- 回复输入框 -->
    <div class="reply-input-wrapper">
      <!-- 回复对象提示 -->
      <div class="reply-to-hint" v-if="isReplyMode && replyToUser">
        回复 @{{ replyToUser }}
      </div>
      
      <!-- 发表评论提示 -->
      <div class="comment-hint" v-if="!isReplyMode">
        发表评论
      </div>
      
      <!-- 输入区域 -->
      <div class="input-area">
        <textarea
          ref="replyTextarea"
          v-model="replyContent"
          class="reply-textarea"
          :placeholder="isReplyMode ? '写下你的回复...' : '写下你的评论...'"
          :maxlength="maxLength"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
        ></textarea>
        
        <!-- 字数统计 -->
        <div class="char-count">
          {{ replyContent.length }}/{{ maxLength }}
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="cancel-btn" @click="cancelReply">取消</button>
        <button 
          class="submit-btn" 
          :class="{ disabled: !canSubmit }"
          @click="submitReply"
        >
          发送
        </button>
      </div>
    </div>
    
    <!-- 遮罩层 -->
    <div class="overlay" @click="cancelReply"></div>
  </div>
</template>

<script>
// ReplyInput.vue - 回复评论输入组件
// 功能：提供回复评论的输入界面，支持字数限制和发送功能
// 设计要点：
// 1. 弹出式输入框，带有遮罩层
// 2. 显示回复对象提示
// 3. 500字限制，实时显示字数统计
// 4. 自动聚焦输入框
// 5. 发送和取消按钮

export default {
  name: 'ReplyInput',
  props: {
    // 是否显示输入框
    visible: {
      type: Boolean,
      default: false
    },
    // 回复对象用户名
    replyToUser: {
      type: String,
      default: ''
    },
    // 是否为回复模式（true为回复模式，false为发表评论模式）
    isReplyMode: {
      type: Boolean,
      default: true
    },
    // 最大输入字数
    maxLength: {
      type: Number,
      default: 500
    }
  },
  data() {
    return {
      replyContent: ''
    }
  },
  computed: {
    // 是否可以提交（内容不为空）
    canSubmit() {
      return this.replyContent.trim().length > 0
    }
  },
  watch: {
    // 监听显示状态变化，显示时自动聚焦
    visible(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.focusTextarea()
        })
      } else {
        // 隐藏时清空内容
        this.replyContent = ''
      }
    }
  },
  methods: {
    // 处理输入事件
    handleInput() {
      // 触发输入事件，父组件可以监听
      this.$emit('input', this.replyContent)
    },
    
    // 处理聚焦事件
    handleFocus() {
      this.$emit('focus')
    },
    
    // 处理失焦事件
    handleBlur() {
      this.$emit('blur')
    },
    
    // 聚焦文本框
    focusTextarea() {
      if (this.$refs.replyTextarea) {
        this.$refs.replyTextarea.focus()
      }
    },
    
    // 取消回复
    cancelReply() {
      this.$emit('cancel')
    },
    
    // 提交回复
    submitReply() {
      if (!this.canSubmit) return
      
      // 触发提交事件，传递回复内容
      this.$emit('submit', this.replyContent.trim())
      
      // 清空内容
      this.replyContent = ''
    }
  }
}
</script>

<style scoped>
/* 回复输入容器 */
.reply-input-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

/* 遮罩层 */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: -1;
}

/* 回复输入框包装器 */
.reply-input-wrapper {
  background-color: #ffffff;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  padding: 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

/* 回复对象提示 */
.reply-to-hint {
  font-size: 14px;
  color: #666666;
  margin-bottom: 8px;
}

/* 发表评论提示 */
.comment-hint {
  font-size: 14px;
  color: #666666;
  margin-bottom: 8px;
}

/* 输入区域 */
.input-area {
  position: relative;
  margin-bottom: 16px;
}

/* 回复文本框 */
.reply-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  box-sizing: border-box;
}

/* 文本框聚焦状态 */
.reply-textarea:focus {
  border-color: #FF0000;
}

/* 字数统计 */
.char-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  color: #999999;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 4px;
  border-radius: 4px;
}

/* 操作按钮区域 */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 按钮基础样式 */
.action-buttons button {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 取消按钮 */
.cancel-btn {
  background-color: #f5f5f5;
  color: #666666;
  border: 1px solid #e0e0e0;
}

/* 取消按钮点击效果 */
.cancel-btn:active {
  background-color: #e0e0e0;
}

/* 提交按钮 */
.submit-btn {
  background-color: #FF0000;
  color: #ffffff;
  border: 1px solid #FF0000;
}

/* 提交按钮禁用状态 */
.submit-btn.disabled {
  background-color: #cccccc;
  color: #999999;
  border-color: #cccccc;
  cursor: not-allowed;
}

/* 提交按钮点击效果 */
.submit-btn:not(.disabled):active {
  background-color: #cc0000;
}

/* 响应式适配 - iPhone 12 Pro */
@media screen and (max-width: 390px) {
  .reply-input-wrapper {
    padding: 12px;
  }
  
  .action-buttons {
    gap: 8px;
  }
  
  .action-buttons button {
    padding: 6px 14px;
    font-size: 13px;
  }
}
</style>