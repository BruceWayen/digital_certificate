// 数字确真凭证 - 工具类
class Utils {
    // 中文数字映射
    static chineseDigits = {
        '零': 0, '壹': 1, '贰': 2, '叁': 3, '肆': 4,
        '伍': 5, '陆': 6, '柒': 7, '捌': 8, '玖': 9
    };

    // 单位映射
    static units = {
        '拾': 10,
        '佰': 100,
        '仟': 1000,
        '万': 10000,
        '亿': 100000000
    };

    // 数字转中文大写金额
    static numberToChineseAmount(num) {
        // 输入校验与格式化
        num = Number(num).toString();
        if (isNaN(num) || Number(num) < 0) {
            return "输入无效，请传入非负数字";
        }
        const [integerPart, decimalPart = ""] = num.split(".");
        const fixedDecimal = decimalPart.padEnd(2, "0").slice(0, 2);

        // 核心映射表
        const digitChars = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
        const unitChars = ["", "拾", "佰", "仟"];
        const bigUnitChars = ["", "万", "亿", "万亿"];

        // 处理整数部分
        function convertInteger(integerStr) {
            if (integerStr === "0") return "零";
            let result = "";
            const len = integerStr.length;

            for (let i = 0; i < Math.ceil(len / 4); i++) {
                const start = Math.max(0, len - 4 * (i + 1));
                const group = integerStr.slice(start, len - 4 * i);
                let groupResult = "";
                let hasNonZero = false;

                for (let j = 0; j < group.length; j++) {
                    const digit = parseInt(group[j]);
                    const position = group.length - 1 - j;

                    if (digit === 0) {
                        if (hasNonZero) {
                            hasNonZero = false;
                            groupResult += "零";
                        }
                        continue;
                    }
                    hasNonZero = true;
                    groupResult += digitChars[digit] + unitChars[position];
                }

                // 过滤组末尾零 + 拼接大单位
                groupResult = groupResult.replace(/零$/, "");
                if (groupResult) {
                    groupResult += bigUnitChars[i];
                    const tempResult = groupResult + result;
                    // 合并连续零 + 剔除开头零
                    result = tempResult.replace(/零+/g, "零").replace(/^零/, "");
                } else if (result && !result.startsWith("零") && i > 0) {
                    // 万级/亿级全零，个级非零，补单个零连接
                    if (!result.endsWith("零")) {
                        result = "零" + result;
                    }
                }
            }
            return result.replace(/零+$/, "").replace(/零+/g, "零");
        }

        // 处理小数部分（角、分）
        function convertDecimal(decimalStr) {
            const [jiao, fen] = decimalStr.split("");
            let result = "";
            if (jiao !== "0") result += digitChars[parseInt(jiao)] + "角";
            if (fen !== "0") {
                result += (jiao === "0" && result === "" ? "零" : "") + digitChars[parseInt(fen)] + "分";
            }
            return result;
        }

        // 组合结果
        const integerChinese = convertInteger(integerPart);
        const decimalChinese = convertDecimal(fixedDecimal);
        const prefix = integerChinese === "零" ? "零元" : `${integerChinese}元`;

        if (decimalChinese) {
            return prefix + decimalChinese;
        } else {
            return `${prefix}整`;
        }
    }

