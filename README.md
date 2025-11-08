# 局域网文件传输网站

![CI/CD](https://github.com/x-junkang/file-transfer/workflows/🚀%20File%20Transfer%20CI/badge.svg)
![Node.js](https://img.shields.io/badge/node.js-18.x%20|%2020.x-green)
![License](https://img.shields.io/badge/license-MIT-blue)

这是一个支持局域网文件传输的Web应用，用户可以上传文件并生成二维码，让其他设备通过扫码下载文件。

## ✨ 功能特性

- 📁 **文件上传功能** - 支持拖拽和点击上传
- 📱 **生成下载二维码** - 手机扫码即可下载
- 🌐 **局域网访问支持** - 自动检测本机IP
- 💾 **文件持久化存储** - 服务器重启后自动恢复
- 📋 **文件列表管理** - 查看、删除上传的文件
- 🗑️ **自动清理** - 24小时后自动删除过期文件
- 📱 **移动端优化** - 完美支持iOS和Android
- 🔧 **简单部署** - 无需复杂配置，一键启动

## 安装和使用

1. 安装依赖：
```bash
npm install
```

2. 启动服务：
```bash
npm start
```

3. 开发模式（支持热重载）：
```bash
npm run dev
```

4. 在浏览器中访问 `http://localhost:3000`

## 局域网访问

启动服务后，控制台会显示局域网IP地址，局域网内的其他设备可以通过该IP地址访问。

## 文件说明

- `server.js` - Express服务器主文件
- `public/` - 前端静态文件目录
- `uploads/` - 文件上传存储目录
- `package.json` - 项目依赖配置

## 注意事项

- 上传的文件会临时存储在 `uploads` 目录
- 建议定期清理临时文件
- 确保防火墙允许局域网访问