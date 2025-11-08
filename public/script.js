// DOM 元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const filesContainer = document.getElementById('filesContainer');
const emptyState = document.getElementById('emptyState');
const refreshBtn = document.getElementById('refreshBtn');
const qrModal = document.getElementById('qrModal');
const qrCodeImg = document.getElementById('qrCodeImg');
const modalFileName = document.getElementById('modalFileName');
const modalFileSize = document.getElementById('modalFileSize');
const downloadUrl = document.getElementById('downloadUrl');
const copyUrlBtn = document.getElementById('copyUrlBtn');
const closeModal = document.getElementById('closeModal');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// 事件监听器
selectFileBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // 阻止事件冒泡
    console.log('选择文件按钮被点击');
    fileInput.click();
});

fileInput.addEventListener('change', handleFileSelect);
refreshBtn.addEventListener('click', loadFiles);
copyUrlBtn.addEventListener('click', copyDownloadUrl);
closeModal.addEventListener('click', hideQRModal);
qrModal.addEventListener('click', (e) => {
    if (e.target === qrModal) hideQRModal();
});

// 检测iOS设备
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// 拖拽上传（iOS设备禁用）
if (!isIOS()) {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = [];
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
            files.push(e.dataTransfer.files[i]);
        }
        uploadFiles(files);
    });
}

uploadArea.addEventListener('click', (e) => {
    // 如果点击的是按钮，不处理
    if (e.target.closest('#selectFileBtn')) {
        return;
    }
    
    console.log('点击上传区域，触发文件选择');
    fileInput.click();
});

// 文件选择处理
function handleFileSelect(e) {
    console.log('=== 文件选择事件触发 ===');
    console.log('Event target:', e.target);
    console.log('Files object:', e.target.files);
    console.log('Files length:', e.target.files ? e.target.files.length : 'undefined');
    
    // 检查是否有文件被选择
    if (!e.target.files || e.target.files.length === 0) {
        console.log('没有选择文件或用户取消了选择');
        return;
    }
    
    // 转换为数组（兼容性处理）
    const files = [];
    for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        console.log(`文件 ${i + 1}:`, {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
        });
        files.push(file);
    }
    
    console.log('准备上传的文件数组:', files);
    
    if (files.length > 0) {
        // 添加小延迟，确保浏览器处理完成
        setTimeout(() => {
            console.log('开始调用uploadFiles函数');
            uploadFiles(files);
        }, 100);
    }
}

// 文件上传
async function uploadFiles(files) {
    if (files.length === 0) return;

    console.log('开始上传文件:', files);

    // 显示进度条
    uploadProgress.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '准备上传...';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        console.log(`处理文件 ${i + 1}/${files.length}:`, file.name, file.size);
        
        // 检查文件大小 (100MB)
        if (file.size > 100 * 1024 * 1024) {
            showToast(`文件 ${file.name} 超过100MB限制`, 'error');
            continue;
        }

        try {
            progressText.textContent = `正在上传: ${file.name} (${i + 1}/${files.length})`;
            
            const formData = new FormData();
            formData.append('file', file);

            console.log('发送上传请求...');

            // 使用XMLHttpRequest代替fetch，提高iOS兼容性
            const uploadPromise = new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        try {
                            const result = JSON.parse(xhr.responseText);
                            resolve(result);
                        } catch (e) {
                            reject(new Error('响应格式错误'));
                        }
                    } else {
                        reject(new Error(`上传失败: ${xhr.status} ${xhr.statusText}`));
                    }
                };
                
                xhr.onerror = function() {
                    reject(new Error('网络错误'));
                };
                
                xhr.upload.onprogress = function(e) {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        console.log(`上传进度: ${percentComplete.toFixed(1)}%`);
                    }
                };
                
                xhr.open('POST', '/upload');
                xhr.send(formData);
            });

            const result = await uploadPromise;
            
            if (result.success) {
                showToast(`${file.name} 上传成功！`);
                console.log('文件上传成功:', result);
                
                // 更新进度
                const progress = ((i + 1) / files.length) * 100;
                progressFill.style.width = `${progress}%`;
                
                // 如果是最后一个文件，刷新文件列表
                if (i === files.length - 1) {
                    setTimeout(() => {
                        loadFiles();
                        uploadProgress.style.display = 'none';
                        fileInput.value = '';
                    }, 1000);
                }
            } else {
                throw new Error(result.error || '上传失败');
            }
            
        } catch (error) {
            console.error('上传错误:', error);
            showToast(`${file.name} 上传失败: ${error.message}`, 'error');
        }
    }
}

// 加载文件列表
async function loadFiles() {
    try {
        const response = await fetch('/api/files');
        const result = await response.json();
        
        if (result.success) {
            displayFiles(result.files);
        } else {
            showToast('获取文件列表失败', 'error');
        }
    } catch (error) {
        console.error('获取文件列表错误:', error);
        showToast('获取文件列表失败', 'error');
    }
}