    // 解析中文数字
    static convertChineseToNumberCore(chinese) {
        // 去除空格和"整"字（如果有）
        chinese = chinese.replace(/\s+/g, '').replace(/整$/, '');

        // 角分单位
        const decimalUnits = { '角': 0.1, '分': 0.01 };

        let total = 0;
        let current = 0; // 当前正在构建的数值段（如"壹万贰仟"中的"壹万"部分）
        let temp = 0;    // 临时值，用于处理"拾"等单位
        let hasDecimal = false;
        let decimalPart = 0;

        // 分离整数和小数部分（以"元"为界）
        let integerPart = chinese;
        let jiaoFenPart = '';

        if (chinese.includes('元')) {
            const parts = chinese.split('元');
            integerPart = parts[0];
            jiaoFenPart = parts[1] || '';
        } else if (chinese.includes('角') || chinese.includes('分')) {
            // 没有"元"，但有角/分，说明整数部分为0
            integerPart = '';
            jiaoFenPart = chinese;
            hasDecimal = true;
        }

        // 处理整数部分
        if (integerPart) {
            let section = 0; // 当前段（亿、万等之间的段）
            let billion = 0;
            let tenThousand = 0;

            for (let i = 0; i < integerPart.length; i++) {
                const char = integerPart[i];
                if (this.chineseDigits[char] !== undefined) {
                    temp = this.chineseDigits[char];
                } else if (char === '拾') {
                    if (temp === 0) temp = 1; // 如"拾万"实际是"壹拾万"
                    section += temp * 10;
                    temp = 0;
                } else if (char === '佰') {
                    section += temp * 100;
                    temp = 0;
                } else if (char === '仟') {
                    section += temp * 1000;
                    temp = 0;
                } else if (char === '万') {
                    section += temp;
                    tenThousand = section;
                    section = 0;
                    temp = 0;
                } else if (char === '亿') {
                    section += temp;
                    billion = section * 100000000;
                    section = 0;
                    temp = 0;
                }
            }
            section += temp;
            total = billion + tenThousand * 10000 + section;
        }

        // 处理角分部分
        if (jiaoFenPart) {
            let jiao = 0;
            let fen = 0;
            for (let i = 0; i < jiaoFenPart.length; i++) {
                const char = jiaoFenPart[i];
                if (this.chineseDigits[char] !== undefined) {
                    const num = this.chineseDigits[char];
                    if (i + 1 < jiaoFenPart.length) {
                        const next = jiaoFenPart[i + 1];
                        if (next === '角') {
                            jiao = num;
                        } else if (next === '分') {
                            fen = num;
                        }
                    }
                }
            }
            // 如果只有"角"没有数字，比如"伍角"，上面逻辑已处理；但如果只有"角"字而无数字（如"角"单独出现），应视为0
            // 但通常不会这样写，所以暂不处理异常

            // 另一种更健壮的方式：逐字符解析
            // 重新解析角分部分
            decimalPart = 0;
            let idx = 0;
            while (idx < jiaoFenPart.length) {
                const char = jiaoFenPart[idx];
                if (this.chineseDigits[char] !== undefined) {
                    const num = this.chineseDigits[char];
                    if (idx + 1 < jiaoFenPart.length) {
                        const unit = jiaoFenPart[idx + 1];
                        if (unit === '角') {
                            decimalPart += num * 0.1;
                            idx += 2;
                            continue;
                        } else if (unit === '分') {
                            decimalPart += num * 0.01;
                            idx += 2;
                            continue;
                        }
                    }
                } else if (char === '角') {
                    // 隐含"壹角"？但规范写法应有数字，不过有时可能省略（如"角"单独出现不合理）
                    // 按规范，此处不处理，视为0
                    decimalPart += 0.1; // 实际上不应该发生，但为兼容某些错误输入？
                    idx++;
                } else if (char === '分') {
                    decimalPart += 0.01;
                    idx++;
                } else {
                    idx++;
                }
            }
        }

        let result = total + decimalPart;

        // 保留两位小数
        return parseFloat(result.toFixed(2));
    }

    // 生成权证编号
    static generateWarrantNumber(counter) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const second = String(now.getSeconds()).padStart(2, '0');
        const millisecond = String(now.getMilliseconds()).padStart(3, '0');
        const counterStr = String(counter).padStart(4, '0');

