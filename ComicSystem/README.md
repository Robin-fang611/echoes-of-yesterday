# ComicPlayer

通用、配置驱动的漫画剧情播放器。漫画保持为完整 PNG，分镜范围与出现顺序由 JSON 定义，渲染时通过 SVG `clipPath` 裁剪。

## 使用

```js
import { ComicPlayer } from './ComicSystem/ComicPlayer.js';

const player = new ComicPlayer('#comic-layer', {
  clickToAdvance: true,
  duration: 500,
  onComplete: () => {
    // 返回游戏流程或进入下一段剧情
  },
});

await player.load('./ComicSystem/comics/chapter01_scene01.json');

// NPC 对白结束时也可以直接推进
player.next();
```

播放器还提供 `reset()`、`destroy()`、`panelCount` 与 `isComplete`。

事件包括：

- `comic:ready`
- `comic:panelshown`
- `comic:complete`
- `comic:reset`

## JSON 配置

所有坐标均为相对完整图片的百分比，范围为 `0`–`100`。

矩形：

```json
{
  "id": "panel-a",
  "order": 1,
  "shape": "rect",
  "x": 0,
  "y": 0,
  "width": 100,
  "height": 35
}
```

普通或斜切多边形：

```json
{
  "id": "panel-b",
  "order": 2,
  "shape": "polygon",
  "points": [[0, 40], [48, 40], [43, 100], [0, 100]]
}
```

新增章节只需要放入完整 PNG、增加 JSON，并调用 `load()`；播放器代码无需修改。

## 本地运行 Demo

在项目根目录启动任意静态文件服务器，然后访问：

`/ComicSystem/demo.html`

真实素材库页面：

`/ComicSystem/library.html`

该页面按章节组织 `漫画/` 目录中现有的全部素材。配置位于
`ComicSystem/comics/real/`，每张完整原图对应一个 JSON。

例如使用项目现有 Node 环境：

```powershell
npx serve .
```
