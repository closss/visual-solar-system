export type HeritageModelKind = 'ply' | 'stl' | 'glb' | 'procedural';

export interface HeritageArtifact {
  id: string;
  orbitRole: string;
  title: string;
  subtitle: string;
  period: string;
  body: string;
  details: string[];
  image?: string;
  source: string;
  reconstructionViews?: number;
  reconstructionQuality?: 'standard' | 'experimental';
  model: {
    kind: HeritageModelKind;
    path?: string;
    variant?: 'bronze-tree' | 'dugu-seal' | 'terracotta' | 'moai';
    representation?: 'mesh' | 'point-cloud';
    pointSize?: number;
    pointCount?: number;
    color: number;
    accent: number;
    size: number;
  };
  orbitRadius: number;
  orbitSpeed: number;
  spinSpeed: number;
}

export const featuredReconstructionIds = [
  'nefertiti',
  'apollo-11-command-module',
  'hoa-hakananai-a',
  'incense-burner',
] as const;

export const heritageArtifacts: HeritageArtifact[] = [
  {
    id: 'nefertiti',
    orbitRole: '太阳',
    title: 'Nefertiti Bust',
    subtitle: '36 视角彩色点云重建',
    period: '古埃及第十八王朝，约公元前 1345 年',
    body: '该结果由公开三维模型统一渲染 36 个环绕视角，再经 MapAnything 估计相机、深度和稠密点云。遮罩过滤摄影棚后，头冠、面部和胸像底座均保留了完整体积。',
    details: ['输入覆盖 3 个俯仰角，每层 12 个方位角，避免单视角重建常见的平面塌缩。', '浏览器资产从约 309 万点确定性降采样到 40 万点，保留 RGBA 顶点颜色。', '这是当前最稳定的彩色点云结果，作为太阳系中心样例展示。'],
    source: 'MapAnything 36-view reconstruction from uniformly rendered Nefertiti model views; object-only mask filtering',
    reconstructionViews: 36,
    reconstructionQuality: 'standard',
    model: {
      kind: 'glb',
      path: '/heritage/recon/nefertiti-object-lite.glb',
      representation: 'point-cloud',
      pointSize: 0.018,
      pointCount: 400000,
      color: 0xd7a372,
      accent: 0xffc56d,
      size: 1.08,
    },
    orbitRadius: 0,
    orbitSpeed: 0,
    spinSpeed: 0.18,
  },
  {
    id: 'fangyi',
    orbitRole: '水星',
    title: '青铜方彝',
    subtitle: '饕餮、蛇纹与鸟纹的西周礼器',
    period: '早期西周，约公元前 1100 年',
    body: '这件方彝是带盖青铜礼酒器，器身有饕餮、蛇纹、鸟纹和高起棱脊，内底与盖内有长篇铭文。它来自 Smithsonian / Freer Gallery 的真实 3D 扫描资产，本项目用该扫描模型渲染 12 个统一视角，再送入 MapAnything 离线重建。',
    details: ['馆藏号 F1930.54a-b，来源为中国，可能出自河南洛阳，现属 Freer Gallery of Art Collection。', '器物以建筑感很强的方形体量、屋顶式器盖和突出棱脊形成清晰轮廓，适合做多视角重建演示。', '这件替换掉原来的程序化印章样例，使内轨道也拥有真实文物扫描资产，而不是单图或近似几何。'],
    source: 'MapAnything 12-view reconstruction from Smithsonian 3D scan, Freer Gallery of Art object F1930.54a-b',
    reconstructionViews: 12,
    reconstructionQuality: 'standard',
    model: { kind: 'glb', path: '/heritage/recon/fangyi.glb', color: 0x6fc0a8, accent: 0xd9b06f, size: 0.66 },
    orbitRadius: 2.35,
    orbitSpeed: 0.58,
    spinSpeed: 1.8,
  },
  {
    id: 'cosmic-buddha',
    orbitRole: '金星',
    title: 'Cosmic Buddha',
    subtitle: '袈裟上的佛教宇宙图像',
    period: '北齐，550-577 年',
    body: '这尊石灰岩佛像的袈裟正反面刻有佛传故事与宇宙图像，胸前包含须弥山和龙蛇等意象。它来自 Smithsonian / Freer Gallery 的 CC0 3D 扫描资产，本项目用该扫描模型渲染 12 个统一视角，再送入 MapAnything 做离线重建。',
    details: ['馆藏全名为 Buddha draped in robes portraying the Realms of Desire / Existence，产地为中国河南安阳。', '文物头部和双手已佚，但袈裟上的浅浮雕仍能呈现天、人间、地狱等佛教宇宙层级。', '作为木星，它承担最大行星角色，也更适合说明“真实公开 3D 扫描 -> 多视角输入 -> AI 重建 -> Web 3D 展示”的完整链路。'],
    source: 'MapAnything 12-view reconstruction from Smithsonian 3D laser scan, Freer Gallery of Art object F1923.15, CC0',
    reconstructionViews: 12,
    reconstructionQuality: 'standard',
    model: { kind: 'glb', path: '/heritage/recon/cosmic-buddha.glb', color: 0xd6b36a, accent: 0xffefbd, size: 1.12 },
    orbitRadius: 3.95,
    orbitSpeed: 0.2,
    spinSpeed: 0.56,
  },
  {
    id: 'apollo-11-command-module',
    orbitRole: '地球',
    title: 'Apollo 11 Command Module',
    subtitle: '登月任务返回舱的彩色点云重建',
    period: '1969 年，美国国家航空航天博物馆藏品',
    body: 'Apollo 11 Command Module 纹理丰富、结构稳定，适合展示从高质量公开模型生成多视角图，再经 MapAnything 重建成彩色点云的流程。',
    details: ['输入同样使用 36 个统一视角，遮罩后只保留返回舱本体。', '原始重建约 237 万点，前端版本降采样为 40 万点。', '返回舱表面的烧蚀纹理和舱窗细节在点云中保留较好，是新资产中最适合远景展示的对象。'],
    source: 'MapAnything 36-view reconstruction from uniformly rendered Apollo 11 Command Module views; object-only mask filtering',
    reconstructionViews: 36,
    reconstructionQuality: 'standard',
    model: {
      kind: 'glb',
      path: '/heritage/recon/apollo-11-command-module-object-lite.glb',
      representation: 'point-cloud',
      pointSize: 0.017,
      pointCount: 400000,
      color: 0xc48f65,
      accent: 0xf1c28d,
      size: 0.95,
    },
    orbitRadius: 5.55,
    orbitSpeed: 0.15,
    spinSpeed: 0.32,
  },
  {
    id: 'hoa-hakananai-a',
    orbitRole: '火星',
    title: "Hoa Hakananai'a",
    subtitle: '拉帕努伊石像的 36 视角点云',
    period: '约公元 13-16 世纪',
    body: "Hoa Hakananai'a 的正面轮廓和背面雕刻都很清楚，多视角输入覆盖完整侧面，重建结果比旧的程序化 Moai 占位更稳定。",
    details: ['输入视角包含正面、侧面和背部，能观察石像的整体体块。', '原始重建约 161 万点，前端版本降采样为 40 万点。', '该资产替换旧 Moai，占用更少但文化语义更明确。'],
    source: "MapAnything 36-view reconstruction from uniformly rendered Hoa Hakananai'a views; object-only mask filtering",
    reconstructionViews: 36,
    reconstructionQuality: 'standard',
    model: {
      kind: 'glb',
      path: '/heritage/recon/hoa-hakananai-a-object-lite.glb',
      representation: 'point-cloud',
      pointSize: 0.019,
      pointCount: 400000,
      color: 0x7b7670,
      accent: 0xc5b9aa,
      size: 0.9,
    },
    orbitRadius: 7.05,
    orbitSpeed: 0.11,
    spinSpeed: 0.26,
  },
  {
    id: 'incense-burner',
    orbitRole: '木星',
    title: 'Tripod Incense Burner',
    subtitle: '三脚香炉的 36 视角点云',
    period: '历史器物公开三维模型',
    body: '三脚香炉的孔洞、兽形装饰和三足结构在多视角输入里辨识度较高，适合替换旧的低质量占位对象。',
    details: ['输入图中器身、足部和侧面装饰都有明显纹理。', '原始重建约 157 万点，前端版本降采样为 40 万点。', '细小孔洞仍会有少量浮点，但整体比旧程序化和基准模型更适合课程展示。'],
    source: 'MapAnything 36-view reconstruction from uniformly rendered tripod incense burner views; object-only mask filtering',
    reconstructionViews: 36,
    reconstructionQuality: 'standard',
    model: {
      kind: 'glb',
      path: '/heritage/recon/incense-burner-object-lite.glb',
      representation: 'point-cloud',
      pointSize: 0.016,
      pointCount: 400000,
      color: 0xb8885d,
      accent: 0xe2bb86,
      size: 0.78,
    },
    orbitRadius: 8.45,
    orbitSpeed: 0.08,
    spinSpeed: 0.22,
  },
];
