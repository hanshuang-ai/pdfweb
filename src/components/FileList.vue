<template>
	<div class="file-list-card">
		<div class="card-header">
			<div class="header-content">
				<div class="header-icon">📁</div>
				<div class="header-text">
					<h2>文件管理</h2>
					<p>查看和管理您的文件</p>
				</div>
			</div>
			<button
				@click="refreshFileList"
				:disabled="loading"
				class="refresh-btn compact"
				:class="{ refreshing: loading }"
			>
				<span class="refresh-icon" :class="{ spin: loading }">🔄</span>
				<span class="refresh-text">{{ loading ? "刷新中" : "刷新" }}</span>
			</button>
		</div>

		<!-- 统计信息 -->
		<div v-if="!loading && !error && files.length > 0" class="stats-panel">
			<div class="stat-item">
				<div class="stat-icon">📊</div>
				<div class="stat-content">
					<div class="stat-number">{{ totalFiles }}</div>
					<div class="stat-label">总文件数</div>
				</div>
			</div>
			<div class="stat-item">
				<div class="stat-icon">💾</div>
				<div class="stat-content">
					<div class="stat-number">{{ getTotalSize() }}</div>
					<div class="stat-label">总大小</div>
				</div>
			</div>
		</div>

		<!-- 加载状态 -->
		<div v-if="loading && files.length === 0" class="loading-state">
			<div class="loading-icon">⏳</div>
			<p>正在加载文件列表...</p>
		</div>

		<!-- 错误状态 -->
		<div v-else-if="error" class="error-state">
			<div class="error-icon">❌</div>
			<h4>加载失败</h4>
			<p>{{ error }}</p>
			<button @click="refreshFileList" class="retry-btn">🔄 重试</button>
		</div>

		<!-- 空状态 -->
		<div v-else-if="files.length === 0" class="empty-state">
			<div class="empty-icon">📭</div>
			<h4>还没有文件</h4>
			<p>上传您的第一个文件开始使用吧！</p>
		</div>

		<!-- 文件列表 -->
		<div v-else class="file-list">
			<div class="file-items">
				<div
					v-for="(file, index) in files"
					:key="file.pathname"
					class="file-item"
					:style="{ 'animation-delay': index * 0.1 + 's' }"
				>
					<div class="file-preview">
						<div class="file-type-icon">
							{{ getFileTypeIcon(file.contentType, file.pathname) }}
						</div>
					</div>

					<div class="file-content">
						<div class="file-header">
							<h4 class="file-name" :title="file.originalName">
								{{ file.originalName }}
							</h4>
							<div
								class="file-badge"
								:class="getFileTypeClass(file.contentType, file.pathname)"
							>
								{{ getFileTypeLabel(file.contentType, file.pathname) }}
							</div>
						</div>
						<div class="file-meta">
							<span class="meta-item">
								<span class="meta-icon">📏</span>
								{{ file.formattedSize }}
							</span>
							<span class="meta-item">
								<span class="meta-icon">📅</span>
								{{ file.formattedDate }}
							</span>
              <div class="file-actions">
							<div class="action-buttons-left">
								<a
									:href="file.url"
									target="_blank"
									class="action-btn view-btn"
									title="查看文件"
								>
									<span class="btn-icon">👁️</span>
									<span class="btn-text">查看</span>
								</a>
								<button
									v-if="getFileTypeLabel(file.contentType, file.pathname) === 'PDF'"
									@click="editPDF(file)"
									class="action-btn edit-btn"
									title="编辑PDF"
								>
									<span class="btn-icon">📝</span>
									<span class="btn-text">编辑</span>
								</button>
								<button
									@click="copyUrl(file.url)"
									class="action-btn copy-btn"
									title="复制链接"
								>
									<span class="btn-icon">📋</span>
									<span class="btn-text">复制</span>
								</button>
								<button
									@click="deleteFile(file.pathname)"
									:disabled="deleting"
									class="action-btn delete-btn"
									title="删除文件"
								>
									<span class="btn-icon">🗑️</span>
									<span class="btn-text">删除</span>
								</button>
							</div>
						</div>
						</div>

					</div>
				</div>
			</div>

			<!-- 分页组件 -->
			<div v-if="totalPages > 1" class="pagination-container">
				<div class="pagination">
					<button
						@click="prevPage"
						:disabled="currentPage === 1"
						class="pagination-btn prev-btn"
					>
						<span class="btn-icon">⬅️</span>
						<span class="btn-text">上一页</span>
					</button>

					<div class="page-numbers">
						<button
							v-for="page in totalPages"
							:key="page"
							@click="goToPage(page)"
							:class="['page-number', { active: currentPage === page }]"
						>
							{{ page }}
						</button>
					</div>

					<button
						@click="nextPage"
						:disabled="currentPage === totalPages"
						class="pagination-btn next-btn"
					>
						<span class="btn-text">下一页</span>
						<span class="btn-icon">➡️</span>
					</button>
				</div>

				<div class="pagination-info">
					第 {{ currentPage }} 页，共 {{ totalPages }} 页 ({{
						allFiles.length
					}}
					个文件)
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

