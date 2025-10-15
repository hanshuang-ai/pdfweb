#!/usr/bin/env node

/**
 * 自动提交和推送脚本
 * 用于在代码修改后自动提交到Git并推送到GitHub
 */

import { execSync } from 'child_process';

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

function log(message, color = 'white') {
  console.log(colors[color](`[${new Date().toLocaleTimeString()}] ${message}`));
}

// 执行Git命令的函数
function runGitCommand(command, description) {
  try {
    log(`执行: ${command}`, 'blue');
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ ${description} - 成功`, 'green');
    return result.trim();
  } catch (error) {
    log(`❌ ${description} - 失败: ${error.message}`, 'red');
    throw error;
  }
}

// 检查是否有未提交的更改
function hasChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim().length > 0;
  } catch (error) {
    log('检查Git状态失败', 'red');
    return false;
  }
}

// 获取更改的文件列表
function getChangedFiles() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim().split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [status, ...filePath] = line.trim().split(/\s+/);
        return { status: status.substring(0, 2), file: filePath.join(' ') };
      });
  } catch (error) {
    log('获取更改文件列表失败', 'red');
    return [];
  }
}

// 生成提交信息
function generateCommitMessage() {
  const changedFiles = getChangedFiles();

  // 分析文件变更类型
  const added = changedFiles.filter(f => f.status.startsWith('A') || f.status.startsWith('?'));
  const modified = changedFiles.filter(f => f.status.includes('M'));
  const deleted = changedFiles.filter(f => f.status.includes('D'));
  const renamed = changedFiles.filter(f => f.status.includes('R'));

  let commitType = 'chore';
  let description = '更新项目文件';

  // 根据文件变更确定提交类型
  if (added.length > 0 && modified.length === 0 && deleted.length === 0) {
    commitType = 'feat';
    description = `添加新文件: ${added.map(f => f.file).join(', ')}`;
  } else if (deleted.length > 0 && modified.length === 0) {
    commitType = 'remove';
    description = `删除文件: ${deleted.map(f => f.file).join(', ')}`;
  } else if (renamed.length > 0) {
    commitType = 'refactor';
    description = `重命名文件: ${renamed.map(f => f.file).join(', ')}`;
  } else if (modified.length > 0) {
    // 检查修改的文件类型来确定更具体的提交类型
    const hasVueFiles = modified.some(f => f.file.endsWith('.vue'));
    const hasJsFiles = modified.some(f => f.file.endsWith('.js') || f.file.endsWith('.ts'));
    const hasStyleFiles = modified.some(f => f.file.endsWith('.css') || f.file.endsWith('.scss'));

    if (hasVueFiles && !hasJsFiles && !hasStyleFiles) {
      commitType = 'fix';
      description = '更新Vue组件';
    } else if (hasJsFiles && !hasVueFiles && !hasStyleFiles) {
      commitType = 'refactor';
      description = '重构JavaScript代码';
    } else if (hasStyleFiles && !hasVueFiles && !hasJsFiles) {
      commitType = 'style';
      description = '更新样式文件';
    } else {
      commitType = 'feat';
      description = '功能增强和代码优化';
    }
  }

  // 生成详细的提交信息
  const timestamp = new Date().toISOString().split('T')[0];
  const commitMessage = `${commitType}: ${description}

## 变更详情
${added.length > 0 ? `### 新增文件 (${added.length})
${added.map(f => `- ${f.file}`).join('\n')}

` : ''}${modified.length > 0 ? `### 修改文件 (${modified.length})
${modified.map(f => `- ${f.file}`).join('\n')}

` : ''}${deleted.length > 0 ? `### 删除文件 (${deleted.length})
${deleted.map(f => `- ${f.file}`).join('\n')}

` : ''}---
🤖 Generated with [Claude Code](https://claude.com/claude-code) on ${timestamp}

Co-Authored-By: Claude <noreply@anthropic.com>`;

  return commitMessage;
}

// 主要的自动提交函数
async function autoCommitAndPush() {
  try {
    log('🚀 开始自动提交和推送流程...', 'cyan');

    // 检查是否有更改
    if (!hasChanges()) {
      log('📝 没有检测到文件更改，跳过提交', 'yellow');
      return;
    }

    // 显示更改摘要
    const changedFiles = getChangedFiles();
    log(`📊 检测到 ${changedFiles.length} 个文件更改:`, 'blue');
    changedFiles.forEach(({ status, file }) => {
      const statusIcon = {
        'A': '🆕', 'M': '📝', 'D': '🗑️', 'R': '🔄', '??': '❓'
      }[status[0]] || '📄';
      log(`  ${statusIcon} ${status} ${file}`, 'blue');
    });

    // 添加所有更改
    runGitCommand('git add .', '添加所有更改到暂存区');

    // 生成提交信息
    const commitMessage = generateCommitMessage();
    log('📝 生成的提交信息:', 'yellow');
    console.log('─'.repeat(50));
    console.log(commitMessage.split('\n')[0]); // 只显示第一行
    console.log('─'.repeat(50));

    // 提交更改
    runGitCommand(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, '提交更改');

    // 推送到远程仓库
    runGitCommand('git push origin master', '推送到GitHub');

    log('🎉 自动提交和推送完成！', 'green');
    log('🌐 所有更改已成功推送到 GitHub', 'green');

  } catch (error) {
    log('💥 自动提交过程中发生错误:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// 如果直接运行此脚本
autoCommitAndPush();

export { autoCommitAndPush, generateCommitMessage, hasChanges, getChangedFiles };