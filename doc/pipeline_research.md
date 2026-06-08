# 2025–2026 开源 3D 场景重建与增强现实几何后端调研

## 执行摘要

如果把你的期末大作业目标拆开看，真正决定成败的不是“是否最前沿”，而是能否**稳定地产出相机、深度、点云，并且容易落到 Three.js**。按这个标准，最适合作为主后端的不是 dynamic 3DGS，也不是 3D-aware VLM，而是**前馈式几何主干模型**：优先选 **MapAnything**，因为它直接给出统一格式的 `pts3d / depth / intrinsics / camera_poses`，还能原生导出 **COLMAP** 和 **GLB**；如果你接受非商业/受控权重，则 **VGGT-Ω** 是质量优先的强力替代，它官方 demo 直接支持图像或视频输入，并把深度反投影点云和相机可视化成 **GLB**。对单张图输入，**MoGe-2** 是最“工程友好”的补位方案，因为它直接输出**metric point map、depth、normal、intrinsics**，并且官方 CLI 就能导出 **maps / GLB / PLY**。citeturn11view0turn19view4turn19view6turn18view0turn29view2turn11view10turn38view0turn38view3

对你的作业题目“把太阳、地球、月亮放进真实场景并沿路径运动”而言，真正需要的是：**稳定世界坐标系、可用的相机位姿、用于遮挡的深度/粗几何、以及前端可消费的数据格式**。因此，dynamic 3DGS 适合作为**加分演示层**，但不适合做主后端；3D-aware VLM 更偏**空间理解/问答/语义推理**，目前也不如几何模型那样直接输出 Three.js 友好的显式结果。最稳的方案是“**几何 backbone + 可选 3DGS bonus**”。citeturn23view7turn11view5turn24view0turn29view4turn29view3

## 前馈三维重建主干

这一组模型最值得做主线，因为它们离你的目标最近：输入图像/多图/视频，直接给出相机与几何，不必走传统 COLMAP+MVS 的长链路。

