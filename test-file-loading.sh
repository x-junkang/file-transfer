#!/bin/bash

# 测试启动时加载现有文件功能的脚本

echo "🧪 测试启动时加载现有文件功能"
echo "================================"

# 创建测试文件
echo "📝 创建测试文件..."
TIMESTAMP=$(date +%s000)
TEST_FILE="uploads/${TIMESTAMP}_test-file.txt"
mkdir -p uploads
echo "这是一个测试文件，用于验证启动时文件加载功能。" > "$TEST_FILE"
echo "✅ 创建测试文件: $TEST_FILE"

# 创建另一个测试文件
TIMESTAMP2=$((TIMESTAMP + 1000))
TEST_FILE2="uploads/${TIMESTAMP2}_测试文件-中文.txt"
echo "这是一个包含中文名称的测试文件。" > "$TEST_FILE2"
echo "✅ 创建测试文件: $TEST_FILE2"

echo ""
echo "📋 当前uploads目录内容:"
ls -la uploads/ || echo "uploads目录为空"

echo ""
echo "🚀 现在启动服务器应该会自动加载这些文件..."
echo "请运行: node server.js"
echo ""
echo "🧹 清理测试文件请运行: rm -f uploads/*test* || true"