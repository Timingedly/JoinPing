/**
 * 日期工具函数
 * 提供日期格式化、日期计算等功能
 */

/**
 * 格式化日期为指定格式
 * @param {string|Date} date - 日期对象或日期字符串
 * @param {string} format - 格式化模板，默认格式: 'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  
  // 处理日期对象
  const d = typeof date === 'string' ? new Date(date) : date
  
  // 检查日期是否有效
  if (isNaN(d.getTime())) {
    console.error('Invalid date:', date)
    return ''
  }
  
  // 获取日期各部分
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  // 替换模板中的占位符
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化日期为中文年月日格式
 * @param {string|Date} date - 日期对象或日期字符串
 * @returns {string} 格式化后的中文日期字符串
 */
export function formatChineseDate(date) {
  return formatDate(date, 'YYYY年MM月DD日')
}

/**
 * 获取相对时间描述
 * @param {string|Date} date - 日期对象或日期字符串
 * @returns {string} 相对时间描述
 */
export function getRelativeTime(date) {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now - d
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSecs < 60) {
    return '刚刚'
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return formatChineseDate(date)
  }
}