| 工作 | 论文与官方资源 | 开源、权重、许可证 | 输入与输出 | Linux 部署、速度、适配判断 |
|---|---|---|---|---|
| **VGGT-Ω** | **CVPR 2026 Oral**；官方 GitHub / 项目页 / arXiv 见引文。项目页明确它在静态与动态场景上都做了增强，且训练效率相比前代显著提升。citeturn11view1turn29view2 | 代码开源；权重需在 Hugging Face **request access** 后下载；代码/权重受 **FAIR Noncommercial Research License** 约束，课程非商业展示可用，但不适合作商业部署。citeturn18view5turn13view0 | 官方 quick start 直接从图片列表推理，输出 `depth`，并通过 `encoding_to_camera` 得到 `extrinsics / intrinsics`；官方 demo 还说明可接受**上传图片或视频**，并把**反投影点云 + 相机**可视化为 **GLB**。citeturn18view4turn18view0 | 安装相对简单，主要是 `pip install -r requirements.txt && pip install -e .`；512 分辨率下，官方给出 **500 帧约 43.15GB** 峰值显存，单张 48GB 卡就能跑数百帧，且是**单次前向**、无 per-scene optimization。对课设支撑程度是**很高**：相机和深度齐全，前端集成路径直接。主要风险是**权重受控**、**许可证非商业**。citeturn18view4turn18view0 |
| **VGG-T³** | **CVPR 2026**；官方 GitHub / 项目页 / arXiv 见引文。核心卖点是把离线前馈重建从传统的二次复杂度压到**线性复杂度**。citeturn21view0turn29view1 | 代码和模型已放出，但采用 **NVIDIA OneWay Noncommercial License**；训练 harness 已开源，但 README 明确说**数据实现与预处理代码尚未完整放出**。citeturn21view0 | 与 VGGT API 兼容；官方 `infer()` 输出 `pose`、`intrinsics`、`pts3d`、`conf`、`depth`，支持图像集合，也提供视频 demo。citeturn21view0 | 安装需要特定 torch/cu126 组合；优点是对大图集很强，README 直接给出“**1k images < 1 minute vs. 10 minutes for VGGT**”。如果你只有 5–20 张图，它的优势还体现不充分；若你以后想扩展到旅游照级别多视图，它很有价值。主要风险是**太新**、**训练链未完全公开**、**许可证非商业**。citeturn21view0turn29view1 |
| **MapAnything** | **3DV 2026**；官方 GitHub / 项目页 / arXiv 见引文。它不是只做某一项任务，而是一个**统一的 metric 3D reconstruction framework/model**。citeturn30view0turn11view0 | 代码 **Apache-2.0**；权重同时提供 **CC-BY-NC 4.0** 与 **Apache-2.0** 两个版本，README 还明确给出“研究/学术优先用 `facebook/map-anything`，商业友好用 `facebook/map-anything-apache`”。课程项目里，**Apache 权重版本最省心**。citeturn12view0 | 输入可以是**纯图像**，也可以附带 `intrinsics / poses / depth`；输出统一为 `pts3d`、`pts3d_cam`、`depth_z`、`depth_along_ray`、`intrinsics`、`camera_poses` 等；并且可以**导出 COLMAP** 与 **GLB**。citeturn19view4turn19view6 | 安装相对干净，`pip install -e .` 即可；memory-efficient 模式官方称可把 `minibatch_size=1` 跑到 **140GB 上 2000 views**，并且速度损失很小。它对 Three.js 接口尤其友好，因为输出最完整、格式最统一，还能直接走 COLMAP/GSplat 链路。我把它评为**最推荐主后端**。主要风险是模型本身仍较新，生态不如 DA/MoGe 老练。citeturn19view6turn12view0turn19view7 |
| **CUT3R** | **CVPR 2025 Oral**；官方 GitHub / 项目页 / arXiv 见引文。CVPR 摘要强调它可接收**video streams 或 unordered photo collections**，同时适用于静态和动态内容。citeturn11view3turn8search9 | 代码开源，权重通过 Google Drive 提供；仓库 LICENSE 写明是 **CC BY-NC-SA 4.0**。citeturn16view1turn17view0 | 官方更强调**连续 pointmap reconstruction** 与持续状态；repo 可下载 checkpoint、本地跑 demo，但显式前端友好的文件导出接口不如 MapAnything/MoGe 那么现成。citeturn11view3turn16view1 | 安装中等偏难：Python 3.11、PyTorch CUDA 12.1、`gsplat/open3d/evo`、RoPE CUDA kernel 编译都要处理。优点是对**连续视频**非常有吸引力；缺点是前端“落盘格式”需要你自己补。适合做**视频路线的备选主干**，不适合当最省事的第一选择。citeturn16view1 |
| **π³ / Pi3X** | **ICLR 2026**；官方 GitHub / 项目页 / arXiv / HF 见引文。Pi3X 是 2025 年底的工程升级版。citeturn31view0turn9search5 | 代码 **BSD-3-Clause**；模型权重 **CC BY-NC 4.0**，也就是课程/非商业 OK，但商用不行。citeturn31view0 | 可直接吃**图像文件夹或 mp4**；Pi3X 还支持条件注入 `poses / intrinsics / depth`；输出有 `points`、`local_points`、`conf`、`camera_poses`，官方脚本直接保存 `.ply`。citeturn31view0 | 部署难度中等，`pip install -r requirements.txt` 即可起步；无需 per-scene optimization。它的长处是**输入顺序鲁棒**、对稀疏多图友好；短板是权重非商业，而且 metric scale 仍是“approximate metric scale reconstruction”。如果你想做“5–20 张手机图”的稀疏重建，它是很值得保留的强备选。citeturn31view0 |
| **MASt3R-SLAM** | **CVPR 2025**；官方 GitHub / 项目页 / arXiv 见引文。它不是 foundation model 本体，但属于 **DUSt3R/MASt3R 最实用的 2025 跟进路线**。citeturn32view0 | 仓库 LICENSE 为 **CC BY-NC-SA 4.0**；它还依赖 MASt3R checkpoint。citeturn33view0turn32view0 | 官方支持 **MP4 视频或 RGB 图像文件夹**；如果已知相机内参，可以额外传 `intrinsics.yaml`，也就是**标定可选**。citeturn32view0 | 部署复杂度中高，但工程成熟度不错；官方说明实验运行在 **RTX 4090** 上，并给出完整数据集/评测脚本。它特别适合你的“**10 秒手机视频**”场景，因为它天然是 video-first 的 dense SLAM 路线。主要风险仍然是**非商业许可证**和需要更多系统调试。citeturn32view0turn33view0 |

