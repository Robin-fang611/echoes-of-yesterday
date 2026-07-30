export const chapters = [
  { id: 1, chapter: "第一章", title: "儿时的回忆", image: "assets/chapters/chapter01.png", unlocked: true, progress: 5, season: "1998 · 春", note: "镜子里的自己……是谁？那些童年的光，落在再也回不去的午后。" },
  { id: 2, chapter: "第二章", title: "接女儿放学", image: "assets/chapters/chapter02.png", unlocked: true, progress: 15, season: "1999 · 初夏", note: "校门口的树影很长，她背着书包回头朝我笑。" },
  { id: 3, chapter: "第三章", title: "迷途", image: "assets/chapters/chapter03.png", unlocked: false, progress: 15, season: "1999 · 夏", note: "熟悉的街巷忽然变得陌生，风把脚步声吹得很远。" },
  { id: 4, chapter: "第四章", title: "警局", image: "assets/chapters/chapter04.png", unlocked: false, progress: 25, season: "1999 · 夏夜", note: "昏黄灯光下，沉默比墙上的钟声更加漫长。" },
  { id: 5, chapter: "第五章", title: "归家迷途", image: "assets/chapters/chapter05.png", unlocked: false, progress: 35, season: "1999 · 暮色", note: "那条路走过许多次，这一次却像通往很久以前。" },
  { id: 6, chapter: "第六章", title: "餐桌上的博弈", image: "assets/chapters/chapter06.png", unlocked: false, progress: 45, season: "1999 · 秋", note: "门还没有推开，记忆里的饭香已经先一步回来了。" },
  { id: 7, chapter: "第七章", title: "暗夜的微光", image: "assets/chapters/chapter07.png", unlocked: false, progress: 55, season: "1999 · 深秋", note: "黑夜并不回答，只在远处留下一点温柔的光。" },
  { id: 8, chapter: "第八章", title: "走廊的镜子", image: "assets/chapters/chapter08.png", unlocked: false, progress: 65, season: "1999 · 冬", note: "镜子记得每一次经过的人，也藏着未说完的话。" },
  { id: 9, chapter: "第九章", title: "旧时光的风铃", image: "assets/chapters/chapter09.png", unlocked: false, progress: 75, season: "2000 · 春", note: "风铃再次响起时，旧时光像风一样穿过窗前。" },
  { id: 10, chapter: "第十章", title: "爱从不迷路", image: "assets/chapters/chapter10.png", unlocked: false, progress: 100, season: "记忆深处", note: "我们或许会忘记方向，但爱总能认出回家的路。" },
];

const refs = {
  list: document.querySelector("#chapter-list"),
  feature: document.querySelector("#feature"),
  image: document.querySelector("#feature-image"),
  number: document.querySelector("#feature-number"),
  title: document.querySelector("#feature-title"),
  note: document.querySelector("#feature-note"),
  state: document.querySelector("#feature-state"),
  progress: document.querySelector("#feature-progress"),
  progressBar: document.querySelector("#progress-bar"),
  date: document.querySelector("#photo-date"),
  enter: document.querySelector("#enter-chapter"),
};

let selectedId = 1;

function imagePath(chapter) {
  return `./${chapter.image}`;
}

function setImage(img, chapter) {
  img.classList.remove("is-missing");
  img.alt = `${chapter.chapter}《${chapter.title}》场景图`;
  img.src = imagePath(chapter);
  img.onerror = () => {
    img.classList.add("is-missing");
    img.removeAttribute("src");
  };
  img.onload = () => img.classList.remove("is-missing");
}

function cardTemplate(chapter) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `chapter-card${chapter.unlocked ? "" : " is-locked"}`;
  button.dataset.chapterId = String(chapter.id);
  button.setAttribute("role", "option");
  button.setAttribute("aria-selected", "false");
  button.innerHTML = `
    <span class="card-thumb"><img alt="" loading="eager"></span>
    <span class="card-copy">
      <small>${chapter.chapter} · ${String(chapter.id).padStart(2, "0")}</small>
      <strong>${chapter.title}</strong>
    </span>
    <span class="card-state">${chapter.unlocked ? `${chapter.progress}%` : "未解锁"}</span>
  `;
  setImage(button.querySelector("img"), chapter);
  button.addEventListener("click", () => selectChapter(chapter.id));
  return button;
}

function selectChapter(id) {
  const chapter = chapters.find((item) => item.id === id);
  if (!chapter) return;

  // 根据存档检测是否已完成过关卡，已完成才能解锁后续章节
  try {
    const saved = JSON.parse(localStorage.getItem('ye_v1_progress') || '{}');
    const maxChapter = saved.chapter || 0;
    const completed = saved.completed || [];

    chapters.forEach(ch => {
      if (ch.id <= 1) {
        ch.unlocked = true;
      } else if (ch.id <= maxChapter + 1) {
        ch.unlocked = true;
      } else {
        ch.unlocked = false;
      }
      // 已完成章节用存档进度，否则用设计值
      if (completed.includes(ch.id) || ch.id <= maxChapter) {
        ch.progress = ch.id <= maxChapter ? ch.progress : ch.progress;
      }
    });
  } catch {}

  selectedId = id;
  refs.feature.classList.remove("is-changing");
  void refs.feature.offsetWidth;
  refs.feature.classList.add("is-changing");

  refs.number.textContent = `${chapter.chapter} · CHAPTER ${String(chapter.id).padStart(2, "0")}`;
  refs.title.textContent = chapter.title;
  refs.note.textContent = chapter.note;
  refs.state.textContent = chapter.unlocked ? "记忆已解锁" : "记忆尚未解锁";
  refs.progress.textContent = `${chapter.progress}%`;
  refs.progressBar.style.width = `${chapter.progress}%`;
  refs.date.textContent = chapter.season;
  refs.enter.disabled = !chapter.unlocked;
  refs.enter.querySelector("span").textContent = chapter.unlocked ? "进入这段回忆" : "记忆尚未解锁";
  setImage(refs.image, chapter);

  refs.list.querySelectorAll(".chapter-card").forEach((card) => {
    const active = Number(card.dataset.chapterId) === id;
    card.classList.toggle("is-selected", active);
    card.setAttribute("aria-selected", String(active));
  });
}

refs.enter.addEventListener("click", () => {
  const chapter = chapters.find((item) => item.id === selectedId);
  if (!chapter?.unlocked) return;
  window.location.assign(`./game.html?chapter=${chapter.id}`);
});

chapters.forEach((chapter) => refs.list.append(cardTemplate(chapter)));

// 初始渲染后再跑一次解锁逻辑（cardTemplate 在 selectChapter 之前需要同步）
(function syncUnlockFromSave() {
  try {
    const saved = JSON.parse(localStorage.getItem('ye_v1_progress') || '{}');
    const maxChapter = saved.chapter || 0;
    chapters.forEach(ch => {
      if (ch.id <= 1) ch.unlocked = true;
      else if (ch.id <= maxChapter + 1) ch.unlocked = true;
      else ch.unlocked = false;
    });
    // 同步更新已渲染的卡片 DOM
    chapters.forEach(ch => {
      const btn = document.querySelector(`.chapter-card[data-chapter-id="${ch.id}"]`);
      if (btn) {
        btn.classList.toggle('is-locked', !ch.unlocked);
        const stateEl = btn.querySelector('.card-state');
        if (stateEl) stateEl.textContent = ch.unlocked ? `${ch.progress}%` : '未解锁';
      }
    });
  } catch {}
})();

selectChapter(1);
