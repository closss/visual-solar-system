# 文物太阳系 · Visual Solar System

《计算机图形学》课程设计项目。基于 MapAnything 多视角三维重建 + Three.js Web 3D 渲染，将六件来自不同文明的博物馆文物以太阳系轨道模型进行可交互展示。

> 开源地址：https://github.com/closss/visual-solar-system

## 项目概览

```
多视角 RGB 图像 → MapAnything 离线重建（A6000 GPU） → GLB 点云 + 相机 JSON
                                                          ↓
                                              Three.js 文物太阳系 Web 3D 展示
```

- **后端**：MapAnything 通用前馈式三维重建模型，部署于单卡 NVIDIA A6000
- **前端**：Three.js + TypeScript + Vite，ACES 色调映射、PCF 软阴影、PBR 材质、后处理管线
- **展示**：六件文物沿六个轨道层级公转自转，点击检视、拖拽旋转、响应式布局

## 页面入口

| 页面 | 入口 | 说明 |
|------|------|------|
| 文物太阳系 | `index.html` | 主展示页，轨道动画 + 交互检视 |
| 重建结果查看器 | `reconstruction.html` | MapAnything 多视角重建 GLB 场景查看 |
| 单物体渲染器 | `object-render.html` | 512×512 离线渲染，多视角批量渲染 |

## 快速启动

```bash
npm install
npm run dev
```

打开 `http://127.0.0.1:5173/`。

## 已落地功能

- 六件文物三维模型（GLB 点云/网格），加载自 MapAnything 离线重建结果。
- 太阳系轨道层级：太阳（娜芙蒂蒂）、水星（方彝）、金星（宇宙佛）、地球（阿波罗指令舱）、火星（石像）、木星（熏炉）。
- 每件文物独立公转 + 自转，轨道可视化为发光环带。
- 点击进入检视模式：相机平滑推进、文物放大、侧边栏展示详细介绍。
- 检视模式下支持拖拽旋转文物，从任意角度观察细节。
- 星空粒子背景、指数雾效、PCF 软阴影。
- OrbitControls 相机交互（旋转/缩放/平移），响应式布局适配移动端。
- 重建结果查看器：独立页面展示 ScanNet 6 视角重建输出。

## 验证

```bash
npm test
npm run build
npm audit
```