export default {
	name: "FileList",
	setup() {
		const router = useRouter();
		const files = ref([]);
		const allFiles = ref([]);
		const loading = ref(false);
		const deleting = ref(false);
		const error = ref("");
		const totalFiles = ref(0);
		const currentPage = ref(1);
		const pageSize = ref(2);

		const fetchFileList = async () => {
			loading.value = true;
			error.value = "";

			try {
				console.log("Fetching file list...");
				const response = await fetch("/api/list-files");

				if (!response.ok) {
					throw new Error(`获取文件列表失败: ${response.statusText}`);
				}

				const data = await response.json();
				allFiles.value = data.files || [];
				totalFiles.value = data.total || 0;
				currentPage.value = 1;
				updateTotalPages();
				updateFilesForCurrentPage();
				console.log(`Fetched ${totalFiles.value} files`);
			} catch (err) {
				console.error("Failed to fetch file list:", err);
				error.value = err.message;
			} finally {
				loading.value = false;
			}
		};

		const refreshFileList = () => {
			fetchFileList();
		};

		const copyUrl = async (url) => {
			try {
				await navigator.clipboard.writeText(url);
				window.$toast.success("复制成功", "链接已复制到剪贴板！");
			} catch (err) {
				console.error("Failed to copy URL:", err);
				// 降级方案：选中文本
				const textArea = document.createElement("textarea");
				textArea.value = url;
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand("copy");
				document.body.removeChild(textArea);
				window.$toast.success("复制成功", "链接已复制到剪贴板！");
			}
		};

		const editPDF = (file) => {
			// 构建编辑页面 URL 参数
			const fileData = {
				url: file.url,
				name: file.originalName,
				pathname: file.pathname
			};

			const params = encodeURIComponent(JSON.stringify(fileData));
			const editorUrl = `/editor?file=${params}`;

			// 使用 Vue Router 进行导航
			router.push(editorUrl);
		};

		const deleteFile = async (pathname) => {
			// 获取文件名用于显示
			const file = allFiles.value.find(f => f.pathname === pathname);
			const fileName = file ? file.originalName : '这个文件';

			const confirmed = await window.$confirm({
				title: '删除文件',
				message: `确定要删除文件 "${fileName}" 吗？`,
				details: '此操作不可撤销，文件将被永久删除。',
				confirmText: '删除',
				cancelText: '取消',
				type: 'danger'
			});

			if (!confirmed) {
				return;
			}

			deleting.value = true;

			try {
				console.log("Deleting file:", pathname);
				const response = await fetch("/api/delete-file", {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ pathname }),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(
						errorData.details || `删除失败: ${response.statusText}`
					);
				}

				// 刷新文件列表
				await fetchFileList();
				window.$toast.success("删除成功", "文件已成功删除！");
			} catch (err) {
				console.error("Failed to delete file:", err);
				window.$toast.error("删除失败", `删除失败: ${err.message}`);
			} finally {
				deleting.value = false;
			}
		};

		// 更新当前页的文件列表
		const updateFilesForCurrentPage = () => {
			const startIndex = (currentPage.value - 1) * pageSize.value;
			const endIndex = startIndex + pageSize.value;
			files.value = allFiles.value.slice(startIndex, endIndex);
		};

		// 获取总页数
		const totalPages = ref(1);

		// 计算总页数
		const updateTotalPages = () => {
			totalPages.value = Math.ceil(allFiles.value.length / pageSize.value);
		};

		// 切换页面
		const goToPage = (page) => {
			if (page >= 1 && page <= totalPages.value) {
				currentPage.value = page;
				updateFilesForCurrentPage();
			}
		};

		// 上一页
		const prevPage = () => {
			goToPage(currentPage.value - 1);
		};

		// 下一页
		const nextPage = () => {
			goToPage(currentPage.value + 1);
		};

		// 获取文件总大小
		const getTotalSize = () => {
			if (allFiles.value.length === 0) return "0 B";

			// 真实计算所有文件大小
			let totalBytes = 0;

			allFiles.value.forEach((file) => {
				// 解析文件大小，支持各种格式 (KB, MB, GB)
				if (file.size) {
					totalBytes += file.size;
				} else if (file.formattedSize) {
					// 从格式化的字符串中解析大小
					const sizeStr = file.formattedSize.toLowerCase();
					if (sizeStr.includes("gb")) {
						totalBytes += parseFloat(sizeStr) * 1024 * 1024 * 1024;
					} else if (sizeStr.includes("mb")) {
						totalBytes += parseFloat(sizeStr) * 1024 * 1024;
					} else if (sizeStr.includes("kb")) {
						totalBytes += parseFloat(sizeStr) * 1024;
					} else if (sizeStr.includes("b")) {
						totalBytes += parseFloat(sizeStr);
					}
				}
			});

			// 格式化总大小
			const formatFileSize = (bytes) => {
				if (bytes === 0) return "0 B";
				const k = 1024;
				const sizes = ["B", "KB", "MB", "GB", "TB"];
				const i = Math.floor(Math.log(bytes) / Math.log(k));
				return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
			};

			return formatFileSize(totalBytes);
		};

		// 根据文件后缀获取文件类型
		const getFileTypeFromPath = (pathname) => {
			if (!pathname) return { icon: "📄", label: "未知", class: "type-default" };

			const extension = pathname.toLowerCase().split('.').pop();

			switch (extension) {
				// 图片文件
				case 'jpg':
				case 'jpeg':
				case 'png':
				case 'gif':
				case 'bmp':
				case 'webp':
				case 'svg':
				case 'ico':
				case 'tiff':
				case 'psd':
					return { icon: "🖼️", label: "图片", class: "type-image" };

				// 视频文件
				case 'mp4':
				case 'avi':
				case 'mov':
				case 'wmv':
				case 'flv':
				case 'webm':
				case 'mkv':
				case '3gp':
				case 'mpg':
				case 'mpeg':
				case 'm4v':
					return { icon: "🎬", label: "视频", class: "type-video" };

				// 音频文件
				case 'mp3':
				case 'wav':
				case 'flac':
				case 'aac':
				case 'ogg':
				case 'wma':
				case 'm4a':
				case 'opus':
				case 'amr':
					return { icon: "🎵", label: "音频", class: "type-audio" };

				// 文档文件
				case 'pdf':
					return { icon: "📕", label: "PDF", class: "type-pdf" };

				case 'doc':
				case 'docx':
				case 'rtf':
				case 'odt':
					return { icon: "📘", label: "文档", class: "type-document" };

				case 'xls':
				case 'xlsx':
				case 'csv':
				case 'ods':
					return { icon: "📗", label: "表格", class: "type-spreadsheet" };

				case 'ppt':
				case 'pptx':
				case 'odp':
					return { icon: "📙", label: "演示", class: "type-presentation" };

				// 文本文件
				case 'txt':
				case 'md':
				case 'log':
				case 'ini':
				case 'conf':
				case 'json':
				case 'xml':
				case 'yaml':
				case 'yml':
					return { icon: "📝", label: "文本", class: "type-text" };

				// 压缩文件
				case 'zip':
				case 'rar':
				case '7z':
				case 'tar':
				case 'gz':
				case 'bz2':
				case 'xz':
				case 'lzma':
				case 'cab':
				case 'iso':
					return { icon: "📦", label: "压缩包", class: "type-archive" };

				// 代码文件
				case 'js':
				case 'jsx':
				case 'ts':
				case 'tsx':
				case 'vue':
				case 'html':
				case 'htm':
				case 'css':
				case 'scss':
				case 'less':
				case 'php':
				case 'py':
				case 'java':
				case 'cpp':
				case 'c':
				case 'h':
				case 'cs':
				case 'go':
				case 'rs':
				case 'swift':
				case 'kt':
				case 'rb':
				case 'sql':
					return { icon: "💻", label: "代码", class: "type-code" };

				// 可执行文件
				case 'exe':
				case 'msi':
				case 'dmg':
				case 'pkg':
				case 'deb':
				case 'rpm':
				case 'apk':
				case 'ipa':
					return { icon: "⚙️", label: "程序", class: "type-executable" };

				// 字体文件
				case 'ttf':
				case 'otf':
				case 'woff':
				case 'woff2':
				case 'eot':
					return { icon: "🔤", label: "字体", class: "type-font" };

				// 设计文件
				case 'psd':
				case 'ai':
				case 'sketch':
				case 'fig':
				case 'xd':
					return { icon: "🎨", label: "设计", class: "type-design" };

				// 其他常见文件
				case 'db':
				case 'sqlite':
				case 'mdb':
					return { icon: "🗄️", label: "数据库", class: "type-database" };

				default:
					return { icon: "📄", label: "其他", class: "type-default" };
			}
		};

		// 获取文件类型图标
		const getFileTypeIcon = (contentType, pathname) => {
			return getFileTypeFromPath(pathname).icon;
		};

		// 获取文件类型标签
		const getFileTypeLabel = (contentType, pathname) => {
			return getFileTypeFromPath(pathname).label;
		};

		// 获取文件类型样式类
		const getFileTypeClass = (contentType, pathname) => {
			return getFileTypeFromPath(pathname).class;
		};

		// 组件挂载时获取文件列表
		onMounted(() => {
			fetchFileList();
		});

		return {
			files,
			allFiles,
			loading,
			deleting,
			error,
			totalFiles,
			currentPage,
			pageSize,
			totalPages,
			refreshFileList,
			copyUrl,
			editPDF,
			deleteFile,
			getTotalSize,
			getFileTypeIcon,
			getFileTypeLabel,
			getFileTypeClass,
			goToPage,
			prevPage,
			nextPage,
		};
	},
};
</script>