综合看，**MapAnything** 是“课程工程友好度”最好的主干；**VGGT-Ω** 是“质量优先”的强替代；**CUT3R / MASt3R-SLAM** 更适合你把输入固定在**短视频**；**π³/Pi3X** 是“少量无序照片 + 需要点云/相机输出”的优秀备选。citeturn19view4turn19view6turn18view0turn32view0turn31view0

## 3DGS 与视频重建

这类方法更适合做“**wow effect**”。你如果要在答辩时展示一个可以绕看的真实场景、再把太阳系叠进去，它们会很加分；但把它们直接当主后端，往往会比前馈几何主干更折腾。

| 工作 | 论文与官方资源 | 开源、权重、许可证 | 输入与输出 | Linux 部署、速度、适配判断 |
|---|---|---|---|---|
| **InstantSplat++** | 截至 **2026-06-06**，我能确认到的是**官方 GitHub 工程仓库**；README 把它描述为对 InstantSplat 的改进扩展，但**没有像正式论文那样在 README 里单列独立会议/期刊信息**。更像一个 2026 年的工程增强版。citeturn11view4 | 核心仓库 LICENSE 是 **Apache-2.0**，但 README/LICENSE 又明确提示它使用了 **DUSt3R/MASt3R** 等第三方先验，相关依赖可能触发 **CC BY-NC-SA 4.0** 约束。citeturn15view0turn14view3 | 它保留了 InstantSplat 的思路，支持 **3D-GS / 2D-GS / Mip-Splatting**；可用 **VGGT / MapAnything** 作为 prior，也可直接拉 MASt3R checkpoint。仓库命令是 `train + render` 或 `train + evaluate`，说明它仍是**per-scene optimization pipeline**。citeturn25view0turn25view1turn25view2turn25view3 | 部署复杂度高：Python 3.10、CUDA 12.1、多套 CUDA submodules 编译、NumPy/Opencv 版本约束都要管。它很适合做**加分项**：先用 MapAnything/VGGT 给出相机与几何，再让 InstantSplat++ 产出 splat 结果；但不建议它做第一主线。citeturn25view4turn25view5 |
| **StreamSplat** | **ICLR 2026**；官方 GitHub / 项目页 / arXiv 见引文。它的核心卖点是把**未标定视频流**在线变成**dynamic 3DGS**。citeturn11view5turn23view7 | 代码已公开、预训练 checkpoint 用 Google Drive 发放；但截至我检索时，GitHub 根目录**没有清晰展示独立 LICENSE 文件/许可证说明**，因此许可证应视为**待确认**。citeturn23view4turn23view7 | 官方概述明确写了：**feed-forward**、**uncalibrated monocular videos**、**dynamic scene modeling**、**no per-scene optimization**。但当前官方 inference 还要求你提前提供 `input_depths_path`，并且 README 要求深度先用 **Depth Anything V2** 预计算。citeturn23view7turn23view3 | 对“动态真实场景 + 动态 splat”非常有吸引力；但你这个作业本身并不要求把真实场景建成动态 4D，更多只是向真实场景里插入三颗虚拟天体，所以它有点**能力过剩**。如果你一定要做“手机视频直接出 dynamic 3DGS”，它是 2026 年最值得关注的开源方向之一。citeturn23view7 |
| **VidSplat** | **SIGGRAPH 2026**；官方 GitHub / 项目页 / arXiv 见引文。它用几何引导的视频扩散先验来补足稀疏视角，目标是从极少输入图恢复更完整的场景。citeturn24view0 | GitHub 仓库挂了 **Apache-2.0**；但 README 明确写着 **“Code coming soon”**，所以虽然仓库在，真正可复现代码并未放出。citeturn24view0 | 论文摘要与 README 强调它对**5 视图甚至单视图**都能做更完整的 scene completion；但当前缺乏可直接落地的 official code。citeturn24view0 | 这是非常好的**报告讨论对象**，也是稀疏视图 generative reconstruction 的代表；但就“现在就把它装到 Linux 服务器做课设”而言，结论很直接：**不适合当主方案**。citeturn24view0 |

