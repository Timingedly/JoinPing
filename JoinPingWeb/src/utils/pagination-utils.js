/**
 * 分页数据处理工具函数
 * 提供统一的分页数据处理和验证功能，防止分页器问题再次出现
 * 
 * 主要功能：
 * 1. 分页数据验证和状态检查
 * 2. 分页状态一致性验证
 * 3. 分页错误监控和报告
 * 4. 分页数据处理标准化
 */

/**
 * 分页数据验证结果对象
 * @typedef {Object} PaginationValidationResult
 * @property {boolean} isValid - 数据是否有效
 * @property {string|null} warning - 警告信息
 * @property {string|null} error - 错误信息
 * @property {Object} details - 详细验证信息
 */

/**
 * 验证分页数据的一致性
 * @param {Object} apiData - API返回的分页数据
 * @param {Object} frontendState - 前端分页状态
 * @param {string} componentName - 组件名称（用于日志）
 * @returns {PaginationValidationResult}
 */
export function validatePaginationConsistency(apiData, frontendState, componentName = 'unknown') {
  // 后端返回String类型，需要转换为Number进行比较
  const backendCurrent = Number(apiData.current) || 1;
  const backendPages = Number(apiData.pages) || 1;
  const backendTotal = Number(apiData.total) || 0;
  const { currentPage, totalPages, totalItems } = frontendState;
  
  const result = {
    isValid: true,
    warning: null,
    error: null,
    details: {
      backendCurrent: backendCurrent,
      frontendCurrent: currentPage,
      backendPages: backendPages,
      frontendPages: totalPages,
      backendTotal: backendTotal,
      frontendTotal: totalItems,
      componentName
    }
  };
  
  // 重要：前端应保持状态独立性，不依赖后端current字段
  // 因此不再验证当前页码一致性，只验证总页数和总记录数的合理性
  
  // 验证总页数合理性
  if (backendPages < 1) {
    result.isValid = false;
    result.error = `无效的总页数：${backendPages}`;
  }
  
  // 验证当前页码在合理范围内（仅作为参考，不强制要求）
  if (backendCurrent < 1 || backendCurrent > backendPages) {
    result.warning = `后端返回的当前页码超出范围：${backendCurrent}，总页数：${backendPages}`;
  }
  
  return result;
}

/**
 * 安全处理分页API响应数据
 * 防止错误使用后端current字段更新前端状态
 * @param {Object} apiResponse - API响应数据
 * @param {Object} frontendState - 前端当前分页状态
 * @param {string} componentName - 组件名称
 * @returns {Object} 安全处理后的分页数据
 */
export function safeProcessPaginationData(apiResponse, frontendState, componentName) {
  if (!apiResponse || !apiResponse.data) {
    console.error(`[${componentName}] API响应数据无效`);
    return {
      list: [],
      total: 0,
      pages: 1,
      current: frontendState.currentPage
    };
  }
  
  const apiData = apiResponse.data;
  
  // 执行分页数据验证
  const validation = validatePaginationConsistency(apiData, frontendState, componentName);
  
  if (!validation.isValid) {
    console.error(`[${componentName}] 分页数据验证失败：`, validation);
  }
  
  // 返回安全的分页数据（不包含可能误导的current字段）
  return {
    list: apiData.list || [],
    total: apiData.total || 0,
    pages: apiData.pages || 1,
    // 注意：不返回current字段，避免误用
    size: apiData.size || frontendState.pageSize,
    hasNext: apiData.hasNext || false,
    hasPrevious: apiData.hasPrevious || false,
    validation: validation // 包含验证信息供调试使用
  };
}

/**
 * 标准分页状态更新函数
 * 提供统一的分页状态更新逻辑，防止错误更新
 * @param {Object} component - Vue组件实例
 * @param {Object} processedData - 经过安全处理的分页数据
 * @param {boolean} keepCurrentPage - 是否保持当前页码（默认true）
 */
export function updatePaginationState(component, processedData, keepCurrentPage = true) {
  // 更新列表数据
  if (processedData.list) {
    component.dataList = processedData.list;
  }
  
  // 更新分页信息
  component.totalItems = processedData.total || 0;
  component.totalPages = processedData.pages || 1;
  
  // 重要：不更新currentPage，保持前端状态独立性
  if (!keepCurrentPage) {
    // 只有在明确需要时才更新currentPage（如重置到第一页）
    component.currentPage = 1;
  }
  
  // 记录状态更新
  console.log(`[${component.$options.name}] 分页状态更新完成：`, {
    当前页码: component.currentPage,
    总页数: component.totalPages,
    总记录数: component.totalItems,
    列表长度: component.dataList.length
  });
}

/**
 * 分页参数验证函数
 * 验证分页参数的有效性
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {boolean}
 */
export function validatePaginationParams(page, pageSize) {
  if (page < 1) {
    console.error('无效的页码：', page);
    return false;
  }
  
  if (pageSize < 1 || pageSize > 100) {
    console.error('无效的每页数量：', pageSize);
    return false;
  }
  
  return true;
}

// 导入更强大的分页监控器
// import { createPaginationMonitor as createAdvancedMonitor } from './pagination-monitor.js'

/**
 * 创建分页监控器
 * 用于监控分页组件的状态变化
 * @param {string} componentName - 组件名称
 * @returns {Object} 监控器对象
 */
export function createPaginationMonitor(componentName) {
  // 使用新的分页监控器
  return createAdvancedMonitor(componentName)
}

/**
 * 分页工具Mixin
 * 提供标准的分页处理逻辑，可在各个组件中使用
 */
export const paginationMixin = {
  data() {
    return {
      // 分页监控器
      paginationMonitor: null
    };
  },
  
  created() {
    // 初始化分页监控器
    this.paginationMonitor = createPaginationMonitor(this.$options.name || 'UnknownComponent');
  },
  
  methods: {
    /**
     * 安全的分页数据处理方法
     */
    safeProcessPaginationData(apiResponse) {
      return safeProcessPaginationData(apiResponse, {
        currentPage: this.currentPage,
        totalPages: this.totalPages,
        totalItems: this.totalItems,
        pageSize: this.pageSize
      }, this.$options.name);
    },
    
    /**
     * 标准的分页状态更新方法
     */
    safeUpdatePaginationState(processedData, keepCurrentPage = true) {
      updatePaginationState(this, processedData, keepCurrentPage);
    },
    
    /**
     * 分页参数验证
     */
    validatePaginationParams() {
      return validatePaginationParams(this.currentPage, this.pageSize);
    }
  }
};

/**
 * 全局分页配置
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  PAGE_SIZE_OPTIONS: [10, 20, 30, 50],
  
  // 开发环境启用详细日志
  enableDebugLogs: process.env.NODE_ENV === 'development',
  
  // 分页状态监控开关
  enableMonitoring: true
};

export default {
  validatePaginationConsistency,
  safeProcessPaginationData,
  updatePaginationState,
  validatePaginationParams,
  createPaginationMonitor,
  paginationMixin,
  PAGINATION_CONFIG
};