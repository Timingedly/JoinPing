// 图片处理工具
// 功能：处理图片URL，确保经过代理

/**
 * 处理图片URL，确保经过代理
 * @param {string} imageUrl - 原始图片URL
 * @returns {string} 处理后的图片URL
 */
export function processImageUrl(imageUrl) {
  if (!imageUrl) {
    return '';
  }
  
  // 如果已经是完整URL，直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // 如果是相对路径，添加代理前缀
  // 后端图片路径以 /image 开头
  if (imageUrl.startsWith('/image')) {
    return imageUrl;
  }
  
  // 如果是不完整的路径，添加 /image 前缀
  return `/image/${imageUrl}`;
}

/**
 * 获取默认头像
 * @returns {string} 默认头像URL
 */
export function getDefaultAvatar() {
  return '/image/default/userDefaultImage.png';
}