这一组里，真正适合你当前课设工程的排序是：**InstantSplat++ 作为 bonus > StreamSplat 作为“想做动态视频 3DGS”的实验项 > VidSplat 作为报告中的前沿讨论**。citeturn11view4turn23view7turn24view0

## 深度与几何补全

这一组模型的价值在于：**单图/单视频就能给你足够稳定的遮挡、落地、粗几何**。如果老师更看重“演示稳定”和“工程闭环”，它们往往比炫技 3DGS 更实用。

| 工作 | 论文与官方资源 | 开源、权重、许可证 | 输入与输出 | Linux 部署、速度、适配判断 |
|---|---|---|---|---|
| **Depth Anything V2** | **NeurIPS 2024**；官方项目页 / GitHub / arXiv 见引文。虽然不是 2025–2026 新作，但它仍是大量 2025–2026 方法的深度基石。citeturn11view6turn29view6 | 仓库开源；**Small** 权重是 **Apache-2.0**，**Base/Large/Giant** 是 **CC-BY-NC-4.0**。citeturn40view4turn40view5 | 输入单张 RGB；官方 `infer_image()` 直接输出 `HxW` 深度图。README 还提供 metric depth 分支链接，但主仓默认是**单目深度**而非完整相机/点云后端。citeturn40view1turn40view2turn40view3 | 它最大的优点是**稳、轻、生态成熟**；项目页还强调其相较 SD-based 模型**更轻、更快，约快 10x**。缺点也同样明显：对你的课设来说，它更适合做**遮挡图/深度提示**，不适合单独承担相机与世界坐标恢复。citeturn41view1turn41view0 |
| **Video Depth Anything** | **CVPR 2025 Highlight**；官方项目页 / GitHub / arXiv 见引文。citeturn29view5turn11view7 | 仓库根目录标注 **Apache-2.0**。citeturn12view6 | 输入视频，目标是输出**长视频一致深度**；项目页明确写它可以处理**arbitrarily long videos**。2025 年又进一步放出了**metric depth models**。citeturn29view5turn11view7 | 这是“10 秒手机视频做稳定遮挡”的非常强选项。官方表里给出：FP16 下 `Small` 约 **7.5ms / 6.8GB**，`Large` 约 **14ms / 23.6GB**。缺点是它**不输出相机位姿**，所以最好与 MapAnything/CUT3R/MASt3R-SLAM 搭配，而不是单独使用。citeturn11view7 |
| **MoGe-2** | **NeurIPS 2025**；官方 GitHub / Microsoft Research / arXiv 见引文。citeturn10search5turn11view10 | 代码 **MIT**；预训练模型在 Hugging Face 公开可下。README 没有像 DA V2 那样细分“各权重许可证”，但代码许可很宽松。citeturn12view9turn38view1turn38view7 | 单图输入；`infer()` 输出 `points`、`depth`、`mask`、`normal`（可选）和 `intrinsics`，而且 **MoGe-2 的 point map 是 metric scale**。CLI 还能直接导出 `maps / glb / ply`。citeturn38view0turn38view3 | 对单图路线几乎是“现成答案”：你前端如果只要做一张真实场景图上的遮挡、落地、路径动画，MoGe-2 是我最推荐的**单图几何后端**。主要风险不是算法，而是单图重建本身的上限：全局结构仍不如多图/视频。citeturn38view0turn38view4 |
| **UniDepthV2** | **2025 arXiv under submission**；官方 GitHub / arXiv / HF 见引文。citeturn39view0 | 仓库代码及模型整体受 **CC BY-NC 4.0** 约束。citeturn39view0 | 单图输入；可直接给出**metric depth**、`points`（相机坐标点云）和内参预测。README 还总结了 V2 的变化：**confidence、faster inference、ONNX support、新相机支持**。citeturn39view0 | 它比 DA V2 更像“几何工具”，比 MoGe-2 更像“通用 metric depth backbone”。如果你想要**单图 metric depth + intrinsics**，但又希望生态更贴近深度估计社区，UniDepthV2 很合适。主要风险是**非商业许可**，以及它仍偏“深度/点云”，不是完整场景重建总线。citeturn39view0 |