// 显示文件列表
function displayFiles(files) {
    if (files.length === 0) {
        emptyState.style.display = 'block';
        filesContainer.innerHTML = '';
        filesContainer.appendChild(emptyState);
        return;
    }

    emptyState.style.display = 'none';
    filesContainer.innerHTML = '';

    files.forEach(file => {
        const fileItem = createFileItem(file);
        filesContainer.appendChild(fileItem);
    });
}

// 创建文件项
function createFileItem(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';

    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';

    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.textContent = file.originalName;

    const fileDetails = document.createElement('div');
    fileDetails.className = 'file-details';
    fileDetails.innerHTML = `
        大小: ${formatFileSize(file.size)} | 
        上传时间: ${formatDate(file.uploadTime)}
    `;

    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileDetails);

    const fileActions = document.createElement('div');
    fileActions.className = 'file-actions';

    // 二维码按钮
    const qrBtn = document.createElement('button');
    qrBtn.className = 'btn qr-btn';
    qrBtn.innerHTML = '📱 二维码';
    qrBtn.onclick = () => showQRModal(file);

    // 下载按钮
    const downloadBtn = document.createElement('a');
    downloadBtn.href = file.downloadUrl;
    downloadBtn.className = 'btn btn-secondary';
    downloadBtn.innerHTML = '⬇️ 下载';
    downloadBtn.style.textDecoration = 'none';
    downloadBtn.style.color = 'inherit';

    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.innerHTML = '🗑️ 删除';
    deleteBtn.onclick = () => deleteFile(file.id);

    fileActions.appendChild(qrBtn);
    fileActions.appendChild(downloadBtn);
    fileActions.appendChild(deleteBtn);

    fileItem.appendChild(fileInfo);
    fileItem.appendChild(fileActions);

    return fileItem;
}

// 显示二维码模态框
function showQRModal(file) {
    modalFileName.textContent = file.originalName;
    modalFileSize.textContent = formatFileSize(file.size);
    downloadUrl.value = file.downloadUrl;
    qrCodeImg.src = file.qrCode;
    qrModal.classList.add('show');
}

// 隐藏二维码模态框
function hideQRModal() {
    qrModal.classList.remove('show');
}

// 复制下载链接
async function copyDownloadUrl() {
    try {
        await navigator.clipboard.writeText(downloadUrl.value);
        showToast('下载链接已复制到剪贴板');
    } catch (error) {
        // 降级方案
        downloadUrl.select();
        document.execCommand('copy');
        showToast('下载链接已复制到剪贴板');
    }
}

// 删除文件
async function deleteFile(fileId) {
    if (!confirm('确定要删除这个文件吗？')) {
        return;
    }

    try {
        const response = await fetch(`/api/files/${fileId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (result.success) {
            showToast('文件删除成功');
            loadFiles();
        } else {
            showToast('文件删除失败', 'error');
        }
    } catch (error) {
        console.error('删除文件错误:', error);
        showToast('文件删除失败', 'error');
    }
}

// 显示消息提示
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // 如果是今天
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    // 如果是今年
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('zh-CN', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    // 其他情况
    return date.toLocaleDateString('zh-CN', { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric' 
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成');
    console.log('用户代理:', navigator.userAgent);
    console.log('是否为iOS设备:', isIOS());
    
    // 测试DOM元素
    console.log('fileInput元素:', fileInput);
    console.log('selectFileBtn元素:', selectFileBtn);
    console.log('uploadArea元素:', uploadArea);
    
    // 测试文件输入功能
    if (fileInput) {
        console.log('文件输入元素存在，属性:');
        console.log('- type:', fileInput.type);
        console.log('- multiple:', fileInput.multiple);
        console.log('- accept:', fileInput.accept);
        console.log('- style.display:', fileInput.style.display);
        
        // 添加额外的事件监听器来调试
        fileInput.addEventListener('click', () => {
            console.log('文件输入被点击');
        });
        
        fileInput.addEventListener('focus', () => {
            console.log('文件输入获得焦点');
        });
        
        fileInput.addEventListener('blur', () => {
            console.log('文件输入失去焦点');
        });
    }
    
    loadFiles();
    
    // 每30秒自动刷新文件列表
    setInterval(loadFiles, 30000);
    
    // iOS设备特殊处理
    if (isIOS()) {
        console.log('检测到iOS设备，禁用拖拽功能');
        // 更新提示文本
        const uploadAreaText = document.querySelector('.upload-area h3');
        if (uploadAreaText) {
            uploadAreaText.textContent = '点击选择文件';
        }
        
        // 添加触摸友好的样式
        uploadArea.style.cursor = 'pointer';
        uploadArea.style.userSelect = 'none';
        uploadArea.style.webkitUserSelect = 'none';
        uploadArea.style.webkitTouchCallout = 'none';
    }
});

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    // ESC 关闭模态框
    if (e.key === 'Escape' && qrModal.classList.contains('show')) {
        hideQRModal();
    }
    
    // Ctrl/Cmd + U 打开文件选择
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        fileInput.click();
    }
    
    // F5 刷新文件列表
    if (e.key === 'F5') {
        e.preventDefault();
        loadFiles();
    }
});