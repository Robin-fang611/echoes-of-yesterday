# UI Asset Pipeline

此目录只收纳项目已有美术资源的规范化副本。

- `backgrounds/paper_base.png`：记忆恢复报告固定底图，不裁剪、不调色。
- `frames/button_frame.png`：主菜单按钮原始图集。
- `paper_noise.png`：透明、低强度的临时旧纸颗粒纹理，可直接替换。
- `textures/paper_noise.png`：既有旧书素材的归档副本，不再作为运行时引用。
- `effects/`：光晕与印章扩散使用可调程序材质，避免把颜色烘焙进图片。
- `fonts/`：字体接口目录；当前按 Typography Bible 使用本机楷体、仿宋及宋体回退链。
- `icons/`：保留给后续正式图标资源，不放置临时网页图标。

所有运行路径统一由 `UIAssetManager` 和 `ui_assets.json` 提供。
