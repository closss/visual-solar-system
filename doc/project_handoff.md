# 项目交接文档

更新时间：2026-06-12

## 1. 项目目标

本项目用于《高级图形学与增强现实》大作业。当前目标不是做纯网页模型展柜，而是做一个有后端/离线重建支撑的 Web 3D/AR 风格演示：

- 前端用 Three.js 展示文物或经典 3D 对象组成的“文物太阳系”。
- 对象有公转、自转、点击放大、拖拽观察、介绍面板。
- 后端路线用 MapAnything 做离线多视角重建实验，输出 GLB 点云和相机 JSON。
- 最终需要在报告/答辩里讲清楚：输入数据、多视角重建、点云/相机输出、前端加载和图形学渲染管线。

目前项目经历过一次定位变化：早期 README 仍写“口袋宇宙实验台/真实场景图上叠加太阳地月”，但当前主要代码和资产已经转向“文物太阳系/物体重建展示”。后续应统一 README、页面文案和报告叙事。

## 2. 整体设计

### 前端

本地仓库：`/Users/Zhuanz/proj`

技术栈：

- Vite
- TypeScript
- Three.js
- Vitest

主要入口：

- `index.html` -> `src/main.ts`
  - 当前主页面。
  - 展示 9 个文物/经典对象组成的太阳系。
  - 加载 `public/heritage/recon/*.glb`。
  - 点击对象后暂停轨道动画，放大对象并展示介绍。
- `reconstruction.html` -> `src/reconstruction-viewer.ts`
  - MapAnything 重建结果查看器。
  - 当前硬编码读取 `doc/demo_outputs/scannet_scene0000_00/scene0000_00_6views.glb` 和相机 JSON。
- `object-render.html` -> `src/object-render.ts`
  - 512x512 单物体渲染辅助页。
  - 支持 GLB/PLY/STL/procedural 对象加载。
  - 已接入 `DRACOLoader`，用于加载 Draco 压缩 GLB。

关键模块：

- `src/data/heritage-artifacts.ts`
  - 9 个对象的元数据、文案、轨道参数、模型路径。
- `src/main.ts`
  - 主展示逻辑、加载模型、相机控制、点击选择、轨道动画。
- `src/core/cosmos-scene.ts`
  - 早期“口袋宇宙实验台”透明画布增强场景类，目前不是主页面核心。
- `src/state/app-state.ts`
  - 早期场景增强状态逻辑，有测试覆盖。

前端资产：

- `public/heritage/recon/`
  - 当前前端主用的 MapAnything 重建 GLB。
  - 注意：这些 GLB 统计上都是 `PointCloud`，不是 triangle mesh。
- `public/heritage/source_models/`
  - 当前只有 `cosmic_buddha.glb` 和 `fangyi.glb` 两个真实扫描源模型。
- `public/heritage/models/`
  - Stanford/Utah 等公开经典模型源文件。
- `public/heritage/images/`
  - 文物说明图，不等于重建输入。

### 后端/离线重建

远端服务器：

- host：`hsw-62`
- SSH：`hsw@10.10.10.62`
- 主要数据盘：`/cvlabdata1`

MapAnything 路径：

- 代码：`/cvlabdata1/hsw/assets/mapanything/map-anything`
- 权重：`/cvlabdata1/hsw/assets/mapanything/models/mapanything/map-anything-apache`
- 离线说明：`/cvlabdata1/hsw/assets/mapanything/RUN_OFFLINE.md`
- Python 环境：`/home/hsw/miniconda3/envs/3dvmf_mvp`
- DINOv2 cache：`/home/hsw/.cache/torch/hub/facebookresearch_dinov2_main`

MapAnything 仓库状态：

- 官方版本：`v1.1.2`
- commit：`c845b8f Add VGGT Omega to Model Factory (#157)`
- 当前有未跟踪的本地离线补丁：
  - `ckpt/`
  - `config.json`
  - `scripts/run_offline_local.py`
  - `scripts/run_offline_local.py.bak_dinov2_ref`

这些未跟踪文件很重要，不要随便清理。它们让 MapAnything 可以从本地 Apache 权重和本地 DINOv2 cache 离线启动。

离线推理命令模板：

```bash
cd /cvlabdata1/hsw/assets/mapanything/map-anything
TMPDIR=/cvlabdata1/hsw/tmp \
TORCH_HOME=/home/hsw/.cache/torch \
CUDA_VISIBLE_DEVICES=2 \
PYTHONUNBUFFERED=1 \
/home/hsw/miniconda3/envs/3dvmf_mvp/bin/python -u scripts/run_offline_local.py \
  --image_folder /path/to/images \
  --output_path /path/to/outputs/scene.glb \
  --minibatch_size 1
```

输出：

- `scene.glb`
- `scene.cameras.json`