如果你的输入非常少，经验上可这样选：**单图首选 MoGe-2**，因为它直接给 metric 点图、深度、法线和内参；**短视频深度首选 Video Depth Anything**，因为它追求长时间一致性；**Depth Anything V2** 更适合作为魔改容易、部署最轻的深度补件；**UniDepthV2** 是介于 MoGe-2 和 DA V2 之间的强设定。citeturn38view0turn11view7turn41view1turn39view0

## 3D-aware VLM 与空间理解

这一组模型很新，但对你这个课设要区分清楚：它们**不是不会做 3D**，而是它们的主目标越来越偏向**空间理解与推理**，并不天然等于“理想的 AR 几何后端”。

| 工作 | 论文与官方资源 | 开源、权重、许可证 | 输入与输出 | 适合作为 AR 主后端吗 |
|---|---|---|---|---|
| **G²VLM** | **CVPR 2026**；官方 GitHub / 项目页 / arXiv / Model 见引文。项目页明确写它统一了**3D reconstruction + spatial reasoning**。citeturn11view8turn29view4 | 仓库 README 明确写 **Apache 2.0**，并提供 Hugging Face checkpoint 下载方法。citeturn12view7turn34view2 | 既能跑 `inference_chat.py` 做空间问答，也能跑 `inference_recon.py` 对图像文件夹做重建，并把结果保存成 `.ply`。citeturn34view0turn34view3 | 我不建议把它当**唯一**几何主后端：它有重建能力，但产品设计重心明显是“统一重建与推理”。如果你希望答辩时加一个“智能解释场景空间关系”的亮点，它非常合适；如果只求稳定产出 `depth / pose / point cloud / mesh`，MapAnything/MoGe-2 更直接。citeturn29view4turn34view2 |
| **VLM-3R** | **CVPR 2026**；官方 GitHub / 项目页 / arXiv / 数据集见引文。它强调的是**monocular video 3D understanding**。citeturn11view9turn29view3 | 代码许可证是 **Apache 2.0**，但其 license 文本同时提醒 DUSt3R/CUT3R 依赖的非商业约束；推理还依赖 **LLaVA-NeXT-Video-7B-Qwen2** 基座和 LoRA 权重。citeturn36view0turn35view0 | 官方测试命令以**视频/多图 + LoRA checkpoint + 大语言视觉基座**为主；仓库重点是 instruction tuning、benchmark 和特征抽取，不像几何模型那样直接主打 `ply/glb/colmap` 输出。训练侧还提供了 `--gpu-ids 0,1,2,3` 的多卡特征抽取示例。citeturn35view0turn35view3 | 结论很明确：**不适合做你的主几何后端**。它更适合“空间问答助手”“讲解型 demo”“报告中的前沿方向”，而不是把太阳地月稳定插进真实场景所需的核心几何管线。citeturn29view3turn35view4 |

所以，**G²VLM 可以当语义加分模块，VLM-3R 更适合写进报告的 related work，而不适合当主重建引擎**。citeturn29view4turn29view3

## 排序推荐与场景化结论

**A. 最推荐作为本项目主后端的方案**  
我建议把 **MapAnything Apache 权重路线** 放在第一位：它的统一 metric 输出、原生 `COLMAP / GLB` 导出、Apache 代码与 Apache 权重选项、以及对多输入模态的兼容性，都非常适合课程项目做成一个**可复现、可解释、可交付**的后端。如果你更偏质量，并且接受非商业与权重申请流程，那么把主干替换成 **VGGT-Ω** 也很合理；只是从工程闭环角度，MapAnything 更像“产品级工具箱”，VGGT-Ω 更像“高性能研究模型”。单图 fallback 则直接接上 **MoGe-2**。citeturn12view0turn19view4turn19view6turn18view0turn13view0turn38view0

**B. 最适合作为加分项的方案**  
如果你想多拿“视觉效果分”，最推荐的是 **InstantSplat++**：先用 MapAnything/VGGT-Ω 解决相机和粗几何，再让 InstantSplat++ 做更漂亮的 splat 结果；如果你的真实输入本身是**动态视频**，则 **StreamSplat** 是 2026 年更前沿的加分项。**VGG-T³** 也属于加分型候选：它很强，但对你当前“5–20 张图 / 10 秒视频”的场景并不是最必要。citeturn25view2turn25view3turn23view7turn21view0

