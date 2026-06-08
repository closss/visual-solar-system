# 文物太阳系资产与流水线

## 目标形态

项目从“场景重建”调整为“物体重建/物体资产展示”：9 个文物或图形学经典物体组成太阳 + 八大行星。每个物体有自转和公转；点击物体后放大，并在右侧展示介绍、年代、资产来源。

## 当前 9 个对象

| 轨道角色 | 对象 | 当前资产 | 来源 |
| --- | --- | --- | --- |
| 太阳 | 三星堆青铜神树 | MapAnything 重建 GLB + 高清图 | 程序化近似几何渲染 12 视角，Wikimedia Commons 图片作参考 |
| 水星 | 青铜方彝 | MapAnything 重建 GLB | 由 Smithsonian 3D 真实扫描模型渲染 12 视角输入后离线重建 |
| 金星 | Utah Teapot | MapAnything 重建 GLB | 由 Utah Teapot 渲染 12 视角输入后离线重建 |
| 地球 | Stanford Bunny | MapAnything 重建 GLB | 由 Stanford Bunny 渲染 12 视角输入后离线重建 |
| 火星 | Stanford Dragon | MapAnything 重建 GLB | 由 Stanford Dragon 渲染 12 视角输入后离线重建 |
| 木星 | Cosmic Buddha | MapAnything 重建 GLB | 由 Smithsonian 3D 真实扫描模型渲染 12 视角输入后离线重建 |
| 土星 | Armadillo | MapAnything 重建 GLB + 程序化环 | 由 Armadillo 渲染 12 视角输入后离线重建 |
| 天王星 | 秦始皇兵马俑 | MapAnything 重建 GLB + 高清图 | 程序化近似几何渲染 12 视角，Wikimedia Commons 图片作参考 |
| 海王星 | Moai 石像 | MapAnything 重建 GLB + 高清图 | 程序化近似几何渲染 12 视角，Wikimedia Commons 图片作参考 |

## 本地目录

- 原始下载与整理：`/Users/Zhuanz/data/heritage_solar_system`
- Smithsonian 真实扫描源模型：
  - `/Users/Zhuanz/proj/public/heritage/source_models/cosmic_buddha.glb`
  - `/Users/Zhuanz/proj/public/heritage/source_models/fangyi.glb`
- 前端可加载模型：`/Users/Zhuanz/proj/public/heritage/models`
- 前端可加载图片：`/Users/Zhuanz/proj/public/heritage/images`
- MapAnything 重建结果：`/Users/Zhuanz/proj/public/heritage/recon`

## 渲染质量判断

当前重建质量不应包装成“真实文物照片级重建”。原因是 MapAnything 需要同一物体的多视角输入，单张或非同一实体图片无法稳定恢复完整几何。当前版本为了保证演示可运行，采用两类输入：

1. Utah Teapot、Stanford Bunny、Stanford Dragon、Armadillo：来自公开 3D/扫描资产，先渲染统一 12 视角，再送入 MapAnything。
2. Cosmic Buddha 与青铜方彝：来自 Smithsonian 3D / Freer Gallery of Art 的真实扫描 GLB，先渲染统一 12 视角，再送入 MapAnything。这是当前最适合课堂展示“真实文物扫描资产进入后端重建流水线”的样例。
3. 三星堆青铜神树、兵马俑、Moai：高清图用于文物说明，程序化近似几何用于生成统一 12 视角，再送入 MapAnything。

如果要进一步提升真实感，应优先替换为同一物体的真实多视角照片、公开扫描模型或 photogrammetry 数据。可继续调研的数据源包括：

- Stanford 3D Scanning Repository：适合图形学经典对象。
- Smithsonian 3D / Smithsonian Open Access：适合公开 3D 文博资产。
- Sketchfab 可下载模型：适合查找单个文物或类似对象，但需要逐项确认授权。
- Kaggle / CULTURE3D 等文化遗产 3D 数据集：适合寻找更统一的高保真文化遗产扫描资产。

## Smithsonian 真实扫描样例

