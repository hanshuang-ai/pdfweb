# 自动提交和推送功能

这个项目现在配置了自动提交和推送到GitHub的功能，方便在代码修改后快速同步到远程仓库。

## 功能特性

- ✅ 自动检测文件变更
- ✅ 智能生成提交信息
- ✅ 支持中文提交信息
- ✅ 详细的变更统计
- ✅ 自动推送到GitHub
- ✅ 彩色日志输出
- ✅ 错误处理和回滚

## 使用方法

### 方法1：使用npm脚本（推荐）

```bash
# 完整命令
npm run commit

# 简写命令
npm run ac
```

### 方法2：直接运行脚本

```bash
node auto-commit.js
```

## 提交信息格式

脚本会根据文件变更自动生成合适的提交信息：

### 提交类型
- `feat`: 新功能或功能增强
- `fix`: 修复bug
- `refactor`: 代码重构
- `style`: 样式更新
- `remove`: 删除文件
- `chore`: 其他更新

### 提交信息示例

```
feat: 功能增强和代码优化

## 变更详情
### 修改文件 (3)
- src/components/FileList.vue
- src/components/BrowserPDF.vue
- package.json

---
🤖 Generated with [Claude Code](https://claude.com/claude-code) on 2025-01-15

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 工作流程

1. **检测变更**: 检查Git工作目录是否有未提交的更改
2. **显示摘要**: 展示所有变更文件的详细列表
3. **暂存更改**: 自动添加所有变更到Git暂存区
4. **生成信息**: 根据文件变更智能生成提交信息
5. **提交更改**: 使用生成的提交信息进行Git提交
6. **推送到远程**: 自动推送到GitHub远程仓库

## 文件状态图标

- 🆕 新增文件 (Added)
- 📝 修改文件 (Modified)
- 🗑️ 删除文件 (Deleted)
- 🔄 重命名文件 (Renamed)
- ❓ 未跟踪文件 (Untracked)

## 注意事项

### 自动提交条件
- 有未提交的文件更改
- Git配置正确（用户名和邮箱已设置）
- 有网络连接（用于推送到GitHub）

### 安全性
- 脚本会先检查是否有更改，没有更改时会跳过提交
- 包含完整的错误处理，失败时会显示详细错误信息
- 支持回滚，如果推送失败不会影响本地提交

### 兼容性
- 支持Windows、macOS和Linux
- 需要Node.js环境
- 需要Git配置正确

## 配置自定义

如果需要自定义提交行为，可以修改 `auto-commit.js` 文件：

- 修改提交类型判断逻辑
- 自定义提交信息格式
- 添加更多的Git命令
- 修改颜色输出方案

## 故障排除

### 常见问题

1. **权限错误**
   ```bash
   # 确保Git权限正确
   git config user.name "你的用户名"
   git config user.email "你的邮箱"
   ```

2. **网络连接问题**
   ```bash
   # 检查远程仓库连接
   git remote -v
   git fetch origin
   ```

3. **脚本执行错误**
   ```bash
   # 确保Node.js版本正确
   node --version
   npm --version
   ```

### 手动回滚

如果自动提交有问题，可以手动回滚：

```bash
# 查看提交历史
git log --oneline

# 回滚到上一个提交
git reset --soft HEAD~1

# 强制推送（谨慎使用）
git push --force-with-lease origin master
```

## 集成到开发流程

建议在以下情况下使用自动提交：

1. **完成功能开发后**: 添加新功能或修复bug
2. **代码重构后**: 优化代码结构或性能
3. **样式更新后**: 修改UI或交互
4. **删除不需要的文件后**: 清理项目结构
5. **定期保存进度**: 防止代码丢失

## 示例使用场景

### 场景1：添加新组件
```bash
# 修改代码后
npm run ac
# 输出：feat: 添加新组件
```

### 场景2：修复bug
```bash
# 修复代码后
npm run ac
# 输出：fix: 修复组件功能问题
```

### 场景3：清理项目
```bash
# 删除文件后
npm run ac
# 输出：remove: 删除未使用的组件文件
```

这样，每次代码修改后都可以快速同步到GitHub，保持代码的版本控制和备份！