## 3. 当前现状

### 本地仓库状态

截至本次交接前检查：

- 分支：`main`
- 状态：干净，`main...origin/main`
- 依赖已安装，有 `node_modules`
- 可用命令：

```bash
npm run dev
npm test
npm run build
```

之前验证结果：

- `npm test` 通过，5 个测试。
- `npm run build` 通过，但 Vite 会提示主 chunk 大于 500KB。

### 远端状态

服务器概况：

- OS：Ubuntu 22.04
- GPU：8 张 RTX 3090，每张 24GB
- 最近检查时 GPU 2-7 基本空闲，GPU 0 占用较高。
- 根分区 `/` 最近检查还有约 61G 可用。
- `/cvlabdata1` 约 40T，总可用约 8.1T。

注意事项：

- 之前 `/tmp` 曾满盘导致 `trimesh.export()` 报 `No space left on device`。
- 后续跑 Python/torch 最好显式设置 `TMPDIR=/cvlabdata1/hsw/tmp`。
- 输出不要写 `/tmp`，统一写 `/cvlabdata1`。

### 文物重建数据

远端文物数据目录：

```text
/cvlabdata1/hsw/heritage_solar_system
├── images
├── metadata
├── models
├── reconstruction_inputs
└── recon_outputs
```

当前有 11 组重建输入/输出，其中前端主要用了 9 个：

- `sanxingdui-tree`
- `fangyi`
- `utah-teapot`
- `stanford_bunny`
- `stanford-dragon`
- `cosmic-buddha`
- `armadillo`
- `terracotta`
- `moai`

每个对象的 `reconstruction_inputs/<object>/images` 下有 12 张 512x512 PNG 输入。

当前重建输出在：

```text
/cvlabdata1/hsw/heritage_solar_system/recon_outputs/*.glb
/cvlabdata1/hsw/heritage_solar_system/recon_outputs/*.cameras.json
```

这些输出已同步到本地前端 `public/heritage/recon/`。

## 4. 已知问题

### 4.1 当前渲染质量差的核心原因是数据和输出形式

已经排查过，当前问题不是简单的“MapAnything 只能吃多视角而我们用了单图”。服务器上每个对象确实都有 12 张输入图。

真正的问题：

1. 很多输入不是同一真实文物的真实多视角照片。
   - 三星堆青铜神树、兵马俑、Moai 是程序化近似几何渲染出来的 12 视角。
   - 高清文物图只用于介绍，不参与几何重建。
2. 有些输入生成失败。
   - `armadillo` 的 12 张输入图被视觉确认基本全是空白背景。
3. 当前 MapAnything 导出的 GLB 是点云，不是 mesh。
   - 用 `trimesh` 检查，所有当前 `recon_outputs/*.glb` 类型都是 `PointCloud`，`faces=0`。
   - 点云很容易显得薄、散、像一张平面。
4. 白底孤立物体转台图对 MapAnything 不稳定。
   - 大量背景像素没有几何约束。
   - 对纹理少、反光、细枝结构、纯色物体很容易相机估计退化。
   - 一旦相机基线塌缩，反投影点云就会变成“一个面”。

### 4.2 当前不适合包装成“真实文物高保真重建”

可比较稳妥地讲：

- 项目已跑通“多视角输入 -> MapAnything 点云/相机 -> Web 展示”的技术链路。
- 当前数据质量不足，导致部分重建效果差。
- 后续重点是替换高质量数据，而不是继续调前端材质。

不应声称：

- 当前所有文物都是从真实多视角照片重建。
- 当前 GLB 是高质量 mesh。
- 当前结果达到文物扫描级别。

## 5. 当前需求和下一步方向

目前最核心需求：找到更好的输入数据，重新跑后端，并替换前端资产。

有两条路线。

### 路线 A：多图 + MapAnything

这是推荐主线。

目标：

- 找到同一物体的 12-30 张真实多视角图，或从高质量 3D 扫描模型渲染更多规范视角。
- 用已有 MapAnything Apache 权重跑重建。
- 前端展示重建点云，同时在报告里讲清楚重建管线和局限。

优点：

- 不需要重新下大模型权重。
- 更符合“多视角重建/高级图形学与 AR”课程叙事。
- 当前服务器环境已跑通。

缺点：

- 数据难找。
- MapAnything 输出仍是点云，最终观感上限有限。
- 对白底转台和弱纹理物体不稳定。

数据优先级：

1. 同一真实物体的多视角照片/视频。
2. 官方或博物馆高质量 3D 扫描模型，然后自己渲染 24-48 视角。
3. 普通高清单图不适合这条路线。

建议选物体：

- 雕像
- 头像
- 佛像
- 动物雕塑
- 面具
- 陶罐
- 青铜器
- 棋子