<style scoped>
.file-list-card {
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(20px);
	border-radius: 20px;
	border: 1px solid rgba(255, 255, 255, 0.2);
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
	height: 100%;
	display: flex;
	flex-direction: column;
	transition: all 0.3s ease;
	overflow: hidden;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 2rem;
	border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.header-content {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.header-icon {
	font-size: 2.5rem;
	animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
	0%,
	100% {
		transform: translateY(0px);
	}
	50% {
		transform: translateY(-5px);
	}
}

.header-text h2 {
	margin: 0;
	color: #1e293b;
	font-size: 1.5rem;
	font-weight: 700;
}

.header-text p {
	margin: 0.25rem 0 0;
	color: #64748b;
	font-size: 0.875rem;
}

.refresh-btn {
	background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
	color: white;
	border: none;
	padding: 0.5rem 1rem;
	border-radius: 8px;
	cursor: pointer;
	font-size: 0.75rem;
	font-weight: 600;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	gap: 0.375rem;
}

.refresh-btn.compact .refresh-icon {
	font-size: 0.875rem;
}

.refresh-btn.compact .refresh-text {
	font-size: 0.75rem;
}

.refresh-btn:hover:not(:disabled) {
	transform: translateY(-2px);
	box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
}

.refresh-btn:disabled {
	background: #cbd5e0;
	cursor: not-allowed;
	transform: none;
	box-shadow: none;
}

.refresh-icon.spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.stats-panel {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	padding: 1.5rem 2rem;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
	border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item {
	display: flex;
	align-items: center;
	gap: 1rem;
	background: rgba(255, 255, 255, 0.8);
	padding: 1rem;
	border-radius: 12px;
	transition: all 0.3s ease;
}

.stat-item:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
	font-size: 2rem;
}

.stat-content {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.stat-number {
	font-size: 1.25rem;
	font-weight: 700;
	color: #1e293b;
}

.stat-label {
	font-size: 0.75rem;
	color: #64748b;
	font-weight: 500;
}

.loading-state,
.error-state,
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem 2rem;
	text-align: center;
	flex: 1;
}

.loading-icon,
.error-icon,
.empty-icon {
	font-size: 4rem;
	margin-bottom: 1rem;
}

.loading-icon {
	animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
	0%,
	100% {
		transform: scale(1);
		opacity: 1;
	}
	50% {
		transform: scale(1.1);
		opacity: 0.8;
	}
}

.error-state h4,
.empty-state h4 {
	margin: 0 0 0.5rem;
	color: #1e293b;
	font-size: 1.25rem;
	font-weight: 600;
}

.error-state p,
.empty-state p,
.loading-state p {
	margin: 0 0 1.5rem;
	color: #64748b;
}

.retry-btn {
	background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	color: white;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 12px;
	cursor: pointer;
	font-weight: 600;
	transition: all 0.3s ease;
}

.retry-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
}

.file-list {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.file-items {
	flex: 1;
	overflow-y: auto;
	padding: 1rem;
}

.file-item {
	background: rgba(255, 255, 255, 0.9);
	border-radius: 16px;
	padding: 1rem;
	margin-bottom: 1rem;
	border: 1px solid rgba(255, 255, 255, 0.3);
	transition: all 0.3s ease;
	animation: slideInUp 0.5s ease forwards;
	opacity: 0;
	transform: translateY(20px);
}

@keyframes slideInUp {
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.file-item:hover {
	transform: translateY(-4px);
	box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
	background: rgba(255, 255, 255, 1);
}

.file-preview {
	margin-bottom: 1rem;
	display: flex;
	justify-content: center;
	display: none;
}

.file-type-icon {
	font-size: 3rem;
	text-align: center;
	padding: 1rem;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
	border-radius: 12px;
	width: 80px;
	height: 80px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.file-content {
	margin-bottom: 1rem;
}

.file-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 0.75rem;
	gap: 1rem;
}

.file-name {
	margin: 0;
	color: #1e293b;
	font-size: 1.125rem;
	font-weight: 600;
	line-height: 1.4;
	word-break: break-all;
	flex: 1;
}

.file-badge {
	padding: 0.25rem 0.75rem;
	border-radius: 20px;
	font-size: 0.75rem;
	font-weight: 600;
	white-space: nowrap;
	flex-shrink: 0;
}

.type-image {
	background: #dbeafe;
	color: #1e40af;
}
.type-video {
	background: #fef3c7;
	color: #92400e;
}
.type-audio {
	background: #ede9fe;
	color: #6d28d9;
}
.type-pdf {
	background: #fee2e2;
	color: #991b1b;
}
.type-text {
	background: #f0fdf4;
	color: #166534;
}
.type-archive {
	background: #f3e8ff;
	color: #7c3aed;
}
.type-document {
	background: #e0f2fe;
	color: #0c4a6e;
}
.type-spreadsheet {
	background: #f0fdf4;
	color: #166534;
}
.type-presentation {
	background: #fefce8;
	color: #713f12;
}
.type-code {
	background: #f3e8ff;
	color: #6b21a8;
}
.type-executable {
	background: #fee2e2;
	color: #991b1b;
}
.type-font {
	background: #f0f9ff;
	color: #1e3a8a;
}
.type-design {
	background: #fef3c7;
	color: #92400e;
}
.type-database {
	background: #e0e7ff;
	color: #3730a3;
}
.type-default {
	background: #f1f5f9;
	color: #475569;
}

.file-meta {
	display: flex;
	gap: 1.5rem;
	flex-wrap: wrap;
}

.meta-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: #64748b;
}

.meta-icon {
	font-size: 1rem;
}

.file-actions {
	display: flex;
	justify-content: flex-start;
}

.action-buttons-left {
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
}

.action-btn {
	padding: 0.375rem 0.75rem;
	border: none;
	border-radius: 6px;
	font-size: 0.75rem;
	font-weight: 600;
	cursor: pointer;
	text-decoration: none;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	gap: 0.375rem;
	min-width: 70px;
	justify-content: center;
}

.view-btn {
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
}

.view-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}

.copy-btn {
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
}

.copy-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
}