        return `${year}${month}${day}${hour}${minute}${second}${millisecond}${counterStr}`;
    }

    // 获取当前日期（中文格式）
    static getCurrentDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}年${month}月${day}日`;
    }

    // 通用日期格式转换函数
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

    // 计算两年后的日期
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

    // 计算哈希值（SHA-256，截取前32位十六进制字符）
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

        // 检查crypto.subtle是否可用（仅在安全上下文如HTTPS或localhost中可用）
        if (crypto && crypto.subtle && typeof crypto.subtle.digest === 'function') {
            try {
                const encoder = new TextEncoder();
                const dataBuffer = encoder.encode(text);
                const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                // 返回前32位十六进制字符（128位哈希值）
                return hashHex.substring(0, 32);
            } catch (error) {
                console.warn('Web Crypto API 不可用，尝试使用 crypto-js:', error);
            }
        }
        
        // 如果Web Crypto API不可用，则尝试使用crypto-js库
        if (typeof CryptoJS !== 'undefined' && CryptoJS.SHA256) {
            try {
                const hashObj = CryptoJS.SHA256(text);
                const hashHex = hashObj.toString(CryptoJS.enc.Hex);
                // 返回前32位十六进制字符（128位哈希值）
                return hashHex.substring(0, 32);
            } catch (error) {
                console.error('crypto-js 计算哈希失败:', error);
            }
        }
        
        // 如果两种方法都失败，抛出错误
        throw new Error('无法计算哈希值：Web Crypto API 和 crypto-js 均不可用');
    }

    // 防抖函数
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

    // 节流函数
    static throttle(func, limit) {
        let inThrottle;
        return function () {
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


// 截图管理类
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

    // 执行截图
    async captureScreenshot(container, buyerName, amount) {
        try {
            // 隐藏导入按钮区域
            const importControls = document.querySelector('.import-controls');
            if (importControls) {
                importControls.style.display = 'none';
            }

            // 替换输入框为span以确保截图效果
            this.replaceInputsForSnapshot(container);

            // 等待样式生效
            await new Promise(resolve => setTimeout(resolve, 500));

            // 获取所有图片
            const images = container.querySelectorAll('img');

            // 确保所有图片加载完成
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

            // 等待所有图片加载完成
            if (imagePromises.length > 0) {
                await Promise.all(imagePromises);
            }

            // 额外等待确保所有内容渲染完成
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 获取容器的实际高度，确保包含所有内容，并增加一些缓冲
            let actualHeight = Math.max(
                container.scrollHeight,
                container.offsetHeight,
                container.clientHeight
            );

            // 额外增加一些缓冲空间以确保所有内容都被捕获
            actualHeight = Math.floor(actualHeight * 1.1); // 增加10%的缓冲

            // 执行截图
            const canvas = await html2canvas(container, {
                ...this.options,
                ignoreElements: (element) => element.classList.contains('import-controls'),
                scrollX: 0,
                scrollY: 0,
                width: container.scrollWidth,
                height: actualHeight,
                windowWidth: container.scrollWidth,
                windowHeight: actualHeight
            });

            // 恢复输入框显示
            this.restoreInputsAfterSnapshot(container);

            // 显示导入按钮
            if (importControls) {
                importControls.style.display = 'block';
            }

            // 保存截图
            this.saveScreenshot(canvas, buyerName, amount);

        } catch (error) {
            console.error('截图失败:', error);
            // 确保显示导入按钮
            const importControls = document.querySelector('.import-controls');
            if (importControls) {
                importControls.style.display = 'block';
            }
        }
    }

    // 替换输入框为span（截图前）
    replaceInputsForSnapshot(container) {
        const inputs = container.querySelectorAll('input[type="text"], input:not([type]), textarea');
        inputs.forEach(input => {
            const span = document.createElement('span');
            span.textContent = input.value || '';

            const style = window.getComputedStyle(input);

            // 关键：完整复制视觉属性
            span.style.fontFamily = style.fontFamily;
            span.style.fontSize = style.fontSize;
            span.style.fontWeight = style.fontWeight;
            span.style.color = style.color;
            span.style.textAlign = style.textAlign;

            span.style.width = style.width;
            span.style.height = style.height;
            span.style.padding = style.padding;
            span.style.border = style.border;
            span.style.boxSizing = 'border-box';

            // 关键中的关键：避免 baseline 裁切
            span.style.display = 'inline-flex';
            span.style.alignItems = 'center';
            span.style.justifyContent =
                style.textAlign === 'center' ? 'center' : 'flex-start';
            span.style.lineHeight = style.height;

            span.style.whiteSpace = 'pre-wrap';
            span.style.background = 'transparent';

            span.dataset.snapshotReplace = 'true';

            input.style.display = 'none';
            input.parentNode.insertBefore(span, input);
        });
    }

    // 恢复输入框（截图后）
    restoreInputsAfterSnapshot(container) {
        const spans = container.querySelectorAll('span[data-snapshotReplace]');
        spans.forEach(span => {
            const input = span.nextSibling;
            if (input && input.tagName === 'INPUT') {
                input.style.display = '';
            }
            span.remove();
        });
    }

    // 保存截图
    saveScreenshot(canvas, buyerName, amount) {
        // 方案5：兜底方案（先转 dataURL 再转 Blob，避免直接 toBlob 报错）
        function canvasToBlob(canvas, mimeType = 'image/png', quality = 0.9) {
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
                    resolve(dataURItoBlob(blankCanvas.toDataURL()));
                }
            });
        }

        // 辅助函数：将dataURL转换为Blob
        function dataURItoBlob(dataURI) {
            const byteString = atob(dataURI.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            return new Blob([ab], { type: 'image/png' });
        }

        // 转换为 blob（使用兜底方案）
        canvasToBlob(canvas, 'image/png', 0.9).then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const now = new Date();
            const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

            // 注意：download 属性不支持路径（out/ 会被忽略，浏览器仅保留文件名）
            const fileName = `${buyerName}_${amount}_${dateStr}.png`;
            link.href = url;
            link.download = fileName; // 仅保留文件名，去掉 out/ 路径（浏览器不支持）
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log(`截图已保存：${fileName}`);
        });
    }
}

// 主应用类
class DigitalCertificateApp {
    constructor() {
        this.warrantCounter = 1;
        this.screenshotManager = new ScreenshotManager();
    }

    // 初始化应用
    async initialize() {


        // 初始化事件监听器
        this.initEventListeners();

        // 初始化复选框行为
        this.initCheckboxBehavior();

        // 初始化导入按钮
        this.initImportButton();

        // 添加金额输入框的事件监听
        this.initAmountInputListener();
    }

    // 初始化事件监听器
    initEventListeners() {
        window.addEventListener('load', () => {
            console.log('数字确真凭证应用已加载');
        });
    }

    // 初始化复选框行为
    initCheckboxBehavior() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            // 初始化状态
            this.updateCheckboxItemState(checkbox);

            // 添加change事件监听
            checkbox.addEventListener('change', function () {
                const group = this.closest('.checkbox-group');
                this.updateGroupCheckboxes(group);
            }.bind(this));
        });
    }

    // 更新复选框组的状态
    updateGroupCheckboxes(group) {
        const checkboxItems = group.querySelectorAll('.checkbox-item');
        checkboxItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            this.updateCheckboxItemState(checkbox);
        });
    }

    // 更新单个复选框项的状态
    updateCheckboxItemState(checkbox) {
        const item = checkbox.closest('.checkbox-item');
        if (checkbox.checked) {
            item.classList.remove('disabled');
        } else {
            item.classList.add('disabled');
        }
    }

    // 初始化导入按钮
    initImportButton() {
        const importButton = document.getElementById('importButton');
        const fileInput = document.getElementById('fileInput');

        if (importButton && fileInput) {
            importButton.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (event) => {
                this.handleFileImport(event);
            });
        }
    }

    // 初始化金额输入框监听器
    initAmountInputListener() {
        const amountInput = document.getElementById('amountChinese');
        if (amountInput) {
            const debouncedConvert = Utils.debounce(() => {
                this.convertChineseToNumber();
            }, 300);

            amountInput.addEventListener('input', debouncedConvert);
            amountInput.addEventListener('change', () => {
                this.convertChineseToNumber();
            });
        }
    }

    // 将中文金额转换为数字
    convertChineseToNumber() {
        const chineseText = document.getElementById('amountChinese').value;
        if (!chineseText || chineseText.trim() === '') {
            this.clearAmountTable();
            return;
        }

        let amount = 0;
        let currencySymbol = '￥'; // 默认人民币

        try {
            // 检测币种
            if (chineseText.includes('人民币')) {
                currencySymbol = '￥';
            } else if (chineseText.includes('美元')) {
                currencySymbol = '$';
            } else if (chineseText.includes('欧元')) {
                currencySymbol = '€';
            }
            amount = Utils.convertChineseToNumberCore(chineseText);
        } catch (e) {
            console.error('转换错误:', e);
            this.clearAmountTable();
            return;
        }

        // 填充到表格中
        this.fillAmountBoxes(amount, currencySymbol);
    }

    // 填充金额到表格
    fillAmountBoxes(amount, currencySymbol = '¥') {
        // 转换为字符串，保留两位小数
        const amountStr = String(amount || 0);
        const parts = amountStr.split('.');
        const integerPart = parts[0]; // 整数部分
        const decimalPart = parts[1] || '00'; // 小数部分，默认为'00'

        // 更新币种符号
        const currencyCell = document.getElementById('currency-symbol');
        if (currencyCell) {
            currencyCell.textContent = currencySymbol;
        }

        // 清空所有单元格
        for (let i = 0; i <= 12; i++) {
            const cell = document.getElementById(`amount-${i}`);
            if (cell) {
                cell.textContent = '';
            }
        }

        // 将整数部分按位数拆分（从右到左）
        const digits = integerPart.split('').reverse();

        // 填充到对应位置
        // 表头：币种 百 十 亿 千 百 十 万 千 百 十 元 角 分
        // ID:    -  0  1  2  3  4 5  6  7  8  9 10 11 12

        // 位置映射（从个位开始）：
        // digits[0] -> amount-10 (元/个位)
        // digits[1] -> amount-9  (十位)
        // digits[2] -> amount-8  (百位)
        // digits[3] -> amount-7  (千位)
        // digits[4] -> amount-6  (万位)
        // digits[5] -> amount-5  (十万位)
        // digits[6] -> amount-4  (百万位)
        // digits[7] -> amount-3  (千万位)
        // digits[8] -> amount-2  (亿位)
        // digits[9] -> amount-1  (十亿位)
        // digits[10]-> amount-0  (百亿位)

        const positionMap = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

        for (let i = 0; i < digits.length && i < positionMap.length; i++) {
            const cellId = `amount-${positionMap[i]}`;
            const cell = document.getElementById(cellId);
            if (cell) {
                cell.textContent = digits[i];
            }
        }

        // 填充小数部分
        // amount-11: 角（小数第一位）
        // amount-12: 分（小数第二位）
        const jiaoCell = document.getElementById('amount-11');
        const fenCell = document.getElementById('amount-12');

        if (jiaoCell && decimalPart[0]) {
            jiaoCell.textContent = decimalPart[0];
        }
        if (fenCell && decimalPart[1]) {
            fenCell.textContent = decimalPart[1];
        }
    }

    // 清空金额表格
    clearAmountTable() {
        for (let i = 0; i <= 12; i++) {
            const cell = document.getElementById(`amount-${i}`);
            if (cell) {
                cell.textContent = '';
            }
        }
        const currencyCell = document.getElementById('currency-symbol');
        if (currencyCell) {
            currencyCell.textContent = '¥';
        }
    }

    // 处理文件导入
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 检查是否为xlsx文件
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            alert('请选择Excel文件（.xlsx或.xls格式）');
            return;
        }

        try {
            // 读取Excel文件
            const data = await this.readExcelFile(file);

            if (data.length === 0) {
                alert('Excel文件中没有数据');
                return;
            }

            // 重置计数器
            this.warrantCounter = 1;

            // 处理每一行数据
            alert(`成功读取${data.length}条数据，即将开始处理并生成截图...`);

            for (let i = 0; i < data.length; i++) {
                const result = await this.fillData(data[i]);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 等待页面更新

                // 获取证书容器并截图
                const container = document.querySelector('.certificate-container');
                await this.screenshotManager.captureScreenshot(container, result.buyer, result.amount);

                console.log(`已处理第${i + 1}条数据`);
            }

        } catch (error) {
            console.error('处理文件时出错:', error);
            alert('处理文件时出错: ' + error.message);
        }
    }

    resetCertificate() {
        const container = document.querySelector('.certificate-container');
        container.innerHTML = CERT_TEMPLATE_HTML;
    }
    // 填充数据到页面
    async fillData(rowData) {
        this.resetCertificate();
        // 生成权证编号和签发日期
        const warrantNumber = Utils.generateWarrantNumber(this.warrantCounter);
        const issueDate = Utils.getCurrentDate();
        this.warrantCounter++; // 更新计数器

        // 更新权证编号和签发日期
        const infoBannerLeft = document.querySelector('.info-banner-left');
        infoBannerLeft.innerHTML = `
            <span>权证编号：${warrantNumber}</span>
            <span></span>
            <span>签发日期：${issueDate}</span>
        `;
        console.log("开始填充数据：", rowData);

        // 获取section-part1中的所有input
        const part1Inputs = document.querySelectorAll('.section-part1 input.editable');
        // 第1个：卖方企业名称
        part1Inputs[0].value = rowData['卖方'] || '';
        // 第2个：卖方统一信用代码
        part1Inputs[1].value = rowData['卖方统一信用代码'] || '';
        // 第3个：买方企业名称
        part1Inputs[2].value = rowData['买方'] || '';
        // 第4个：买方统一信用代码
        part1Inputs[3].value = rowData['买方统一信用代码'] || '';

        // 确认金额（数字转中文）
        const rawAmount = rowData['确认金额'];
        const amount = (rawAmount !== undefined && rawAmount !== null && rawAmount !== '') ? parseFloat(rawAmount) : 0;
        const chineseAmount = Utils.numberToChineseAmount(amount);
        // 填充左侧大写金额
        document.getElementById('amountChinese').value = chineseAmount;
        // 触发转换，填充右侧数字表格
        this.convertChineseToNumber();

        // 获取part2-content中的所有input（按顺序）- 排除确认金额大写输入框
        const allPart2Inputs = document.querySelectorAll('.part2-content input.editable');
        // 找到确认金额输入框的位置并排除，得到剩余的输入框
        const amountChineseInput = document.getElementById('amountChinese');
        const filteredPart2Inputs = Array.from(allPart2Inputs).filter(input => input !== amountChineseInput);

        // 处理默认值：如果Excel中没有值，填"--"
        // 第1个：户名
        const accountName = rowData['户名'];
        filteredPart2Inputs[0].value = (accountName && accountName !== '' && accountName !== 'NaN' && accountName !== null && accountName !== undefined) ? String(accountName) : '--';

        // 第2个：开户行行号
        const bankNumber = rowData['开户行行号'];
        filteredPart2Inputs[1].value = (bankNumber && bankNumber !== '' && bankNumber !== 'NaN' && bankNumber !== null && bankNumber !== undefined) ? String(bankNumber) : '--';

        // 第3个：收款账号
        const accountNumber = rowData['收款账号'];
        filteredPart2Inputs[2].value = (accountNumber && accountNumber !== '' && accountNumber !== 'NaN' && accountNumber !== null && accountNumber !== undefined) ? String(accountNumber) : '--';

        // 第4个：开户行名称
        const bankName = rowData['开户行名称'];
        filteredPart2Inputs[3].value = (bankName && bankName !== '' && bankName !== 'NaN' && bankName !== null && bankName !== undefined) ? String(bankName) : '--';

        // 第5个：预计付款日（没有默认填系统当前日期）
        let paymentDate = Utils.formatDate(rowData['预计付款日']);
        filteredPart2Inputs[4].value = paymentDate;

        // 第6个：HASH（在filteredPart2Inputs中是第5个，但需要先计算再填充）
        // 第7个：确认有效期（在filteredPart2Inputs中是第6个）
        let validDate;
        if (rowData['确认有效期'] && rowData['确认有效期'] !== '' && rowData['确认有效期'] !== 'NaT' && rowData['确认有效期'] !== null && rowData['确认有效期'] !== undefined) {
            validDate = Utils.formatDate(rowData['确认有效期']);
        } else {
            // 如果Excel中没有提供确认有效期，则计算预计付款日的后两年
            validDate = Utils.getTwoYearsLater(paymentDate);
        }
        filteredPart2Inputs[6].value = validDate;

        // 计算并填充HASH（第6个，即filteredPart2Inputs[5]）
        // HASH基于表格中所有数据计算
        const hashData = {
            buyer: rowData['买方'] || '',
            buyerCode: rowData['买方统一信用代码'] || '',
            seller: rowData['卖方'] || '',
            sellerCode: rowData['卖方统一信用代码'] || '',
            amount: (() => {
                const rawAmount = rowData['确认金额'];
                return (rawAmount !== undefined && rawAmount !== null && rawAmount !== '') ? String(rawAmount) : '0';
            })(),
            accountName: filteredPart2Inputs[0].value,
            bankNumber: filteredPart2Inputs[1].value,
            accountNumber: filteredPart2Inputs[2].value,
            bankName: filteredPart2Inputs[3].value,
            paymentDate: paymentDate,
            validDate: validDate
        };
        const hash = await Utils.calculateHash(hashData);
        console.log("计算得到的HASH:", hash);
        filteredPart2Inputs[5].value = hash;
        // 设置HASH输入框为只读且不可修改
        filteredPart2Inputs[5].readOnly = true;
        filteredPart2Inputs[5].disabled = true;
        filteredPart2Inputs[5].style.backgroundColor = '#f5f5f5';
        filteredPart2Inputs[5].style.cursor = 'not-allowed';
        filteredPart2Inputs[5].style.color = '#666';

        return {
            warrantNumber,
            issueDate,
            buyer: rowData['买方'],
            amount: rowData['确认金额']
        };
    }

    // 读取Excel文件
    async readExcelFile(file) {
        // 这里需要使用SheetJS (xlsx)库来读取Excel
        // 由于是纯前端，需要引入CDN
        if (typeof XLSX === 'undefined') {
            throw new Error('未加载XLSX库，请在HTML中引入SheetJS库');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = function (e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = function (error) {
                reject(error);
            };

            reader.readAsArrayBuffer(file);
        });
    }

    // 执行截图
    async captureScreenshot(buyerName, amount) {
        const container = document.querySelector('.certificate-container');
        await this.screenshotManager.captureScreenshot(container, buyerName, amount);
    }
}

const CERT_TEMPLATE_HTML =
    document.querySelector('.certificate-container').innerHTML;

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    const app = new DigitalCertificateApp();
    await app.initialize();

    // 为截图按钮添加事件监听器
    document.getElementById('screenshotBtn').addEventListener('click', function () {
        app.captureScreenshot('数字确真凭证', '');
    });
});