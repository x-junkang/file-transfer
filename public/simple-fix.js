// 简化的文件选择处理
document.addEventListener('DOMContentLoaded', function() {
    const selectBtn = document.getElementById('selectFileBtn');
    const fileInput = document.getElementById('fileInput');
    
    // 移除所有现有的事件监听器
    selectBtn.replaceWith(selectBtn.cloneNode(true));
    const newSelectBtn = document.getElementById('selectFileBtn');
    
    // 添加简单的点击事件
    newSelectBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('按钮被点击，触发文件选择');
        fileInput.click();
    });
    
    // 简化的文件change处理
    fileInput.addEventListener('change', function(e) {
        console.log('文件选择change事件', e.target.files);
        if (e.target.files && e.target.files.length > 0) {
            // 直接调用上传函数
            const files = Array.from(e.target.files);
            uploadFiles(files);
        }
    });
});