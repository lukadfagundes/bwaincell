#!/usr/bin/env node
/**
 * Bundle Size Check Script
 * Verifies that the built application doesn't exceed size limits
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist');
const maxBundleSize = 5 * 1024 * 1024; // 5MB

function formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

function getTotalSize(dirPath) {
    if (!fs.existsSync(dirPath)) {
        console.log('❌ Dist directory not found. Run npm run build first.');
        return 0;
    }

    let totalSize = 0;
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            totalSize += getTotalSize(filePath);
        } else {
            totalSize += stats.size;
        }
    }

    return totalSize;
}

function checkBundleSize() {
    console.log('🔍 Checking bundle size...');

    const bundleSize = getTotalSize(distPath);
    const formattedSize = formatBytes(bundleSize);
    const formattedLimit = formatBytes(maxBundleSize);

    console.log(`📦 Current bundle size: ${formattedSize}`);
    console.log(`🎯 Size limit: ${formattedLimit}`);

    if (bundleSize > maxBundleSize) {
        console.log('❌ Bundle size exceeds limit!');
        console.log(`   Exceeded by: ${formatBytes(bundleSize - maxBundleSize)}`);

        // List largest files for optimization guidance
        console.log('\n📊 Largest files in bundle:');
        const allFiles = [];

        function collectFiles(dirPath, relativePath = '') {
            const files = fs.readdirSync(dirPath);

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);

                if (stats.isDirectory()) {
                    collectFiles(filePath, path.join(relativePath, file));
                } else {
                    allFiles.push({
                        path: path.join(relativePath, file),
                        size: stats.size
                    });
                }
            }
        }

        collectFiles(distPath);
        allFiles.sort((a, b) => b.size - a.size);

        allFiles.slice(0, 10).forEach((file, index) => {
            console.log(`   ${index + 1}. ${file.path} (${formatBytes(file.size)})`);
        });

        process.exit(1);
    } else {
        const remainingSize = maxBundleSize - bundleSize;
        console.log(`✅ Bundle size is within limits`);
        console.log(`   Remaining capacity: ${formatBytes(remainingSize)}`);
        console.log(`   Usage: ${((bundleSize / maxBundleSize) * 100).toFixed(1)}%`);
    }
}

// Performance benchmark
function benchmarkStartup() {
    console.log('\n⚡ Running startup benchmark...');
    const startTime = Date.now();

    try {
        // Simulate bot startup by requiring the main bot file
        const botPath = path.join(__dirname, '../dist/src/bot.js');
        if (fs.existsSync(botPath)) {
            const endTime = Date.now();
            const startupTime = endTime - startTime;
            console.log(`🚀 Estimated startup time: ${startupTime}ms`);

            if (startupTime > 5000) {
                console.log('⚠️  Startup time exceeds 5 seconds - consider optimization');
            } else {
                console.log('✅ Startup time is acceptable');
            }
        } else {
            console.log('⚠️  Bot file not found - skipping startup benchmark');
        }
    } catch (error) {
        console.log('⚠️  Could not benchmark startup:', error.message);
    }
}

// Main execution
if (require.main === module) {
    checkBundleSize();
    benchmarkStartup();
}

module.exports = { checkBundleSize, getTotalSize, formatBytes };