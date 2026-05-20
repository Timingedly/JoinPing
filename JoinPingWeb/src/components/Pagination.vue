<template>
  <div class="pagination">
    <!-- 每页显示条数选择器 -->
    <div class="page-size-selector">
      <span>每页</span>
      <select v-model="selectedPageSize" @change="handlePageSizeChange" class="page-size-input">
        <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
      </select>
      <span>条</span>
    </div>
    
    <!-- 上一页按钮 -->
    <button 
      class="page-btn" 
      :disabled="currentPage <= 1"
      @click="goToPage(currentPage - 1)"
    >
      上一页
    </button>
    
    <!-- 页码按钮 - 简化版：...，当前页，...，尾页 -->
    <div class="page-numbers">
      <!-- 显示省略号（当前页不是第1页和第2页时） -->
      <span v-if="currentPage > 2" class="ellipsis">...</span>
      
      <!-- 只显示当前页码 -->
      <button 
        class="page-btn active"
        disabled
      >
        {{ currentPage }}
      </button>
      
      <!-- 显示省略号（当前页不是倒数第1页和倒数第2页时） -->
      <span v-if="currentPage < totalPages - 1" class="ellipsis">...</span>
      
      <!-- 显示末页（如果不是当前页） -->
      <button 
        v-if="currentPage < totalPages" 
        class="page-btn"
        @click="goToPage(totalPages)"
      >
        {{ totalPages }}
      </button>
    </div>
    
    <!-- 下一页按钮 -->
    <button 
      class="page-btn" 
      :disabled="currentPage >= totalPages"
      @click="goToPage(currentPage + 1)"
    >
      下一页
    </button>
    
    <!-- 页码跳转 -->
    <div class="page-jump">
      <span>跳至</span>
      <input 
        type="number" 
        v-model="jumpPageInput" 
        @keyup.enter="handleJumpPage" 
        class="page-jump-input"
        :min="1" 
        :max="totalPages"
      >
      <span>页</span>
      <button class="jump-btn" @click="handleJumpPage">跳转</button>
    </div>
    
    <!-- 总页数显示 -->
    <div class="total-pages">
      <span>共 {{ totalPages }} 页</span>
    </div>
  </div>
</template>

<script>
// Pagination.vue - 通用分页器组件
// 功能：提供分页导航功能，支持页码显示、上下页切换
// 设计要点：
// 1. 显示当前页码和总页数
// 2. 支持上一页、下一页按钮
// 3. 智能显示可见页码范围，超出范围显示省略号
// 4. 支持直接跳转到首页和末页

export default {
  name: 'Pagination',
  props: {
    // 当前页码
    currentPage: {
      type: Number,
      required: true,
      default: 1
    },
    // 总页数
    totalPages: {
      type: Number,
      required: true,
      default: 1
    },
    // 每页显示条数
    pageSize: {
      type: Number,
      default: 10
    },
    // 总记录数
    totalItems: {
      type: Number,
      default: 0
    },
    // 可见页码数量（单边）
    visibleRange: {
      type: Number,
      default: 2
    }
  },
  data() {
    return {
      // 每页显示条数选项
      pageSizeOptions: [10, 50],
      // 当前选择的每页显示条数
      selectedPageSize: this.pageSize,
      // 跳转页码输入
      jumpPageInput: ''
    };
  },
  computed: {
    // 监听pageSize变化，同步到selectedPageSize
    syncPageSize() {
      if (this.selectedPageSize !== this.pageSize) {
        this.selectedPageSize = this.pageSize
      }
    }
  },
  
  // 监听props变化
  watch: {
    pageSize(newSize) {
      this.selectedPageSize = newSize
    }
  },
  methods: {
    // 跳转到指定页码
    goToPage(page) {
      console.log('分页器goToPage方法调用，目标页码:', page, '当前页码:', this.currentPage, '总页数:', this.totalPages);
      
      // 验证页码范围
      if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
        console.log('触发page-change事件，页码:', page);
        // 触发页码变化事件
        this.$emit('page-change', page)
      } else {
        console.log('页码验证失败，不触发事件');
      }
    },
    
    // 处理每页显示条数变化
    handlePageSizeChange() {
      console.log('分页器handlePageSizeChange方法调用，当前选择条数:', this.selectedPageSize, '当前条数:', this.pageSize);
      
      if (this.selectedPageSize !== this.pageSize) {
        console.log('触发page-size-change事件，条数:', this.selectedPageSize, '页码: 1');
        // 触发每页条数变化事件，同时重置到第一页
        this.$emit('page-size-change', this.selectedPageSize, 1)
      } else {
        console.log('条数未变化，不触发事件');
      }
    },
    
    // 处理页码跳转
    handleJumpPage() {
      let page = parseInt(this.jumpPageInput)
      // 验证输入并跳转到指定页码
      if (!isNaN(page) && page >= 1 && page <= this.totalPages && page !== this.currentPage) {
        this.goToPage(page)
        this.jumpPageInput = ''
      }
    }
  }
}
</script>

<style scoped>
/* 分页器容器 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 0;
  flex-wrap: wrap;
}

/* 每页显示条数选择器 */
.page-size-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666666;
}

/* 每页显示条数输入框 */
.page-size-input {
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  background-color: #ffffff;
  color: #333333;
  outline: none;
}

.page-size-input:focus {
  border-color: #FF0000;
}

/* 页码跳转 */
.page-jump {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666666;
}

/* 页码跳转输入框 */
.page-jump-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  outline: none;
}

.page-jump-input:focus {
  border-color: #FF0000;
}

/* 跳转按钮 */
.jump-btn {
  padding: 4px 12px;
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
  color: #666666;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.jump-btn:hover {
  border-color: #FF0000;
  color: #FF0000;
}

/* 总页数显示 */
.total-pages {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666666;
  font-family: inherit;
  line-height: 1;
}

/* 页码按钮 */
.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
  color: #666666;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 页码按钮悬停状态 */
.page-btn:hover:not(:disabled) {
  border-color: #FF0000;
  color: #FF0000;
}

/* 页码按钮激活状态 */
.page-btn.active {
  background-color: #FF0000;
  border-color: #FF0000;
  color: #ffffff;
}

/* 页码按钮禁用状态 */
.page-btn:disabled {
  background-color: #f5f5f5;
  color: #cccccc;
  cursor: not-allowed;
  border-color: #e0e0e0;
}

/* 页码数字容器 */
.page-numbers {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 省略号 */
.ellipsis {
  color: #999999;
  font-size: 14px;
  padding: 0 4px;
}

/* 页码信息 */
.page-info {
  font-size: 14px;
  color: #666666;
  margin-left: 8px;
}

/* 响应式适配 */
@media screen and (max-width: 390px) {
  .pagination {
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .page-btn {
    min-width: 28px;
    height: 28px;
    font-size: 12px;
    padding: 0 6px;
  }
  
  .page-info {
    margin-left: 0;
    width: 100%;
    text-align: center;
    order: 1;
  }
}
</style>