.edit-btn {
	background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
	color: white;
}

.edit-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 16px rgba(139, 92, 246, 0.3);
}

.delete-btn {
	background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	color: white;
}

.delete-btn:hover:not(:disabled) {
	transform: translateY(-2px);
	box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3);
}

.delete-btn:disabled {
	background: #cbd5e0;
	cursor: not-allowed;
	transform: none;
	box-shadow: none;
}

.btn-icon {
	font-size: 0.875rem;
}

.btn-text {
	font-size: 0.75rem;
}

/* 响应式设计 */
@media (max-width: 1024px) {
	.card-header {
		flex-direction: column;
		gap: 1rem;
		align-items: stretch;
	}

	.stats-panel {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 768px) {
	.file-list-card {
		border-radius: 16px;
	}

	.card-header {
		padding: 1.5rem;
	}

	.header-content {
		flex-direction: column;
		text-align: center;
		gap: 0.75rem;
	}

	.stats-panel {
		padding: 1rem 1.5rem;
	}

	.file-item {
		padding: 1rem;
		margin-bottom: 0.75rem;
	}

	.file-type-icon {
		width: 60px;
		height: 60px;
		font-size: 2rem;
	}

	.file-header {
		flex-direction: column;
		align-items: stretch;
	}

	.file-name {
		font-size: 1rem;
		text-align: center;
	}

	.file-badge {
		align-self: center;
	}

	.file-meta {
		justify-content: center;
		gap: 1rem;
	}

	.file-actions {
		gap: 0.5rem;
	}

	.action-btn {
		padding: 0.5rem 0.75rem;
		min-width: 80px;
		font-size: 0.75rem;
	}

	.btn-text {
		display: none;
	}
}

/* 分页样式 */
.pagination-container {
	padding: 1.5rem 2rem;
	border-top: 1px solid rgba(255, 255, 255, 0.2);
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.pagination {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
	gap: 1rem;
}

.pagination-btn {
	background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
	color: white;
	border: none;
	padding: 0.5rem 1rem;
	border-radius: 8px;
	cursor: pointer;
	font-size: 0.75rem;
	font-weight: 600;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	gap: 0.375rem;
	min-width: auto;
}

.pagination-btn:hover:not(:disabled) {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.pagination-btn:disabled {
	background: #cbd5e0;
	cursor: not-allowed;
	transform: none;
	box-shadow: none;
}

.page-numbers {
	display: flex;
	gap: 0.5rem;
	align-items: center;
}

.page-number {
	background: rgba(255, 255, 255, 0.8);
	color: #64748b;
	border: 1px solid #e5e7eb;
	padding: 0.5rem 0.75rem;
	border-radius: 6px;
	cursor: pointer;
	font-size: 0.75rem;
	font-weight: 600;
	transition: all 0.3s ease;
	min-width: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.page-number:hover {
	background: #6366f1;
	color: white;
	border-color: #6366f1;
	transform: translateY(-1px);
}

.page-number.active {
	background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
	color: white;
	border-color: #6366f1;
	transform: scale(1.1);
}

.pagination-info {
	text-align: center;
	font-size: 0.75rem;
	color: #64748b;
	font-weight: 500;
}

@media (max-width: 480px) {
	.card-header {
		padding: 1rem;
	}

	.header-icon {
		font-size: 2rem;
	}

	.header-text h2 {
		font-size: 1.25rem;
	}

	.file-item {
		padding: 0.75rem;
	}

	.file-actions {
		flex-direction: column;
	}

	.action-btn {
		width: 100%;
		min-width: auto;
	}

	.pagination-container {
		padding: 1rem 1.5rem;
	}

	.pagination {
		flex-direction: column;
		gap: 1rem;
	}

	.page-numbers {
		gap: 0.375rem;
	}

	.page-number {
		padding: 0.375rem 0.625rem;
		font-size: 0.625rem;
		min-width: 32px;
	}

	.pagination-btn {
		padding: 0.375rem 0.75rem;
		font-size: 0.625rem;
	}

	.pagination-info {
		font-size: 0.625rem;
	}
}
</style>
