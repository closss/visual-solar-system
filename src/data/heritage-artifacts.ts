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
  model: {
    kind: HeritageModelKind;
    path?: string;
    variant?: 'bronze-tree' | 'dugu-seal' | 'terracotta' | 'moai';
    color: number;
    accent: number;
    size: number;
  };
  orbitRadius: number;
  orbitSpeed: number;
  spinSpeed: number;
}

export const heritageArtifacts: HeritageArtifact[] = [
  {
    id: 'sanxingdui-tree',
    orbitRole: '太阳',
    title: '三星堆青铜神树',
    subtitle: '古蜀文明的宇宙树意象',
    period: '商代晚期，约公元前 12-11 世纪',
    body: '青铜神树以树干、枝叶、神鸟和龙形构件组织出垂直宇宙结构，适合作为本系统的“太阳核心”：它本身就带有天地沟通和中心轴的象征。',
    details: ['四川广汉三星堆遗址出土的青铜神树是古蜀文明最具辨识度的器物之一。', '树形结构通常被解读为通天神树或太阳神话相关意象，兼具祭祀、宇宙观和权力象征。', '本项目用它作为太阳，是因为它天然具有“中心轴”和“光源”的叙事属性。'],
    image: '/heritage/images/sanxingdui_bronze_tree.jpg',
    source: 'MapAnything 12-view reconstruction from rendered Sanxingdui bronze tree inputs; reference image from Wikimedia Commons',
    model: { kind: 'glb', path: '/heritage/recon/sanxingdui-tree.glb', variant: 'bronze-tree', color: 0x9b6b32, accent: 0x5fd0a5, size: 1.45 },
    orbitRadius: 0,
    orbitSpeed: 0,
    spinSpeed: 0.16,
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
    model: { kind: 'glb', path: '/heritage/recon/fangyi.glb', color: 0x6fc0a8, accent: 0xd9b06f, size: 0.66 },
    orbitRadius: 2.15,
    orbitSpeed: 0.58,
    spinSpeed: 1.8,
  },
  {
    id: 'utah-teapot',
    orbitRole: '金星',
    title: 'Utah Teapot',
    subtitle: '计算机图形学经典测试模型',
    period: '1975 年，Martin Newell',
    body: 'Utah 壶是图形学里最著名的标准模型之一，被长期用于曲面建模、光照、材质和渲染算法测试。',
    details: ['Utah Teapot 源自真实茶壶建模，是早期三维图形学的经典测试对象。', '它有曲面、孔洞、把手和壶嘴，能暴露光照、法线和曲面细分中的很多问题。', '在本项目中它代表图形学传统本身，是从“物体模型”走向“重建展示”的桥梁。'],
    source: 'MapAnything 12-view reconstruction from rendered Utah Teapot inputs',
    model: { kind: 'glb', path: '/heritage/recon/utah-teapot.glb', color: 0xe0b45f, accent: 0xffffff, size: 0.78 },
    orbitRadius: 3.0,
    orbitSpeed: 0.42,
    spinSpeed: 1.2,
  },
  {
    id: 'stanford-bunny',
    orbitRole: '地球',
    title: 'Stanford Bunny',
    subtitle: '三维扫描与几何处理基准',
    period: '1994 年，Stanford 3D Scanning Repository',
    body: '斯坦福兔来自真实扫描数据，常用于网格简化、重建、配准、法线估计和渲染实验，是本项目“物体重建”叙事的核心样例。',
    details: ['Stanford Bunny 是最常见的三维扫描基准之一，几何细节适中，适合验证重建与渲染流程。', '它的耳朵、底部开口和曲面变化能体现模型完整性、尺度归一化和法线质量。', '在系统中它作为“地球”，承担最稳定、最容易解释的基准物体角色。'],
    source: 'MapAnything 12-view reconstruction from rendered Stanford Bunny inputs',
    model: { kind: 'glb', path: '/heritage/recon/stanford_bunny.glb', color: 0x8fd8ff, accent: 0xffffff, size: 0.62 },
    orbitRadius: 3.95,
    orbitSpeed: 0.34,
    spinSpeed: 0.96,
  },
  {
    id: 'stanford-dragon',
    orbitRole: '火星',
    title: 'Stanford Dragon',
    subtitle: '复杂曲面扫描模型',
    period: 'Stanford 3D Scanning Repository',
    body: '龙模型有更复杂的几何细节和遮挡结构，能展示重建算法面对复杂拓扑和高频表面时的挑战。',
    details: ['Stanford Dragon 有细长结构、局部遮挡和大量高频曲面，是比兔子更难的扫描对象。', '它适合展示重建算法在复杂外形上可能出现的破碎、错位和细节丢失问题。', '在轨道中作为火星，采用偏暖色调强化尖锐、复杂、富动态的视觉印象。'],
    source: 'MapAnything 12-view reconstruction from rendered Stanford Dragon inputs',
    model: { kind: 'glb', path: '/heritage/recon/stanford-dragon.glb', color: 0xdf6a4a, accent: 0xffd0a8, size: 0.78 },
    orbitRadius: 5.1,
    orbitSpeed: 0.27,
    spinSpeed: 0.74,
  },
  {
    id: 'cosmic-buddha',
    orbitRole: '木星',
    title: 'Cosmic Buddha',
    subtitle: '袈裟上的佛教宇宙图像',
    period: '北齐，550-577 年',
    body: '这尊石灰岩佛像的袈裟正反面刻有佛传故事与宇宙图像，胸前包含须弥山和龙蛇等意象。它来自 Smithsonian / Freer Gallery 的 CC0 3D 扫描资产，本项目用该扫描模型渲染 12 个统一视角，再送入 MapAnything 做离线重建。',
    details: ['馆藏全名为 Buddha draped in robes portraying the Realms of Desire / Existence，产地为中国河南安阳。', '文物头部和双手已佚，但袈裟上的浅浮雕仍能呈现天、人间、地狱等佛教宇宙层级。', '作为木星，它承担最大行星角色，也更适合说明“真实公开 3D 扫描 -> 多视角输入 -> AI 重建 -> Web 3D 展示”的完整链路。'],
    source: 'MapAnything 12-view reconstruction from Smithsonian 3D laser scan, Freer Gallery of Art object F1923.15, CC0',
    model: { kind: 'glb', path: '/heritage/recon/cosmic-buddha.glb', color: 0xd6b36a, accent: 0xffefbd, size: 1.12 },
    orbitRadius: 6.55,
    orbitSpeed: 0.2,
    spinSpeed: 0.56,
  },
  {
    id: 'armadillo',
    orbitRole: '土星',
    title: 'Armadillo',
    subtitle: '扫描角色模型与环结构展示',
    period: 'Stanford 3D Scanning Repository',
    body: 'Armadillo 是图形学社区常用扫描模型，外形辨识度高。本项目为它加入轨道环，承担“土星”的视觉角色。',
    details: ['Armadillo 是角色式扫描模型，包含肢体、头部和身体轮廓，比单一器物更接近复杂生物形态。', '它的 GLB 文件最大，能直观看出重建输出体积和前端加载压力之间的权衡。', '系统中给它加上土星环，让科学可视化隐喻和图形学资产结合起来。'],
    source: 'MapAnything 12-view reconstruction from rendered Armadillo inputs',
    model: { kind: 'glb', path: '/heritage/recon/armadillo.glb', color: 0xb8a49a, accent: 0xe9d7b9, size: 0.95 },
    orbitRadius: 8.05,
    orbitSpeed: 0.16,
    spinSpeed: 0.46,
  },
  {
    id: 'terracotta',
    orbitRole: '天王星',
    title: '秦始皇兵马俑',
    subtitle: '大型陶质军阵与数字文博对象',
    period: '秦代，公元前 3 世纪',
    body: '兵马俑代表大规模文物数字化的典型对象。这里先用程序化立俑近似展示，高清图作为说明和后续重建输入。',
    details: ['兵马俑是秦代大型地下军阵的重要组成部分，个体姿态、服饰和面部差异都具有研究价值。', '它非常适合讨论文化遗产数字化：对象数量大、形态相似但细节差异丰富。', '当前版本使用近似立俑几何生成重建输入，高清图用于保证文物介绍和展示语境。'],
    image: '/heritage/images/terracotta_warrior.jpg',
    source: 'MapAnything 12-view reconstruction from rendered terracotta warrior inputs; reference image from Wikimedia Commons',
    model: { kind: 'glb', path: '/heritage/recon/terracotta.glb', variant: 'terracotta', color: 0xb46f42, accent: 0xf1b27a, size: 0.82 },
    orbitRadius: 9.55,
    orbitSpeed: 0.12,
    spinSpeed: 0.36,
  },
  {
    id: 'moai',
    orbitRole: '海王星',
    title: 'Moai 石像',
    subtitle: '拉帕努伊巨石头像',
    period: '约公元 13-16 世纪',
    body: 'Moai 石像轮廓强烈，适合做远轨道终点对象。它在交互卡片中作为“可从照片继续重建”的文物样例。',
    details: ['Moai 是拉帕努伊文化最具代表性的巨石头像，具有强烈的正面轮廓和纪念性。', '它的几何特点适合做远轨道对象：轮廓清楚、体块稳定、远距离仍然易识别。', '当前版本用近似几何生成重建输入，后续可以替换为公开扫描或真实多视角照片。'],
    image: '/heritage/images/moai.jpg',
    source: 'MapAnything 12-view reconstruction from rendered Moai inputs; reference image from Wikimedia Commons',
    model: { kind: 'glb', path: '/heritage/recon/moai.glb', variant: 'moai', color: 0x6d7774, accent: 0xb5c0ba, size: 0.9 },
    orbitRadius: 11.0,
    orbitSpeed: 0.09,
    spinSpeed: 0.3,
  },
];
