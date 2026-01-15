// 截图管理模块
class ScreenshotManager {
  constructor() {
    this.options = {
      scale: 4,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 15000,
      removeContainer: true,
      foreignObjectRendering: false,
      dpi: window.devicePixelRatio * 4
    };
  }

  /**
   * 设置截图选项
   * @param {Object} options - 截图选项
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
  }

  /**
   * 替换输入框为span标签（用于截图）
   * @param {HTMLElement} container - 容器元素
   */
  replaceInputsForSnapshot(container) {
    const inputs = container.querySelectorAll('input[type="text"], input:not([type]), textarea');
    inputs.forEach(input => {
      const span = document.createElement('span');
      span.textContent = input.value || '';

      const computedStyle = window.getComputedStyle(input);

      // 完整复制视觉属性
      span.style.fontFamily = computedStyle.fontFamily;
      span.style.fontSize = computedStyle.fontSize;
      span.style.fontWeight = computedStyle.fontWeight;
      span.style.color = computedStyle.color;
      span.style.textAlign = computedStyle.textAlign;

      span.style.width = computedStyle.width;
      span.style.height = computedStyle.height;
      span.style.padding = computedStyle.padding;
      span.style.border = computedStyle.border;
      span.style.boxSizing = 'border-box';

      // 避免baseline裁切
      span.style.display = 'inline-flex';
      span.style.alignItems = 'center';
      span.style.justifyContent =
        computedStyle.textAlign === 'center' ? 'center' : 'flex-start';
      span.style.lineHeight = computedStyle.height;

      span.style.whiteSpace = 'pre-wrap';
      span.style.background = 'transparent';

      span.dataset.snapshotReplace = 'true';

      input.style.display = 'none';
      input.parentNode.insertBefore(span, input);
    });
  }

  /**
   * 恢复输入框（截图后）
   * @param {HTMLElement} container - 容器元素
   */
  restoreInputsAfterSnapshot(container) {
    const spans = container.querySelectorAll('span[data-snapshot-replace]');
    spans.forEach(span => {
      const input = span.nextSibling;
      if (input && input.tagName === 'INPUT') {
        input.style.display = '';
      }
      span.remove();
    });
  }

  /**
   * 等待图片加载完成
   * @param {HTMLElement} container - 容器元素
   * @returns {Promise<void>}
   */
  waitForImages(container) {
    const images = container.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          const loadHandler = () => {
            resolve();
            img.removeEventListener('load', loadHandler);
            img.removeEventListener('error', loadHandler);
          };
          img.addEventListener('load', loadHandler);
          img.addEventListener('error', loadHandler);
        }
      });
    });
    
    return imagePromises.length > 0 ? Promise.all(imagePromises) : Promise.resolve();
  }

  /**
   * 计算容器的实际高度
   * @param {HTMLElement} container - 容器元素
   * @returns {number} 计算后的高度
   */
  calculateContainerHeight(container) {
    const actualHeight = Math.max(
      container.scrollHeight,
      container.offsetHeight,
      container.clientHeight
    );
    
    // 额外增加一些缓冲空间以确保所有内容都被捕获
    return Math.floor(actualHeight * 1.1); // 增加10%的缓冲
  }

  /**
   * 将canvas转换为blob
   * @param {HTMLCanvasElement} canvas - Canvas元素
   * @param {string} mimeType - MIME类型
   * @param {number} quality - 图片质量
   * @returns {Promise<Blob>} Blob对象
   */
  canvasToBlob(canvas, mimeType = 'image/png', quality = 0.9) {
    return new Promise((resolve) => {
      try {
        // 先转为 dataURL
        const dataURL = canvas.toDataURL(mimeType, quality);
        // 再将 dataURL 转为 Blob
        const byteString = atob(dataURL.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        resolve(new Blob([ab], { type: mimeType }));
      } catch (e) {
        console.warn('Canvas被污染，无法导出图像:', e);
        // 返回一个空白图片作为替代
        const blankCanvas = document.createElement('canvas');
        blankCanvas.width = canvas.width;
        blankCanvas.height = canvas.height;
        const ctx = blankCanvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, blankCanvas.width, blankCanvas.height);
        ctx.fillStyle = 'red';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('因跨域限制无法生成截图', blankCanvas.width / 2, blankCanvas.height / 2);
        resolve(this.dataURItoBlob(blankCanvas.toDataURL()));
      }
    });
  }

  /**
   * 将dataURL转换为Blob
   * @param {string} dataURI - Data URI
   * @returns {Blob} Blob对象
   */
  dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/png' });
  }

  /**
   * 下载文件
   * @param {Blob} blob - Blob对象
   * @param {string} fileName - 文件名
   */
  downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * 执行截图操作
   * @param {HTMLElement} container - 要截图的容器
   * @param {string} buyerName - 买方名称
   * @param {string} amount - 金额
   * @returns {Promise<void>}
   */
  async captureScreenshot(container, buyerName, amount) {
    try {
      // 隐藏导入按钮区域
      const importControls = document.querySelector('.import-controls');
      if (importControls) {
        importControls.style.display = 'none';
      }

      // 替换输入框为span
      this.replaceInputsForSnapshot(container);

      // 等待样式生效
      await new Promise(resolve => setTimeout(resolve, 500));

      // 等待样式应用
      await new Promise(resolve => setTimeout(resolve, 100));

      // 等待图片加载完成
      await this.waitForImages(container);

      // 额外等待确保所有内容渲染完成
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 计算容器高度
      const actualHeight = this.calculateContainerHeight(container);

      // 执行截图
      const canvas = await html2canvas(container, {
        ...this.options,
        width: container.scrollWidth,
        height: actualHeight,
        windowWidth: container.scrollWidth,
        windowHeight: actualHeight
      });

      // 恢复输入框
      this.restoreInputsAfterSnapshot(container);

      // 转换为blob
      const blob = await this.canvasToBlob(canvas, 'image/png', 0.9);

      // 生成文件名
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const fileName = `${buyerName}_${amount}_${dateStr}.png`;

      // 下载文件
      this.downloadBlob(blob, fileName);

      console.log(`截图已保存：${fileName}`);

      // 显示导入按钮
      if (importControls) {
        importControls.style.display = 'block';
      }
    } catch (error) {
      console.error('截图失败:', error);
      // 确保显示导入按钮
      const importControls = document.querySelector('.import-controls');
      if (importControls) {
        importControls.style.display = 'block';
      }
    }
  }
}

// 创建全局实例
const screenshotManager = new ScreenshotManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScreenshotManager, screenshotManager };
} else if (typeof window !== 'undefined') {
  window.ScreenshotManager = ScreenshotManager;
  window.screenshotManager = screenshotManager;
}