# MapAnything 离线后端准备说明

本文用于服务器部署准备。目标是把当前项目从“纯前端演示”升级为：

```text
真实场景图片/视频
→ Linux GPU 服务器离线重建
→ 输出相机、深度、点云/GLB、scene.json
→ Three.js 前端读取并做太阳-地球-月亮增强现实展示
```

## 结论

主后端选 **MapAnything Apache 权重**。它的官方仓库支持图片输入、metric 3D reconstruction、COLMAP 导出、GLB 导出，并且代码和 Apache 权重都适合课程项目长期保存。

- 代码仓库：https://github.com/facebookresearch/map-anything
- Apache 权重：https://huggingface.co/facebook/map-anything-apache
- 研究版权重：https://huggingface.co/facebook/map-anything
- 论文：https://arxiv.org/abs/2509.13414

优先下载 `facebook/map-anything-apache`。研究版 `facebook/map-anything` 可能质量更高，但许可证是 CC-BY-NC 4.0；Apache 版最省心。

## 服务器建议环境

推荐：

```text
Ubuntu 22.04/24.04
NVIDIA GPU
NVIDIA driver 可用
conda 或 mamba
Python 3.12
git
ffmpeg
build-essential / cmake / ninja-build
```

MapAnything 官方没有固定 PyTorch/CUDA 版本，建议按服务器 CUDA/驱动情况从 PyTorch 官方选择安装命令。

先确认 GPU：

```bash
nvidia-smi
```

基础工具：

```bash
sudo apt update
sudo apt install -y git git-lfs ffmpeg build-essential cmake ninja-build
git lfs install
```

## 拉取 MapAnything 代码

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/facebookresearch/map-anything.git
cd map-anything
```

创建环境：

```bash
conda create -n mapanything python=3.12 -y
conda activate mapanything
```

安装 PyTorch 后，再安装 MapAnything：

```bash
# 先按服务器 CUDA 版本安装 torch / torchvision / torchaudio
# 具体命令以 https://pytorch.org/get-started/locally/ 为准

pip install -e .
```

如果要跑官方 Gradio demo：

```bash
pip install -e ".[gradio]"
python scripts/gradio_app.py
```

如果要导出 COLMAP / GLB：

```bash
pip install -e ".[colmap]"
```

如果要跑外部模型对比，例如 VGGT、VGGT-Omega、MoGe-2、Pi3X：

```bash
pip install -e ".[all]"
```

`.[all]` 依赖更重，第一阶段不建议直接装。先用 `pip install -e .` 和 `pip install -e ".[colmap]"` 跑通主线。

## 下载权重

推荐用 Hugging Face Hub 下载到服务器本地目录。

安装：

```bash
pip install -U huggingface_hub
```

方式一：CLI 下载 Apache 权重。

```bash
mkdir -p ~/models/mapanything
hf download facebook/map-anything-apache --local-dir ~/models/mapanything/map-anything-apache
```

方式二：Python 下载 Apache 权重。

```bash
python - <<'PY'
from pathlib import Path
from huggingface_hub import snapshot_download

snapshot_download(
    repo_id="facebook/map-anything-apache",
    local_dir=str(Path.home() / "models/mapanything/map-anything-apache"),
    local_dir_use_symlinks=False,
)
PY
```

如果要下载研究版：

```bash
hf download facebook/map-anything --local-dir ~/models/mapanything/map-anything
```

注意：如果服务器无法直接访问 Hugging Face，可以在本地或其他可联网机器下载后，用 `rsync/scp` 传到服务器。

```bash
rsync -avP ~/models/mapanything/ USER@SERVER:~/models/mapanything/
```

## 第一次 smoke test

准备一组输入图片：

```text
~/datasets/solar_scene/images/
├── 0001.jpg
├── 0002.jpg
├── 0003.jpg
└── ...
```

建议先用手机拍摄静态桌面/教室/校园角落：

- 10-30 张图即可。
- 尽量绕着目标区域拍。
- 不要大幅运动模糊。
- 场景里最好有纹理丰富的桌面、书、墙角、地面线条。

运行官方图片 demo 并保存 GLB：

```bash
cd ~/projects/map-anything
conda activate mapanything

python scripts/demo_images_only_inference.py \
  --image_folder ~/datasets/solar_scene/images \
  --apache \
  --save_glb \
  --output_path ~/datasets/solar_scene/outputs/mapanything_scene.glb
```

如果要导出 COLMAP 格式：

```bash
python scripts/demo_colmap.py \
  --images_dir ~/datasets/solar_scene/images \
  --output_dir ~/datasets/solar_scene/outputs/colmap_mapanything \
  --apache \
  --save_glb
```

预期输出类似：

```text
outputs/
├── mapanything_scene.glb
└── colmap_mapanything/
    ├── images/
    └── sparse/
        ├── cameras.bin
        ├── images.bin
        ├── points3D.bin
        └── points.ply
