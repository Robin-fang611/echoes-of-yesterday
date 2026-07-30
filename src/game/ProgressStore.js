// 进度存储（localStorage）
// key: ye_v1_progress

const STORAGE_KEY = 'ye_v1_progress';

export class ProgressStore {
  constructor(key = STORAGE_KEY) {
    this.key = key;
  }

  /** 读取存档 */
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /** 保存 */
  save(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch {
      // localStorage 不可用时静默降级
    }
  }

  /** 标记章节完成 — 写入 chapter 编号和累计记忆值 */
  markChapterComplete(chapterNum, memory) {
    const data = this.load() || {};
    data.chapter = Math.max(data.chapter || 0, chapterNum);
    data.memory = Math.max(data.memory || 0, memory);

    // 记录已完成章节列表
    const completed = data.completed || [];
    if (!completed.includes(chapterNum)) {
      completed.push(chapterNum);
    }
    data.completed = completed.sort((a, b) => a - b);

    this.save(data);
  }

  /** 清档 */
  reset() {
    try {
      localStorage.removeItem(this.key);
    } catch {}
  }

  /** 获取下一个应进入的章节 */
  getNextChapter() {
    const data = this.load();
    if (!data || !data.chapter) return 1;
    return Math.min(data.chapter + 1, 10);
  }
}