**C. 不推荐采用但可以在报告中讨论的方案**  
**VidSplat** 现在更适合写进报告，而不是现在就装进服务器跑；**VLM-3R** 与 **G²VLM** 也更适合当“空间理解/问答增强层”，不适合作为核心几何后端。citeturn24view0turn29view3turn29view4

**如果只做离线演示，哪条路线最稳**  
最稳的是：**MapAnything Apache 权重 → 导出 `cameras.json + depth + pointcloud/GLB` → Three.js 前端做遮挡与路径动画**；单图时再加一条 **MoGe-2 fallback**。这是最少踩坑、最容易复现、也最容易解释给老师听的路线。若你只想展示视频连贯相机轨迹，可把 **MASt3R-SLAM** 作为视频支线。citeturn19view4turn19view6turn12view0turn38view0turn32view0

**如果服务器有 4 张 48GB GPU，哪些方案可行**  
这套硬件对大部分候选都很宽裕。**VGGT-Ω** 官方给出的 512 分辨率 500 帧峰值显存约 43.15GB，单张 48GB 卡就能跑数百帧；**MapAnything** 的 memory-efficient 模式官方称可把 2000 views 压到 140GB 级别；**Video Depth Anything Large** 在 FP16 下约 23.6GB；**VLM-3R** 的官方特征抽取示例甚至直接写了 `--gpu-ids 0,1,2,3`；**InstantSplat++ / MASt3R-SLAM / CUT3R / StreamSplat** 也都属于“可行但主要看你愿不愿调环境”的范畴。citeturn18view0turn19view6turn11view7turn35view3turn25view4turn32view0turn16view1turn23view7

**如果只有 5–20 张手机拍摄图片或一个 10 秒视频，哪些方案效果最好**  
5–20 张静态手机图：优先 **MapAnything / VGGT-Ω / Pi3X**；如果你想要 splat 视觉效果，再接 **InstantSplat++**。10 秒静态手持视频：优先 **MASt3R-SLAM** 或 **CUT3R** 做相机与几何，再用 **Video Depth Anything** 做时序稳定深度遮挡。单图则首选 **MoGe-2**。如果你真的拍的是动态真实场景并坚持要 dynamic 3DGS，才把 **StreamSplat** 放到主链路里。citeturn19view4turn18view0turn31view0turn25view2turn32view0turn8search9turn11view7turn38view0turn23view7

**对“把太阳、地球、月亮三个虚拟物体放入真实场景并沿路径运动”的支撑程度**  
真正高支撑的是那些能稳定输出**相机位姿 + 深度/点云**的方法：**MapAnything、VGGT-Ω、MASt3R-SLAM、CUT3R、Pi3X**。因为你需要的是一个可靠的世界坐标系、可用于遮挡的真实几何，以及可回放的相机。**Depth-only** 模型能解决遮挡，但不足以单独解决相机和路径对齐；**3DGS** 模型好看，但多半应服务于展示层；**3D-aware VLM** 更适合解释场景，不适合担任主几何内核。citeturn19view4turn18view0turn32view0turn8search9turn31view0turn11view7turn23view7turn29view4turn29view3

## Three.js 集成与数据落盘

对 Three.js 来说，**最稳的资产格式不是“研究代码内部 tensor”，而是前端常见的几类显式文件**：`depth.png`、`pointcloud.ply`、`cameras.json`、`scene.glb`，以及你自己定义的轻量 `scene.json`。Three.js 官方本身就有 **PLYLoader**、**GLTFLoader**、**ObjectLoader** 这些成熟入口。citeturn42search0turn42search1turn42search3

建议你把后端输出规范化成下面几层：