```

这些就是后续接 Three.js 的核心资产。

## 本项目后端需要整理出的标准文件

MapAnything 原始输出不应直接绑死前端。我们需要额外写一个转换脚本，把结果规整成前端稳定格式：

```text
data/outputs/<scene_id>/
├── scene.json
├── scene.glb
├── pointcloud.ply
├── cameras.json
├── depth/
│   ├── 0001.png
│   └── ...
└── preview.mp4
```

`scene.json` 建议格式：

```json
{
  "id": "desk_lab_recon",
  "title": "桌面实验台重建样例",
  "unit": "meter",
  "geometry": {
    "glb": "scene.glb",
    "pointcloud": "pointcloud.ply",
    "cameras": "cameras.json",
    "depthDir": "depth"
  },
  "anchor": {
    "position": [0, 0, 0],
    "rotation": [0, 0, 0],
    "scale": 1
  },
  "animationPath": [
    [-1.2, 0.2, 0.4],
    [0.0, 0.6, 0.0],
    [1.2, 0.2, -0.4]
  ],
  "virtualObjects": {
    "sun": { "radius": 0.35 },
    "earth": { "orbitRadius": 1.2, "radius": 0.12 },
    "moon": { "orbitRadius": 0.28, "radius": 0.04 }
  }
}
```

`cameras.json` 建议格式：

```json
[
  {
    "frame": "0001.jpg",
    "width": 1280,
    "height": 720,
    "K": [[800, 0, 640], [0, 800, 360], [0, 0, 1]],
    "cam2world": [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
    "time": 0
  }
]
```

前端只依赖这些标准文件，不依赖 MapAnything 的内部 tensor 名称。

## 可选补充：MoGe-2 单图兜底

如果只有一张图，MapAnything 多图优势发挥不出来，可以用 MoGe-2 做单图 metric geometry。

- 代码仓库：https://github.com/microsoft/MoGe

拉取：

```bash
cd ~/projects
git clone https://github.com/microsoft/MoGe.git
cd MoGe
conda create -n moge python=3.11 -y
conda activate moge
pip install -e .
```

推理并导出 maps / GLB / PLY：

```bash
moge infer \
  -i ~/datasets/solar_scene/single_image.jpg \
  --o ~/datasets/solar_scene/outputs/moge_single \
  --maps \
  --glb \
  --ply \
  --fp16
```

MoGe-2 输出 `points / depth / mask / normal / intrinsics`，适合做单图遮挡和落地感。

## 可选补充：GSplat 加分项

如果 MapAnything 主线跑通后还有时间，再考虑 3D Gaussian Splatting。

- gsplat 仓库：https://github.com/nerfstudio-project/gsplat

MapAnything 可以导出 COLMAP 格式，gsplat 可以读取 COLMAP capture 训练 Gaussian Splatting。这个方向视觉效果强，但调环境和训练更耗时，不建议作为第一阶段主线。

安装：

```bash
pip install gsplat
```

或源码安装：

```bash
pip install git+https://github.com/nerfstudio-project/gsplat.git
```

## 可选补充：COLMAP

如果后续要做传统 SfM/MVS 对比，或者要让报告里有经典几何基线，可以安装 COLMAP。

- 仓库：https://github.com/colmap/colmap
- 安装文档：https://colmap.github.io/install.html

但第一阶段不强制。MapAnything 自己已经能导出 COLMAP 格式，足够支撑课程演示。

## 服务器上需要下载的清单

第一阶段必需：

```text
代码：
https://github.com/facebookresearch/map-anything

权重：
https://huggingface.co/facebook/map-anything-apache

基础依赖：
conda/mamba
Python 3.12
PyTorch + CUDA
huggingface_hub
ffmpeg
git/git-lfs
build-essential/cmake/ninja
```

第二阶段可选：

```text
MoGe-2 单图兜底：
https://github.com/microsoft/MoGe

GSplat 加分项：
https://github.com/nerfstudio-project/gsplat

COLMAP 经典基线：
https://github.com/colmap/colmap
https://colmap.github.io/install.html

研究版 MapAnything 权重：
https://huggingface.co/facebook/map-anything
```

## 建议执行顺序

1. 服务器先跑通 `nvidia-smi`。
2. 安装 MapAnything 基础环境。
3. 下载 `facebook/map-anything-apache`。
4. 用 10-30 张手机图跑 `demo_images_only_inference.py`，先拿到 `mapanything_scene.glb`。
5. 跑 `demo_colmap.py --save_glb`，拿到 `points.ply / cameras.bin / images.bin`。
6. 写转换脚本，生成本项目标准的 `scene.json / cameras.json / pointcloud.ply / scene.glb`。
7. Three.js 前端读取 `scene.json`，把太阳系锚定到重建场景。
8. 如果效果不够稳，补 MoGe-2 单图兜底。
9. 如果时间够，再做 gsplat 加分项。

## 风险点

- Hugging Face 下载可能需要服务器能访问外网；不能访问就本地下载后传服务器。
- MapAnything 官方不固定 PyTorch/CUDA 版本，服务器 torch 安装要按实际驱动选择。
- `pip install -e ".[all]"` 依赖重，先不要装。
- 真实输入质量很关键，手机拍摄要保证视角覆盖和清晰纹理。
- 前端不要直接读研究仓库内部输出，要用我们自己的 `scene.json` 作为稳定边界。