尽量避开：

- 青铜神树这类细枝结构。
- 强反光金属。
- 透明物体。
- 大面积纯白/纯黑无纹理物体。
- 扁平碑刻/浮雕/画片。

### 路线 B：单图 + 单图生成 3D 模型

这是备选路线。

候选模型：

- Hunyuan3D-2
- TRELLIS / TRELLIS.2
- TripoSR

优点：

- 数据容易，找一张高质量文物图即可。
- 输出通常是 mesh，前端观感可能比 MapAnything 点云好。

缺点：

- 需要重新下载权重、搭环境。
- 更像 single-image 3D generation，不是严格多视角重建。
- 报告里不能包装成“真实几何恢复”。

如果走这条路，应写成：

```text
单图文物图像 -> 生成式 3D 资产 -> Web 3D/AR 展示
```

而不是：

```text
单图真实重建出了准确文物几何
```

## 6. 建议执行顺序

1. 先用 1 天找数据，优先找同一物体多视角图或可下载 3D 扫描模型。
2. 选 2-3 个质量可靠的对象替换现有最差对象：
   - 优先替换 `sanxingdui-tree`
   - 替换 `armadillo`
   - 替换 `terracotta` 或 `moai`
3. 用 MapAnything 重新跑这些对象。
4. 检查输出：
   - 是否不是空白输入。
   - 相机是否有合理基线。
   - 点云是否明显不是一张片。
5. 替换 `public/heritage/recon/*.glb` 和元数据。
6. 更新 README 和答辩文案，让项目叙事从旧“口袋宇宙实验台”统一到当前“文物太阳系/多视角重建展示”。
7. 如果一天内找不到好数据，再考虑单图生成模型路线。

## 7. 常用命令

本地前端：

```bash
cd /Users/Zhuanz/proj
npm install
npm run dev
npm test
npm run build
```

启动后访问：

```text
http://127.0.0.1:5173/
http://127.0.0.1:5173/reconstruction.html
http://127.0.0.1:5173/object-render.html
```

远端 MapAnything smoke test：

```bash
ssh hsw@10.10.10.62
cd /cvlabdata1/hsw/assets/mapanything/map-anything
mkdir -p /cvlabdata1/hsw/tmp
TMPDIR=/cvlabdata1/hsw/tmp \
TORCH_HOME=/home/hsw/.cache/torch \
CUDA_VISIBLE_DEVICES=2 \
PYTHONUNBUFFERED=1 \
/home/hsw/miniconda3/envs/3dvmf_mvp/bin/python -u scripts/run_offline_local.py \
  --image_folder /cvlabdata1/hsw/assets/mapanything/smoke/images \
  --output_path /cvlabdata1/hsw/assets/mapanything/smoke/outputs/check.glb \
  --minibatch_size 1
```

跑某个文物对象：

```bash
cd /cvlabdata1/hsw/assets/mapanything/map-anything
TMPDIR=/cvlabdata1/hsw/tmp \
TORCH_HOME=/home/hsw/.cache/torch \
CUDA_VISIBLE_DEVICES=2 \
PYTHONUNBUFFERED=1 \
/home/hsw/miniconda3/envs/3dvmf_mvp/bin/python -u scripts/run_offline_local.py \
  --image_folder /cvlabdata1/hsw/heritage_solar_system/reconstruction_inputs/<object>/images \
  --output_path /cvlabdata1/hsw/heritage_solar_system/recon_outputs/<object>.glb \
  --minibatch_size 1
```

同步远端结果到本地：

```bash
scp hsw@10.10.10.62:/cvlabdata1/hsw/heritage_solar_system/recon_outputs/<object>.glb \
  /Users/Zhuanz/proj/public/heritage/recon/

scp hsw@10.10.10.62:/cvlabdata1/hsw/heritage_solar_system/recon_outputs/<object>.cameras.json \
  /Users/Zhuanz/proj/public/heritage/recon/
```

## 8. 需要谨慎的点

- 不要删除远端 MapAnything 仓库里的未跟踪离线补丁。
- 不要把输出写到 `/tmp`。
- 不要把普通高清单图当作多视角重建数据。
- 不要把当前点云 GLB 当作高质量 mesh。
- 如果下载官方/博物馆 3D 模型，最终展示可以直接用 mesh，但如果作业需要体现后端，应保留 MapAnything 或单图生成作为实验/对比模块。
- 如果继续用 MapAnything，应该优先解决数据，而不是调前端材质。

## 9. 当前一句话结论

项目技术链路已经跑通，但展示质量瓶颈主要在数据和输出形式：现有多视角输入不够真实/稳定，MapAnything 输出是点云而不是 mesh。下一阶段最重要的是换高质量同一物体多视角数据，或明确切到单图生成式 3D 路线。
