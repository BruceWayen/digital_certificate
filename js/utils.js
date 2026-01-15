// 工具函数集合
class Utils {
  /**
   * 中文数字映射
   */
  static get chineseNumbers() {
    return {
      '零': 0, '一': 1, '壹': 1, '二': 2, '贰': 2, '三': 3, '叁': 3,
      '四': 4, '肆': 4, '五': 5, '伍': 5, '六': 6, '陆': 6,
      '七': 7, '柒': 7, '八': 8, '捌': 8, '九': 9, '玖': 9
    };
  }

  /**
   * 中文单位映射
   */
  static get chineseUnits() {
    return {
      '十': 10, '拾': 10, '百': 100, '佰': 100,
      '千': 1000, '仟': 1000, '万': 10000, '亿': 100000000
    };
  }

  /**
   * 日期格式化工具
   */
  static formatDate(dateStr) {
    if (!dateStr || dateStr === '' || dateStr === 'NaT' || dateStr === null || dateStr === undefined) {
      return this.getCurrentDate();
    }

    // 如果已经是期望的格式 "YYYY年MM月DD日"，直接返回
    if (/^\d{4}年\d{2}月\d{2}日$/.test(dateStr)) {
      return dateStr;
    }

    let date;

    // 检查是否为Excel序列化日期（数字格式，通常是大于等于25569的整数，对应1970年1月1日）
    if (typeof dateStr === 'number' || (typeof dateStr === 'string' && !isNaN(dateStr) && /^\d+$/.test(dateStr.trim()))) {
      const excelSerialDate = Number(dateStr);
      // Excel日期系统从1900年1月1日开始，但有闰年错误，所以从1900年1月1日（序列号1）开始计算
      // 但Excel错误地认为1900年是闰年，所以要特别处理
      if (excelSerialDate >= 1) {
        // Excel把1900年2月29日作为一个有效日期（实际上不存在）
        // 所以对于大于等于60（1900年2月29日）的日期，需要加1天的偏移
        let adjustedDays = excelSerialDate;
        if (excelSerialDate >= 60) {
          adjustedDays++; // 修正Excel的闰年错误
        }

        // 1900年1月1日对应的毫秒数
        const excelEpoch = new Date(1899, 11, 30); // JavaScript中月份从0开始，所以11表示12月
        date = new Date(excelEpoch.getTime() + (adjustedDays * 24 * 60 * 60 * 1000));
      }
    } else if (typeof dateStr === 'string') {
      // 替换中文字符为标准分隔符
      let normalizedDate = dateStr.replace(/年/g, '-').replace(/月/g, '-').replace(/日/g, '');

      // 替换各种分隔符为标准格式
      normalizedDate = normalizedDate.replace(/\//g, '-').replace(/\.+/g, '-');

      // 特殊处理: 如果日期格式为 YYYY-MM-DD 或 YYYY-M-D，确保月份和日期为两位数
      const parts = normalizedDate.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        normalizedDate = `${year}-${month}-${day}`;
      }

      // 尝试解析标准化后的日期
      date = new Date(normalizedDate);

      // 如果标准解析失败，尝试更复杂的解析方式
      if (isNaN(date.getTime())) {
        // 尝试移除可能的额外字符
        let cleanDateStr = dateStr.replace(/[年月]/g, '/').replace(/日/g, '');
        date = new Date(cleanDateStr);
      }
    } else {
      // 如果是日期对象
      date = new Date(dateStr);
    }

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return this.getCurrentDate();
    }

    // 格式化为 "YYYY年MM月DD日" 格式
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}年${month}月${day}日`;
  }

  /**
   * 获取当前日期（中文格式）
   */
  static getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
  }

  /**
   * 计算两年后的日期
   */
  static getTwoYearsLater(dateStr) {
    const formattedDate = this.formatDate(dateStr);

    // 解析格式化的日期
    const match = formattedDate.match(/(\d{4})年(\d{2})月(\d{2})日/);
    if (!match) {
      const now = new Date();
      now.setFullYear(now.getFullYear() + 2);
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}年${month}月${day}日`;
    }

    const year = parseInt(match[1]) + 2;
    const month = match[2];
    const day = match[3];
    return `${year}年${month}月${day}日`;
  }

  /**
   * 计算HASH值
   */
  static async calculateHash(data) {
    const text = [
      data.buyer || '',
      data.buyerCode || '',
      data.seller || '',
      data.sellerCode || '',
      String(data.amount || ''),
      data.accountName || '',
      data.bankNumber || '',
      data.accountNumber || '',
      data.bankName || '',
      data.paymentDate || '',
      data.validDate || ''
    ].join('|');

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    // 返回前32位十六进制字符（128位哈希值）
    return hashHex.substring(0, 32);
  }

  /**
   * 生成权证编号
   */
  static generateWarrantNumber(counter = 1) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const counterStr = String(counter).padStart(4, '0');

    return `${year}${month}${day}${hour}${minute}${second}${counterStr}`;
  }

  /**
   * 检查字符串是否为空或仅包含空白字符
   */
  static isEmpty(str) {
    return !str || str.trim() === '';
  }

  /**
   * 安全获取对象属性，避免访问不存在的属性导致错误
   */
  static safeGet(obj, path, defaultValue = '') {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result != null ? result : defaultValue;
  }

  /**
   * 防抖函数
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * 节流函数
   */
  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
} else if (typeof window !== 'undefined') {
  window.Utils = Utils;
}