| 目标文件 | 推荐来源 | Three.js 接法 |
|---|---|---|
| `depth.png` / `depth.exr` | **Depth Anything V2 / Video Depth Anything / MoGe-2 / MapAnything / VGGT-Ω** 都能给深度；其中 MoGe-2、MapAnything、VGGT-Ω 更容易同时给相机。citeturn40view2turn11view7turn38view0turn19view4turn18view4 | 前端把它当 occlusion map 或反投影输入；建议保存成 **16-bit PNG** 或 EXR，而不是 8-bit 彩色图。 |
| `pointcloud.ply` | **MapAnything** 直接有 `pts3d`；**MoGe-2** 有 `points` 且 CLI 直接导出 `ply`；**Pi3X** 和 **G²VLM** 官方脚本也直接保存 `.ply`。citeturn19view4turn38view0turn38view3turn31view0turn34view3 | 用 **PLYLoader** 直接加载。citeturn42search0 |
| `cameras.json` | **MapAnything** 有 `intrinsics` 与 `camera_poses`；**VGGT-Ω** 能从 `pose_enc` 恢复 `extrinsics / intrinsics`；**Pi3X** 有 `camera_poses`。citeturn19view4turn18view4turn31view0 | 自己写一个很薄的 loader，把每帧 K、cam2world/world2cam、图像名、时间戳读进来即可。 |
| `scene.glb` | **MapAnything** 可 `--save_glb`；**VGGT-Ω** 官方 demo 已经把点云+相机可视化成 GLB；**MoGe-2** CLI 也支持 `--glb`。citeturn19view4turn18view0turn38view3 | 用 **GLTFLoader** 最稳。citeturn42search1 |
| `colmap/` 或 `splat` 相关目录 | **MapAnything** 原生支持 `--save_colmap`，并明确写了能对接 Gaussian Splatting；**InstantSplat++ / StreamSplat** 则天然属于 GS 链路。citeturn19view4turn19view6turn25view0turn23view7 | 如果你要网页端 splat，建议先**选定前端 viewer**，再按 viewer 的格式写转换器，因为 `.splat / splat.ply` 并没有像 glTF 那样统一。 |

工程上，我建议你把后端标准输出固定为下面两个 JSON，再按情况补 `ply/glb/depth`：

```json
[
  {
    "frame": "0001.png",
    "K": [[fx, 0, cx], [0, fy, cy], [0, 0, 1]],
    "cam2world": [[...4x4...]],
    "width": 1280,
    "height": 720,
    "time": 0.033
  }
]
```

上面这个可作为 `cameras.json`。如果模型给的是 `depth + intrinsics`，就能在后端反投影出点云；如果模型直接给 `pts3d/points`，那就更简单。MapAnything、MoGe-2、Pi3X 都已经把这些关键量定义得很清楚。citeturn19view4turn38view0turn31view0

```json
{
  "world": { "unit": "meter" },
  "geometry": {
    "pointcloud": "pointcloud.ply",
    "depth_dir": "depth/",
    "cameras": "cameras.json"
  },
  "anchors": {
    "sun":   { "position": [x1, y1, z1], "scale": s1 },
    "earth": { "position": [x2, y2, z2], "scale": s2 },
    "moon":  { "position": [x3, y3, z3], "scale": s3 }
  },
  "animation": {
    "earth_path": [[...], [...], [...]],
    "moon_path":  [[...], [...], [...]]
  }
}
```

上面这个 `scene.json` 建议你**自己定义**，不要依赖某个研究仓库的内部格式。后端只负责把“真实场景几何”和“虚拟天体锚点/路径”写进去，前端 Three.js 负责渲染、光照和动画。这样你们已经写好的 Three.js 太阳-地球-月亮演示几乎不用大改。这个设计尤其适合课程作业：结构清楚，答辩时也好讲。  

如果你最终选择 **MapAnything 主线**，那么最省事的文件流水线是：

`images / video → MapAnything → pts3d + intrinsics + camera_poses → pointcloud.ply + cameras.json + scene.glb → Three.js`

如果你选择 **单图演示**，则最省事的是：

`image → MoGe-2 → depth + points + intrinsics + glb/ply → Three.js`

如果你想加一个 **splat 加分项**，则把：

`MapAnything --save_colmap`  
或  
`VGGT-Ω / Pi3X / MASt3R-SLAM 导出的相机与点云`

继续喂给 **InstantSplat++ / GSplat** 即可。前者负责“稳”，后者负责“炫”。citeturn19view4turn19view6turn38view3turn25view2turn25view3