// 图片管理模块
class ImageManager {
  constructor() {
    this.images = new Map();
    this.config = {
      logoPath: 'pic/logo.png',
      sealPath: 'pic/seal.png'
    };
  }

  /**
   * 预加载图片资源
   * @returns {Promise<void>}
   */
  async preloadImages() {
    try {
      await this.loadImage(this.config.logoPath);
      await this.loadImage(this.config.sealPath);
      console.log('所有图片预加载完成');
    } catch (error) {
      console.error('图片预加载失败:', error);
    }
  }

  /**
   * 加载单个图片
   * @param {string} imagePath - 图片路径
   * @returns {Promise<HTMLImageElement>} 图片元素
   */
  loadImage(imagePath) {
    return new Promise((resolve, reject) => {
      // 检查是否已经缓存了该图片
      if (this.images.has(imagePath)) {
        resolve(this.images.get(imagePath));
        return;
      }

      const img = new Image();
      
      img.onload = () => {
        this.images.set(imagePath, img);
        resolve(img);
      };

      img.onerror = (error) => {
        console.error(`加载图片失败: ${imagePath}`, error);
        reject(new Error(`无法加载图片: ${imagePath}`));
      };

      // 开始加载图片
      img.src = imagePath;
    });
  }

  /**
   * 获取图片元素
   * @param {string} imagePath - 图片路径
   * @returns {HTMLImageElement|undefined} 图片元素
   */
  getImage(imagePath) {
    return this.images.get(imagePath);
  }

  /**
   * 将图片转换为Base64编码
   * @param {string} imagePath - 图片路径
   * @returns {Promise<string>} Base64编码的图片
   */
  async imageToBase64(imagePath) {
    const img = await this.loadImage(imagePath);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    return canvas.toDataURL();
  }

  /**
   * 设置配置
   * @param {Object} config - 配置对象
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   * @returns {Object} 配置对象
   */
  getConfig() {
    return this.config;
  }

  /**
   * 清除图片缓存
   */
  clearCache() {
    this.images.clear();
  }
}

// 创建全局实例
const imageManager = new ImageManager();

// 导出模块（如果在支持模块的环境中）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ImageManager, imageManager };
} else if (typeof window !== 'undefined') {
  window.ImageManager = ImageManager;
  window.imageManager = imageManager;
}