| 对象 | 馆藏信息 | 源 GLB |
| --- | --- | --- |
| Cosmic Buddha | Freer Gallery of Art, F1923.15, 北齐 550-577 年 | `public/heritage/source_models/cosmic_buddha.glb` |
| 青铜方彝 | Freer Gallery of Art, F1930.54a-b, 早期西周，约公元前 1100 年 | `public/heritage/source_models/fangyi.glb` |

方彝源 GLB 使用 `KHR_draco_mesh_compression`，`src/object-render.ts` 已接入 `DRACOLoader`，解码器位于 `public/draco/`。MapAnything 输出的 `public/heritage/recon/fangyi.glb` 不再依赖 Draco 解码。

## 服务器目录

计划同步到：`/cvlabdata1/hsw/heritage_solar_system`

当前服务器已包含文物资产目录，以及 9 个对象的物体重建结果：

```bash
/cvlabdata1/hsw/heritage_solar_system/reconstruction_inputs/utah-teapot/images
/cvlabdata1/hsw/heritage_solar_system/reconstruction_inputs/sanxingdui-tree/images
/cvlabdata1/hsw/heritage_solar_system/reconstruction_inputs/fangyi/images
/cvlabdata1/hsw/heritage_solar_system/reconstruction_inputs/stanford_bunny/images
/cvlabdata1/hsw/heritage_solar_system/reconstruction_inputs/stanford-dragon/images
/cvlabdata1/hsw/heritage_solar_system/reconstruction_inputs/cosmic-buddha/images
/cvlabdata1/hsw/heritage_solar_system/reconstruction_inputs/armadillo/images
/cvlabdata1/hsw/heritage_solar_system/reconstruction_inputs/terracotta/images
/cvlabdata1/hsw/heritage_solar_system/reconstruction_inputs/moai/images
/cvlabdata1/hsw/heritage_solar_system/recon_outputs/*.glb
/cvlabdata1/hsw/heritage_solar_system/recon_outputs/*.cameras.json
```

重建命令模板：

```bash
cd /cvlabdata1/hsw/assets/mapanything/map-anything
TORCH_HOME=/home/hsw/.cache/torch CUDA_VISIBLE_DEVICES=0 PYTHONUNBUFFERED=1 /home/hsw/miniconda3/envs/3dvmf_mvp/bin/python -u scripts/run_offline_local.py \
  --image_folder /cvlabdata1/hsw/heritage_solar_system/reconstruction_inputs/<object>/images \
  --output_path /cvlabdata1/hsw/heritage_solar_system/recon_outputs/<object>.glb \
  --minibatch_size 1
```

服务器上的 `scripts/run_offline_local.py` 已加入 DINOv2 torch hub 缓存补丁，将 `facebookresearch/dinov2` 固定为 `facebookresearch/dinov2:main`，避免 GitHub 默认分支探测 504 时绕过本地缓存。

输出验证：

| 对象 | 推理时间 | GLB 大小 | 相机数 |
| --- | ---: | ---: | ---: |
| Sanxingdui Bronze Tree | 3.762s | 6.8MB | 12 |
| Bronze Fangyi | 3.702s | 7.2MB | 12 |
| Utah Teapot | 3.878s | 1.6MB | 12 |
| Stanford Bunny | 3.882s | 13MB | 12 |
| Stanford Dragon | 3.750s | 9.2MB | 12 |
| Cosmic Buddha | 3.784s | 7.6MB | 12 |
| Armadillo | 3.927s | 50MB | 12 |
| Terracotta Warrior | 3.824s | 11MB | 12 |
| Moai | 3.816s | 16MB | 12 |

## 下一步

1. 如果前端加载压力过大，优先压缩 `armadillo.glb` 或降低其多视角输入复杂度。
2. 青铜神树、兵马俑、Moai 当前使用程序化近似几何生成重建输入；展示时需说明高清图用于文物参考，几何重建输入由近似模型生成。
3. 后续如果找到公开多视角扫描，可直接替换 `reconstruction_inputs/<object>/images` 并复用同一重建命令。
