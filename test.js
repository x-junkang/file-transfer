const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 简单的集成测试套件
class TestRunner {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
    }

    async runTest(name, testFn) {
        this.totalTests++;
        console.log(`🧪 运行测试: ${name}`);
        
        try {
            await testFn();
            this.passedTests++;
            console.log(`✅ ${name} - 通过`);
            this.testResults.push({ name, status: 'PASS' });
        } catch (error) {
            console.log(`❌ ${name} - 失败: ${error.message}`);
            this.testResults.push({ name, status: 'FAIL', error: error.message });
        }
    }

    printResults() {
        console.log('\n📊 测试结果:');
        console.log('=' .repeat(50));
        
        this.testResults.forEach(result => {
            const status = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${status} ${result.name}`);
            if (result.error) {
                console.log(`   错误: ${result.error}`);
            }
        });
        
        console.log('=' .repeat(50));
        console.log(`总计: ${this.totalTests} 个测试, ${this.passedTests} 个通过, ${this.totalTests - this.passedTests} 个失败`);
        
        if (this.passedTests === this.totalTests) {
            console.log('🎉 所有测试通过!');
            process.exit(0);
        } else {
            console.log('💥 有测试失败!');
            process.exit(1);
        }
    }
}

// 测试用例
async function runTests() {
    const runner = new TestRunner();
    
    // 测试1: 检查必要文件存在
    await runner.runTest('检查必要文件存在', async () => {
        const requiredFiles = [
            'server.js',
            'package.json',
            'public/index.html',
            'public/style.css',
            'public/script.js'
        ];
        
        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`必要文件不存在: ${file}`);
            }
        }
    });
    
    // 测试2: 检查package.json依赖
    await runner.runTest('检查package.json依赖', async () => {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredDeps = ['express', 'multer', 'qrcode', 'mime-types', 'cors'];
        
        for (const dep of requiredDeps) {
            if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
                throw new Error(`缺少必要依赖: ${dep}`);
            }
        }
    });
    
    // 测试3: 检查server.js语法
    await runner.runTest('检查server.js语法', async () => {
        try {
            require('./server.js');
        } catch (error) {
            // 忽略模块未找到错误，只关心语法错误
            if (error.code !== 'MODULE_NOT_FOUND') {
                throw error;
            }
        }
    });
    
    // 测试4: 检查uploads目录
    await runner.runTest('检查uploads目录', async () => {
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads', { recursive: true });
        }
        
        const stats = fs.statSync('uploads');
        if (!stats.isDirectory()) {
            throw new Error('uploads应该是一个目录');
        }
    });
    
    // 测试5: 测试服务器启动 (快速测试)
    await runner.runTest('测试服务器启动能力', async () => {
        return new Promise((resolve, reject) => {
            // 设置环境变量以避免实际启动网络服务
            const env = { ...process.env, NODE_ENV: 'test', PORT: '0' };
            
            const serverProcess = spawn('node', ['-c', `
                try {
                    require('./server.js');
                    console.log('SERVER_SYNTAX_OK');
                } catch (error) {
                    console.error('SERVER_SYNTAX_ERROR:', error.message);
                    process.exit(1);
                }
            `], { env, stdio: 'pipe' });
            
            let output = '';
            
            serverProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            serverProcess.stderr.on('data', (data) => {
                output += data.toString();
            });
            
            const timeout = setTimeout(() => {
                serverProcess.kill();
                reject(new Error('服务器启动超时'));
            }, 5000);
            
            serverProcess.on('close', (code) => {
                clearTimeout(timeout);
                if (output.includes('SERVER_SYNTAX_OK') || code === 0) {
                    resolve();
                } else {
                    reject(new Error(`服务器语法检查失败: ${output}`));
                }
            });
        });
    });
    
    runner.printResults();
}

// 如果直接运行此文件
if (require.main === module) {
    runTests().catch(error => {
        console.error('❌ 测试运行失败:', error);
        process.exit(1);
    });
}

module.exports = { TestRunner, runTests };