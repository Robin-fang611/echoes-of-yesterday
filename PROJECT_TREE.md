# 《昨日重现》项目完整目录树

```
Echoes_Of_Yesterday_Rebuilt/
│
├── 🏠 页面入口
│   ├── main-menu.html                 主菜单（5按钮精灵图，UI v1.1 原版）
│   ├── game.html                      游戏运行时容器（HTML 场景层 + Canvas 交互层）
│   ├── memory-report-artwork.html      章节记忆报告页（Artwork 版）
│   ├── memory-report.html              记忆报告页（旧版兼容）
│   ├── chapter-select.html             章节选择（10章档案卡片）
│   └── medical-notes.html             医学手记页（10章医学知识）
│
├── 🎨 资产资源
│   ├── pictures/                      主界面底图 + 按钮精灵图
│   ├── 记忆恢复报告新底图/              10章报告底图 + 3个导航按钮
│   ├── 第一章/                         Ch1 素材（镜子 + 碎裂 + 房间全景）
│   ├── medical/                        10章医学知识图
│   ├── assets/
│   │   ├── images/                     所有关卡图片（运行期加载）
│   │   ├── chapters/                   章节缩略图（从报告底图生成）
│   │   └── ui/                         UI 材质（纸张纹理、按钮框等）
│   └── scripts/                        chapter-select.js
│
├── 🎮 游戏引擎 (src/game/)
│   ├── main.js                         入口：Canvas 初始化、场景注册、主循环
│   ├── InputManager.js                 Pointer Events 输入管理
│   ├── SceneManager.js                 场景切换 + 300ms 黑场过渡
│   └── ProgressStore.js               localStorage 进度留存（key: ye_v1_progress）
│
├── 📖 章节代码 (src/chXX/)
│   ├── ch01/Ch01Mirror.js             互动·镜前（全景+镜子1.5x+碎裂）
│   ├── ch02/Ch02Puzzle.js             互动·接女儿（3×3拼图+灰度褪色+闪回）
│   ├── ch03/Ch03Maze.js               互动·迷途（漫画→地图连线→城市闪回）
│   ├── ch04/Ch04Police.js             互动·警局（漫画14p→VIP6p→电话→签字→登记单→手环）
│   ├── ch05/Ch05Door.js               互动·归家（漫画→旁白→电梯向日葵→1-5F→漫画）
│   ├── ch06/Ch06Comic.js              🎌 纯漫画·餐桌博弈（7页）
│   ├── ch07/Ch07Night.js              互动·暗夜（漫画→暗夜旁白→找门锁）
│   ├── ch08/Ch08Comic.js              🎌 纯漫画·走廊镜子（7页）
│   ├── ch09/Ch09Comic.js              🎌 纯漫画·风铃（5页）
│   └── ch10/Ch10Report.js             互动·认出（漫画4p→粥→蒙太奇→拥抱→最终报告）
│
├── 🎌 漫画引擎 (src/comic/)
│   └── ComicChapter.js                 通用漫画章组件（点击翻页+页码指示器）
│
├── 🧩 交互模块 (src/interactions/)
│   ├── SignaturePuzzle.js              Ch4 签字板
│   └── SmileDetector.js                Ch8 微笑检测（摄像头）
│
├── 📖 叙事活动 (src/narrative/)
│   ├── FlashbackActivity.js            闪回帧动画
│   └── MontageActivity.js              蒙太奇动画
│
├── 🛠 工具库 (src/utils/)
│   ├── sceneUtils.js                   场景绘制工具（drawPrompt/roundedRect/drawImageCover）
│   ├── puzzleLayout.js                 Ch2 拼图布局配置
│   ├── mazeLayout.js                   Ch3 迷宫配置（来源：ch03/ch03_mazeLayout.js）
│   ├── tableLayout.js                  Ch6 餐桌配置
│   └── returnNightLayout.js            Ch5 声相定位配置（已废弃）
│
├── 🖼 UI 框架 (src/ui/)                  [来自 UI v1.1 — 不改动]
│   ├── core/                           UIManager / UIComponent / UILayer
│   ├── components/                     MemoryPanel / Stamp / PhotoFrame / …
│   ├── typography/                     字体系统（Title/Chapter/Body/Handwriting）
│   ├── materials/                      纸张材质 / 照片材质
│   ├── animations/                     记忆恢复演出
│   └── screen/                         记忆报告屏幕
│
├── 📝 src/ 根目录辅助文件
│   ├── phase4.js                       主菜单交互逻辑
│   ├── phase5.js                       记忆报告交互逻辑
│   ├── memory-report-artwork.js        Artwork 报告应用入口
│   └── memory-report-artwork-config.js 报告配置（章节映射 / 进度 / 按钮坐标）
│
└── 📄 配置文件
    └── src/ui/memory-report-config.json  各章记忆报告底图 + 进度区间
```
