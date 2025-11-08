# CI/CD 配置说明

## 🚀 GitHub Actions Workflow

本项目使用优化的GitHub Actions workflow进行持续集成和部署。

### 📋 Workflow 特性

#### 🔍 **代码质量检查** (`lint-and-format`)
- ✅ Package.json 格式验证
- ✅ ESLint 代码规范检查 (如果配置)
- ✅ Prettier 代码格式检查 (如果配置)

#### 🧪 **测试和构建** (`test-and-build`) 
- ✅ 多Node.js版本测试 (18.x, 20.x)
- ✅ 依赖安装和验证
- ✅ 基础功能验证
- ✅ 服务器启动测试
- ✅ 覆盖率报告 (如果存在)

#### 🔒 **安全扫描** (`security-scan`)
- ✅ NPM 安全审计
- ✅ 依赖漏洞检查
- ✅ 过期包检查

#### 🐳 **Docker测试** (`docker-test`)
- ✅ Docker 镜像构建测试
- ✅ 容器启动验证
- ✅ 基础健康检查

#### 🚀 **部署就绪检查** (`deploy-ready`)
- ✅ 所有检查通过确认
- ✅ 部署清单输出

### 🎯 触发条件

- **Push**: `main` 和 `develop` 分支
- **Pull Request**: 针对 `main` 分支
- **手动触发**: 支持 `workflow_dispatch`

### 📊 状态徽章

您可以在 README.md 中添加以下徽章：

\`\`\`markdown
![CI/CD](https://github.com/x-junkang/file-transfer/workflows/🚀%20File%20Transfer%20CI/CD/badge.svg)
![Node.js](https://img.shields.io/badge/node.js-18.x%20|%2020.x-green)
![License](https://img.shields.io/badge/license-MIT-blue)
\`\`\`

### 🛠️ 本地测试

在推送代码前，您可以本地运行相同的检查：

\`\`\`bash
# 运行测试
npm test

# 检查依赖安全性
npm audit

# 检查过期包
npm outdated

# 测试Docker构建 (可选)
docker build -t file-transfer-local .
docker run -p 3000:3000 file-transfer-local
\`\`\`

### 🔧 自定义配置

#### 添加代码检查工具

如需添加ESLint或Prettier，创建相应配置文件：

\`\`\`bash
# ESLint
npm install --save-dev eslint
echo '{"extends": ["eslint:recommended"]}' > .eslintrc.json

# Prettier  
npm install --save-dev prettier
echo '{"semi": true, "singleQuote": true}' > .prettierrc
\`\`\`

#### 自定义测试

修改 \`test.js\` 文件添加更多测试用例，或创建标准测试框架配置：

\`\`\`bash
# 使用Jest
npm install --save-dev jest
# 然后更新package.json中的test脚本
\`\`\`

### 🎉 优势

1. **全面覆盖**: 代码质量、安全性、功能测试
2. **多环境验证**: 不同Node.js版本兼容性
3. **快速反馈**: 分阶段执行，快速发现问题
4. **部署就绪**: 清晰的部署状态指示
5. **Docker友好**: 容器化部署测试

这个workflow确保每次代码变更都经过完整的质量检查！