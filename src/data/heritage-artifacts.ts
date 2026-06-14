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

export const featuredArtifactIds = [
  'nefertiti',
  'fangyi',
  'cosmic-buddha',
  'apollo-11-command-module',
  'hoa-hakananai-a',
  'incense-burner',
] as const;

export const heritageArtifacts: HeritageArtifact[] = [
  {
    id: 'nefertiti',
    orbitRole: '太阳',
    title: 'Nefertiti Bust',
    subtitle: '古埃及王后肖像与阿玛尔纳艺术',
    period: '古埃及第十八王朝，约公元前 1345 年',
    body: '娜芙蒂蒂半身像以细长颈部、高耸蓝冠和高度对称的面部闻名，是阿玛尔纳时期最具代表性的王室肖像之一。',
    details: ['作品通常被认为出自雕塑家图特摩斯的作坊，现藏于柏林新博物馆。', '平滑的面部塑形与鲜明彩绘共同强化了王后的理想化形象。', '左眼未嵌入晶石，使这件作品的制作状态与原始用途长期受到讨论。'],
    image: '/heritage/rgb/nefertiti.png',
    source: 'Nefertiti Bust',
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
    spinSpeed: 0,
  },
  {
    id: 'fangyi',
    orbitRole: '水星',
    title: '青铜方彝',
    subtitle: '饕餮、蛇纹与鸟纹的西周礼器',
    period: '早期西周，约公元前 1100 年',
    body: '方彝是商周时期用于盛放祭祀酒液的青铜礼器。该器采用方正器身与屋顶式器盖，四角和器面中轴的扉棱增强了庄严、厚重的建筑感。',
    details: ['器表装饰饕餮、鸟纹与蛇纹，纹饰分区严整，层次清晰。', '器内底部与盖内铸有铭文，为研究西周宗族、礼制与铸造活动提供了重要材料。', '馆藏号 F1930.54a-b，现藏于史密森尼学会弗利尔美术馆。'],
    image: '/heritage/rgb/fangyi.png',
    source: 'Freer Gallery of Art, F1930.54a-b',
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
    body: '这尊石灰岩佛像以袈裟上密集的浅浮雕著称。雕刻将佛传故事、须弥山以及天界、人间和地狱等图像组织在佛身之上，形成可被观看的佛教宇宙。',
    details: ['造像出土背景指向河南安阳地区，具有北齐佛教雕塑常见的修长体态。', '头部和双手已经缺失，但衣纹与袈裟图像仍保存了丰富叙事内容。', '现藏于史密森尼学会弗利尔美术馆，馆藏号 F1923.15。'],
    image: '/heritage/rgb/cosmic-buddha.png',
    source: 'Freer Gallery of Art, F1923.15',
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
    subtitle: '阿波罗十一号载人登月返回舱',
    period: '1969 年，美国国家航空航天博物馆藏品',
    body: '“哥伦比亚号”指令舱是阿波罗十一号任务中唯一返回地球的载人舱段。它将三名宇航员带回大气层，并于 1969 年 7 月 24 日在太平洋溅落。',
    details: ['锥形外壳底部安装隔热盾，用于承受高速再入时产生的极端热量。', '舱体表面的深色烧蚀痕迹记录了真实的返回过程。', '该舱现藏于美国国家航空航天博物馆。'],
    image: '/heritage/rgb/apollo-11-command-module.png',
    source: 'Smithsonian National Air and Space Museum',
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
    subtitle: '拉帕努伊玄武岩祖先石像',
    period: '约公元 13-16 世纪',
    body: "Hoa Hakananai'a 是拉帕努伊最著名的 moai 石像之一，由坚硬的玄武岩雕成。其正面保留典型的长脸、突出眉骨与收紧双臂，背面则刻有后期宗教图像。",
    details: ['石像最初位于奥龙戈仪式村附近，具有祖先崇拜与群体身份的象征意义。', '背部图案包括鸟人、桨和其他与鸟人仪式相关的符号。', '现藏于大英博物馆，其归属与返还问题仍受到持续关注。'],
    image: '/heritage/rgb/hoa-hakananai-a.png',
    source: 'British Museum',
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
    subtitle: '兽形装饰与镂孔器身的三足熏炉',
    period: '历史器物公开三维模型',
    body: '三足熏炉利用中空器身盛放香料，燃烧产生的烟气从盖部和器壁孔洞逸出。器物将实用结构与兽形装饰结合，形成稳定而富有动势的轮廓。',
    details: ['三足结构使炉体远离承托面，也为下部空气流通留出空间。', '器身镂孔既承担排烟功能，也构成重复的装饰节奏。', '突出的兽首、足部与盖钮体现了传统器物中功能和象征造型的结合。'],
    image: '/heritage/rgb/incense-burner.png',
    source: 'Tripod Incense Burner',
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
