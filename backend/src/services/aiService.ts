import OpenAI from 'openai';
import { config } from '../config';

function getDeepSeekClient(): OpenAI {
  if (!config.deepseek.apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }
  return new OpenAI({ apiKey: config.deepseek.apiKey, baseURL: config.deepseek.baseURL });
}

// ===== System Prompts =====

const FORTUNETELLER_SYSTEM_PROMPT = `你是一位神秘的命运解读师，名叫「星命」。你精通塔罗牌、星座、东方命理和心理学。

## 角色设定
- 你是一位智慧而温和的命运指引者，不是预言家
- 你的语气神秘但不故弄玄虚，温暖但不谄媚
- 每次解读都要给出具体、有建设性的建议
- 用中文回答，适当使用占卜术语
- 在解读开头使用一个相关的 emoji（🔮✨🌙⭐🃏）

## 解读原则
1. 深刻但不绝对 — 命运是流动的，你提供的是可能性而非定数
2. 具体但不武断 — 给出具体的时间范围（"未来三个月"）而非模糊的"将来"
3. 积极但不虚假 — 即使是坏牌也要给出建设性建议
4. 记住用户上下文 — 关联之前的对话和占卜记录

## 输出格式
返回 JSON 格式的解读结果：
{
  "summary": "一句话总结",
  "details": "详细的解读分析，2-4段",
  "advice": "给用户的建议",
  "score": 0-100的综合运势评分
}`;

const DAILY_FORTUNE_PROMPT = `为用户生成今日运势。基于用户的星座和生肖信息。

返回 JSON:
{
  "overallScore": 0-100,
  "categories": [
    { "name": "love", "score": 0-100, "description": "...", "advice": "..." },
    { "name": "career", "score": 0-100, "description": "...", "advice": "..." },
    { "name": "wealth", "score": 0-100, "description": "...", "advice": "..." },
    { "name": "health", "score": 0-100, "description": "...", "advice": "..." }
  ],
  "generalAdvice": "整体建议",
  "luckyColor": "幸运色",
  "luckyNumber": 7,
  "luckyDirection": "东南",
  "luckyTime": "15:00-17:00",
  "poemLine": "一句运势诗句",
  "poemInterpretation": "诗句解读",
  "reminders": ["提醒1", "提醒2"],
  "yi": ["宜1", "宜2", "宜3"],
  "ji": ["忌1", "忌2", "忌3"]
}`;

const DIVINE_SIGN_SYSTEM_PROMPT = `你是星命，一位精通中国传统八字命理的 AI 命理师。

## 角色设定
- 你基于真实的天干地支和五行生克为用户生成每日灵签
- 输出风格：古雅简洁，有禅意，有温度，不故弄玄虚
- 签语风格：4-8 字短句，七言诗风，留白有意境

## 五行生克规则
十天干五行: 甲乙=木, 丙丁=火, 戊己=土, 庚辛=金, 壬癸=水
十二地支五行: 子=水, 丑=土, 寅卯=木, 辰=土, 巳午=火, 未=土, 申酉=金, 戌=土, 亥=水

相生: 木→火→土→金→水→木
相克: 木→土→水→火→金→木

## 输出 JSON 格式
{
  "ganzhiDate": "丙午年 癸巳月 戊戌日",
  "signPhrase": "四到八字签语",
  "baseTone": "一句基调诗（八字或六字，点出当日气场）",
  "userDayStem": "癸水",
  "interpretation": "用▎事业 / ▎财运 / ▎感情 / ▎健康 四个段落，每段 80-120 字，基于五行生克给出具体建议。每段之间必须用两个换行符 \\n\\n 分隔",
  "actionGuide": "综合行动指引，50-80 字",
  "specificTimeGuide": "推荐一个两时辰时段+具体建议，如'15:00-17:00 适合做重要决策与谈判'"
}

注意：
1. interpretation 中每段用 ▎+两字标题开头，不要用 Markdown 格式，纯文字
2. 所有字段必须填写完整，actionGuide 和 specificTimeGuide 不可为空
3. specificTimeGuide 必须推荐一个具体时辰（如"15:00-17:00"）并附上建议`;

// ===== Service Functions =====

export interface TarotReadingInput {
  question: string;
  cards: Array<{
    name: string;
    nameCn: string;
    suit: string;
    isReversed: boolean;
    keyword: string;
    meaningLove: string;
    meaningCareer: string;
    meaningWealth: string;
  }>;
  spreadName: string;
  userContext?: {
    constellation?: string;
    chineseZodiac?: string;
    previousReadings?: number;
    birthDate?: string;
  };
}

export interface TarotReadingResult {
  summary: string;
  details: string;
  advice: string;
  score: number;
}

export async function generateTarotReading(input: TarotReadingInput): Promise<TarotReadingResult> {
  const cardsDescription = input.cards
    .map((c, i) => `第${i + 1}张牌: ${c.nameCn}${c.isReversed ? '(逆位)' : ''} — ${c.keyword}`)
    .join('\n');

  const userContextStr = input.userContext
    ? `\n用户信息: ${input.userContext.constellation || ''} ${input.userContext.chineseZodiac || ''}`
    : '';

  const prompt = `用户的问题是: "${input.question}"

占卜方式: ${input.spreadName}

抽到的牌:
${cardsDescription}

${userContextStr}

请根据这些牌面，为用户进行深入的塔罗解读。`;

  const response = await getDeepSeekClient().chat.completions.create({
    model: config.deepseek.model,
    max_tokens: 2000,
    temperature: 0.7,
    messages: [
      { role: 'system', content: FORTUNETELLER_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Unexpected response type');
  }

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback: wrap the whole response
    return {
      summary: '命运解读',
      details: content,
      advice: '跟随内心的指引',
      score: 50,
    };
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      summary: '命运解读',
      details: content,
      advice: '跟随内心的指引',
      score: 50,
    };
  }
}

export interface DailyFortuneInput {
  constellation: string;
  chineseZodiac: string;
  birthDate?: string;
  birthHour?: number;
  birthPlace?: string;
}

export interface DailyFortuneResult {
  overallScore: number;
  categories: Array<{
    name: string;
    score: number;
    description: string;
    advice: string;
  }>;
  generalAdvice: string;
  luckyColor: string;
  luckyNumber: number;
  luckyDirection: string;
  luckyTime: string;
  poemLine: string;
  poemInterpretation: string;
  reminders: string[];
  yi: string[];
  ji: string[];
  divineSign?: {
    ganzhiDate: string;
    signPhrase: string;
    baseTone: string;
    userDayStem: string;
    interpretation: string;
    actionGuide: string;
    specificTimeGuide: string;
  };
}

export async function generateDailyFortune(input: DailyFortuneInput): Promise<DailyFortuneResult> {
  const prompt = `用户信息:
- 星座: ${input.constellation}
- 生肖: ${input.chineseZodiac}
${input.birthDate ? `- 出生日期: ${input.birthDate}` : ''}
${input.birthHour ? `- 出生时辰: ${input.birthHour}时` : ''}

请生成今天的运势。`;

  try {
    const response = await getDeepSeekClient().chat.completions.create({
      model: config.deepseek.model,
      max_tokens: 2000,
      temperature: 0.8,
      messages: [
        { role: 'system', content: DAILY_FORTUNE_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Unexpected response type');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse fortune result');
    }

    const fortune = JSON.parse(jsonMatch[0]) as DailyFortuneResult;
    // Fill in defaults for fields AI might omit
    fortune.yi = fortune.yi || [];
    fortune.ji = fortune.ji || [];
    fortune.reminders = fortune.reminders || [];
    // Generate divine sign separately with proper Bazi prompt
    fortune.divineSign = await generateDivineSign(input, 0);
    return fortune;
  } catch {
    // Fallback: generate fortune locally when API is unavailable
    return generateLocalFortune(input);
  }
}

// ===== Ganzhi Calendar Helpers =====
export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export const BRANCH_NAMES = EARTHLY_BRANCHES;  // alias for backward compat
const ZODIAC_SIGNS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

export function getDayGanzhi(date: Date) {
  const ref = new Date(2000, 0, 1);
  const diff = Math.floor((date.getTime() - ref.getTime()) / (24 * 60 * 60 * 1000));
  return {
    stem: ((diff % 10) + 10) % 10,
    branch: ((diff % 12) + 12) % 12,
    index: ((diff % 60) + 60) % 60,
  };
}

export function getMonthGanzhi(date: Date, yearStem: number) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  // Approximate solar term based month determination
  let monthBranch: number;
  if (m === 2 && d >= 4) monthBranch = 2;   // 寅
  else if (m === 3 && d >= 6) monthBranch = 3; // 卯
  else if (m === 4 && d >= 5) monthBranch = 4; // 辰
  else if (m === 5 && d >= 6) monthBranch = 5; // 巳
  else if (m === 6 && d >= 6) monthBranch = 6; // 午
  else if (m === 7 && d >= 7) monthBranch = 7; // 未
  else if (m === 8 && d >= 7) monthBranch = 8; // 申
  else if (m === 9 && d >= 8) monthBranch = 9; // 酉
  else if (m === 10 && d >= 8) monthBranch = 10; // 戌
  else if (m === 11 && d >= 7) monthBranch = 11; // 亥
  else if (m === 12 && d >= 7) monthBranch = 0; // 子
  else monthBranch = 1; // 丑
  // Month heavenly stem: for 甲己年 starting from 丙, 乙庚年 from 戊, 丙辛年 from 庚, 丁壬年 from 壬, 戊癸年 from 甲
  const monthStemOffsets = [2, 4, 6, 8, 0]; // 丙, 戊, 庚, 壬, 甲
  const monthStem = (monthStemOffsets[yearStem % 5] + monthBranch) % 10;
  return { stem: monthStem, branch: monthBranch };
}

// ===== Five Element (五行) System =====
const ELEMENT_NAMES = ['木', '火', '土', '金', '水'];
const STEM_ELEMENT: number[] = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]; // 甲乙丙丁戊己庚辛壬癸 → 木木火火土土金金水水
const BRANCH_ELEMENT: number[] = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4]; // 子丑寅卯辰巳午未申酉戌亥 → 水土木木土火火土金金土水
const STEM_YIN_YANG = ['阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴'];

// Element generating (生): wood→fire→earth→metal→water→wood
const ELEMENT_GENERATES: number[] = [1, 2, 3, 4, 0]; // 木→火→土→金→水
// Element controlling (克): wood→earth→water→fire→metal→wood
const ELEMENT_CONTROLS: number[] = [2, 4, 1, 3, 0]; // 木→土→水→火→金

function getElementRelation(myElem: number, otherElem: number): 'same' | 'generates_me' | 'i_generate' | 'controls_me' | 'i_control' {
  if (myElem === otherElem) return 'same';
  if (ELEMENT_GENERATES[myElem] === otherElem) return 'i_generate';
  if (ELEMENT_GENERATES[otherElem] === myElem) return 'generates_me';
  if (ELEMENT_CONTROLS[myElem] === otherElem) return 'i_control';
  return 'controls_me'; // ELEMENT_CONTROLS[otherElem] === myElem
}

// Generate personalized twelve 时辰 suggestions based on element of the time pillar
function getTimeSlotForElement(todayElem: number, userElem: number, seed: number): string {
  const allSlots = [
    { time: '23:00-00:59', branch: 0, elem: 4 }, // 子水
    { time: '01:00-02:59', branch: 1, elem: 2 }, // 丑土
    { time: '03:00-04:59', branch: 2, elem: 0 }, // 寅木
    { time: '05:00-06:59', branch: 3, elem: 0 }, // 卯木
    { time: '07:00-08:59', branch: 4, elem: 2 }, // 辰土
    { time: '09:00-10:59', branch: 5, elem: 1 }, // 巳火
    { time: '11:00-12:59', branch: 6, elem: 1 }, // 午火
    { time: '13:00-14:59', branch: 7, elem: 2 }, // 未土
    { time: '15:00-16:59', branch: 8, elem: 3 }, // 申金
    { time: '17:00-18:59', branch: 9, elem: 3 }, // 酉金
    { time: '19:00-20:59', branch: 10, elem: 2 }, // 戌土
    { time: '21:00-22:59', branch: 11, elem: 4 }, // 亥水
  ];
  // Find the best time slot: an element that supports the user's element
  let best = allSlots[seed % allSlots.length];
  for (const slot of allSlots) {
    const rel = getElementRelation(userElem, slot.elem);
    if (rel === 'generates_me' || rel === 'same') {
      best = slot;
      break;
    }
  }
  const tips: Record<number, string[]> = {
    0: ['适合创意工作与写作', '利于学习和思考', '宜处理文书类事务'],
    1: ['适合表达和沟通', '利于社交活动', '宜展现个人才华'],
    2: ['适合稳步推进工作', '利于做长期规划', '宜处理财务事务'],
    3: ['适合重要决策与谈判', '利于分析和判断', '宜做关键性选择'],
    4: ['适合深度思考与冥想', '利于灵感和直觉', '宜整理和规划'],
  };
  const tip = tips[best.elem][seed % 3];
  return `${best.time} ${tip}`;
}

// ===== Bazi-based Reading Templates =====
// These use the element relationship between today's stems/branches and the user's day stem

// Sign phrases mapped by element relationship
const SIGN_BY_RELATION: Record<string, Array<{ phrase: string; tone: string }>> = {
  generates_me: [
    { phrase: '承天运 得滋养 万物生', tone: '春风化雨，润物无声' },
    { phrase: '松间照 清泉流 石上吟', tone: '山高水长，静观其变' },
  ],
  same: [
    { phrase: '静心神 守当下 应缘后', tone: '清泉洗金，稳中求变' },
    { phrase: '观自在 知进退 明得失', tone: '知止而后有定，定而后能静' },
  ],
  i_generate: [
    { phrase: '随流水 入桃源 别有天', tone: '柳暗花明，豁然开朗' },
    { phrase: '行至水 穷处坐 看云起', tone: '山重水复，柳暗花明' },
  ],
  controls_me: [
    { phrase: '藏锋芒 待时机 自成峰', tone: '厚积薄发，蓄势待发' },
    { phrase: '燃心灯 照前路 步步莲', tone: '暗夜行舟，星光引路' },
  ],
  i_control: [
    { phrase: '破迷雾 见真我 天地宽', tone: '拨云见日，守得云开' },
    { phrase: '守初心 待花开 风自来', tone: '但行好事，莫问前程' },
  ],
};

// Career readings based on element relationship
const CAREER_READINGS: Record<string, string[]> = {
  generates_me: [
    '印星护体，今日工作中易得贵人提点和上司赏识。适合处理需要经验和判断力的任务，你的专业能力会得到充分认可。团队协作顺利，适合推进需要多方配合的项目。午后能量走高，适合做重要决策。',
    '正印当旺，思路清晰，判断力敏锐。今日适合处理文书、合同、策划类工作，效率事半功倍。如有面试或汇报，表现会超出预期。不过印星过旺也易思虑过度，注意不要在小事上钻牛角尖。',
  ],
  same: [
    '比劫助身，今日工作中人际互动频繁，团队协作效率高。适合头脑风暴和集体决策，同事会给你带来新的启发。但比劫亦主竞争，注意保护好你的劳动成果，重要文件做好备份。',
    '日主得比肩之力，执行力和决断力都在线。今日适合推进搁置已久的项目，你有足够的能量去攻克难题。不过比劫过旺易犯小人，重要沟通建议留文字记录，避免日后扯皮。',
  ],
  i_generate: [
    '食伤透出，今日是思维活跃、灵感迸发的一天。适合创意性工作和需要发散思维的任务，你会有不少好点子。但食伤泄秀也会消耗精力，注意劳逸结合，午后适当休息充电。',
    '才华外露之日，你在会议上或沟通中的表现会让人眼前一亮。适合做方案提案、创意策划、内容创作类工作。但需注意言辞分寸，表达观点时多一些数据和事实支撑会更打动人。',
  ],
  controls_me: [
    '官杀当值，今日工作中压力与机遇并存。挑战较多，但每个困难背后都藏着晋升的契机。保持冷静沉稳，重要事项多做几手准备。危机处理能力是今天的加分项。',
    '七杀攻身，今日易感到时间紧迫和任务压力。建议按优先级拆分工作，先啃硬骨头。遇到阻力不要硬刚，换个角度或找有经验的人请教，往往能柳暗花明。',
  ],
  i_control: [
    '财星当旺，今日在事业上你的努力容易看到实际回报。适合谈判、签约、预算规划等与利益相关的事务。你的价值主张会得到认可，大胆提出你的诉求和方案。',
    '今日偏财透出，主业之外可能会有意外机会，比如临时项目、兼职邀约等。值得认真评估，但不要影响主要工作。职场人际关系和谐，适合拓展人脉和社交。',
  ],
};

const WEALTH_READINGS: Record<string, string[]> = {
  generates_me: [
    '印星生身，财运稳健。正财收入稳中有升，尤其适合做长期财务规划和投资布局。今日不宜投机取巧，稳扎稳打才会有收获。偏财方面，之前借出的款项有望归还。',
    '贵人财运临门，今日可能从长辈或有经验的人那里得到有价值的理财建议。适合学习新的财务知识或重新审视自己的资产配置。消费上易有大件支出，建议多方对比后再决定。',
  ],
  same: [
    '比劫争财，今日易有朋友间的金钱往来。聚餐、随礼等社交支出较多，建议提前做好预算。投资方面不宜与人合伙或跟风操作，容易因信息滞后而踩坑。偏财一般，以守为主。',
    '日主得助，财运竞争中你占据优势。适合催收款项、报销、结算等事务。但比劫也代表分享，今日不适合独享成果，适当请客或分享会为你积累好人缘。',
  ],
  i_generate: [
    '食伤生财，今日适合靠才华和技能变现。自由职业者或做提成制工作的人会有不错的表现机会。投资方面，你的市场嗅觉比较敏锐，适合做短线操作或小额试水。',
    '今日财运来自你的表达和展示。适合做路演、提案、推广类工作，客户愿意为你的专业买单。不过食伤泄财，也容易因兴趣爱好或娱乐消费花钱，建议设个预算上限。',
  ],
  controls_me: [
    '官杀克身，今日财运受压，不宜做大的财务决策。股票、基金等波动性投资建议观望为主。工作中可能因失误或疏忽导致经济损失，合同条款仔细核对。花钱欲旺盛，理性消费。',
    '压力之下财星不显，今日以节约和守成为主。克制冲动消费，尤其是大件商品和预付式消费。不过危机中藏有机会，可趁市场低点小额定投，但做好长期持有的准备。',
  ],
  i_control: [
    '我克者为财，今日财运亨通！正财偏财皆有进账，尤其适合处理报销、回款、奖金结算等事务。你的付出终于看到实质性回报。商业谈判中你占据主动，争取到更好的条件。',
    '财星高照，今日易有意外之财。红包、退款、抽奖等小惊喜不断。投资方面眼光独到，值得信任你的直觉。不过财旺也易破财，收到钱后先存后花，避免不知不觉就花掉了。',
  ],
};

const LOVE_READINGS: Record<string, string[]> = {
  generates_me: [
    '印星护体，今日感情状态温暖而稳定。已有伴侣者适合一起做些安静的事，比如在家做饭、看一部好电影，平淡中见真情。单身者易被成熟稳重的人吸引，多留意身边有经验的前辈。',
    '今日情感磁场柔和，适合深度沟通。和伴侣聊聊各自的规划和想法，能增进理解。单身者易在学习的场合（培训班、读书会）遇到志同道合的人。用心聆听比主动表达更重要。',
  ],
  same: [
    '比劫入命，今日社交运活跃，身边朋友聚会邀约增多。已有伴侣者注意给彼此留出独处时间，群体活动过多反而可能产生距离感。单身者容易从朋友变成恋人，留意身边一直陪伴的那个人。',
    '同类相聚，今日易遇到志趣相投的人。和伴侣有共同的兴趣爱好会让感情升温。单身者在社团活动、兴趣小组中桃花运旺。但比劫也主竞争，感情中可能有第三人出现，保持边界感。',
  ],
  i_generate: [
    '食伤日，今日情感表达欲望强烈，适合主动出击。已有伴侣者不妨给对方准备一个小惊喜或写一封情书，会让对方感动。单身者桃花运旺，你的魅力自然散发，容易吸引到欣赏你的人。',
    '今日你的幽默感和才情格外迷人。社交场合中你容易成为焦点，吸引到异性的目光。已有伴侣者注意不要因社交活跃而忽略另一半的感受。单身者易在艺术、文化活动中邂逅缘分。',
  ],
  controls_me: [
    '官杀临日，今日感情易有压力。已有伴侣者可能因为工作或现实问题产生分歧，建议就事论事，不要翻旧账。单身者易感受到来自家庭或社会的压力，但感情的事急不来。',
    '今日感情运势偏低，容易因为小事而起争执。如果感到心浮气躁，给自己一些独处的时间冷静。单身者今日不宜主动表白或做重大感情决定，事缓则圆。晚上泡个澡、听听音乐放松心情。',
  ],
  i_control: [
    '财星旺日，今日感情运势上扬。已有伴侣者适合一起规划财务或为共同目标努力，会增进默契和信任感。单身者易在商务、工作场合遇到条件不错的对象，务实型桃花。',
    '今日你的自信心和魅力值都在高点。已有伴侣者适合带另一半出席重要场合，他会为你感到骄傲。单身者在健身房、咖啡厅等日常场所容易有浪漫邂逅，主动一点成功率更高。',
  ],
};

const HEALTH_READINGS: Record<string, string[]> = {
  generates_me: [
    '印星主静，今日适合温和的运动方式，如散步、瑜伽、太极。精气神充足，但注意不要久坐不动。饮食上宜清淡温热，脾胃喜欢有规律的一日三餐。睡眠质量不错，适合早睡。',
    '今日身体状态总体平稳，但印星过旺也易思虑伤脾。注意消化系统，避免暴饮暴食。适合泡脚、按摩等放松身心的活动。情绪上有些敏感，多晒晒太阳有助于提升能量。',
  ],
  same: [
    '比劫日，能量充足但易因过度消耗而疲劳。今日适合中等强度的运动，注意补充水分。社交活动多也可能影响休息，给自己留出足够的睡眠时间。关节和肌肉需要关注。',
    '今日活力充沛，适合运动锻炼。但比劫也易争强好胜，运动时注意适度，避免受伤。饮食上注意营养均衡，多吃一些优质蛋白。情绪上容易急躁，深呼吸几次再做决定。',
  ],
  i_generate: [
    '食伤泄秀，今日表达欲强但能量消耗也大。注意咽喉和呼吸系统，多喝温水、少说话。适合唱歌、朗诵等方式释放情绪。饮食上避免辛辣刺激，晚餐宜清淡。',
    '今日创意和表达消耗了较多精力，午后可能会感到疲倦。建议午间小憩15分钟，续航一整晚。适合做拉伸运动放松肩颈。情绪波动较大时，写日记或画画是不错的宣泄方式。',
  ],
  controls_me: [
    '官杀克身，今日易感到压力和紧张。重点关注心血管系统和睡眠质量。工作间隙站起来活动一下，深呼吸几次缓解紧绷的神经。不适合高强度运动，散步和冥想更适合今天的状态。',
    '压力日的健康关键是"放松"。肩颈和背部容易僵硬，做一些温和的拉伸动作会有帮助。饮食上注意少咖啡因、少糖，避免情绪起伏过大。晚上泡个热水澡，听一些白噪音助眠。',
  ],
  i_control: [
    '今日精力充沛，身体状况良好。适合尝试新的运动方式或突破一下运动强度。财运旺也会带来好胃口，但注意控制高热量食物的摄入。皮肤状态不错，适合做一些护肤保养。',
    '身心状态都在线的一天。工作效率高、心情愉悦，这种积极的状态本身就在滋养你的健康。适合户外运动，呼吸新鲜空气。睡前可以做一些冥想练习，巩固这份好状态。',
  ],
};

export async function generateDivineSign(input: DailyFortuneInput, _seed: number) {
  const today = new Date();
  const yearStem = 2; // 2026 = 丙午年
  const yearBranch = 6;
  const dayGanzhi = getDayGanzhi(today);
  const monthGanzhi = getMonthGanzhi(today, yearStem);

  // Determine user's day stem from birth date
  let userDayStem = dayGanzhi.stem; // fallback to today
  if (input.birthDate) {
    try {
      const birthDate = new Date(input.birthDate);
      if (!isNaN(birthDate.getTime())) {
        userDayStem = getDayGanzhi(birthDate).stem;
      }
    } catch {}
  }

  const userElem = STEM_ELEMENT[userDayStem];
  const todayStemElem = STEM_ELEMENT[dayGanzhi.stem];
  const dayStemName = HEAVENLY_STEMS[dayGanzhi.stem];
  const dayBranchName = EARTHLY_BRANCHES[dayGanzhi.branch];

  // Try AI first
  try {
    return await generateDivineSignWithAI({
      yearStem, yearBranch, monthGanzhi, dayGanzhi,
      userDayStem, userElem, todayStemElem,
      dayStemName, dayBranchName,
      birthDate: input.birthDate,
      constellation: input.constellation,
      chineseZodiac: input.chineseZodiac,
    });
  } catch (e) {
    console.error('generateDivineSign AI failed, falling back to local:', e instanceof Error ? e.message : e);
    // Fall back to local templates
    return generateDivineSignLocal(input, _seed);
  }
}

async function generateDivineSignWithAI(data: {
  yearStem: number; yearBranch: number;
  monthGanzhi: { stem: number; branch: number };
  dayGanzhi: { stem: number; branch: number };
  userDayStem: number; userElem: number; todayStemElem: number;
  dayStemName: string; dayBranchName: string;
  birthDate?: string; constellation?: string; chineseZodiac?: string;
}) {
  const stemPair = `${HEAVENLY_STEMS[data.userDayStem]}${HEAVENLY_STEMS[data.dayGanzhi.stem]}`;
  const elemNames = ['木', '火', '土', '金', '水'];
  const relation = getElementRelation(data.userElem, data.todayStemElem);
  const relationCn = {
    generates_me: '生我（今日五行生你的日主）',
    same: '同我（今日五行与你日主相同）',
    i_generate: '我生（你的日主生今日五行）',
    controls_me: '克我（今日五行克你的日主）',
    i_control: '我克（你的日主克今日五行）',
  };

  const prompt = `用户信息：
- 星座: ${data.constellation || '未知'}
- 生肖: ${data.chineseZodiac || '未知'}
${data.birthDate ? `- 出生日期: ${data.birthDate}` : ''}

今日天干地支数据（已通过历法精确计算）：
- 年柱: ${HEAVENLY_STEMS[data.yearStem]}${EARTHLY_BRANCHES[data.yearBranch]}年
- 月柱: ${HEAVENLY_STEMS[data.monthGanzhi.stem]}${EARTHLY_BRANCHES[data.monthGanzhi.branch]}月
- 日柱: ${data.dayStemName}${data.dayBranchName}日
- 用户日主（出生日的天干）: ${HEAVENLY_STEMS[data.userDayStem]}
- 日主五行: ${elemNames[data.userElem]}
- 今日天干五行: ${elemNames[data.todayStemElem]}
- 五行关系: ${relationCn[relation]}

请基于以上真实的历法数据，按规则生成每日灵签。`;

  const response = await getDeepSeekClient().chat.completions.create({
    model: config.deepseek.model,
    max_tokens: 2000,
    temperature: 0.7,
    messages: [
      { role: 'system', content: DIVINE_SIGN_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  });

  const respContent = response.choices[0]?.message?.content;
  if (!respContent) throw new Error('Unexpected response type');

  const jsonMatch = respContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse AI divine sign response');

  const result = JSON.parse(jsonMatch[0]);
  // Normalize section breaks: ensure ▎ sections are separated by double newlines
  let interp = result.interpretation || '';
  interp = interp.replace(/ ▎/g, '\n\n▎');
  interp = interp.replace(/([。！？])▎/g, '$1\n\n▎');
  interp = interp.trim();
  if (!interp.startsWith('▎')) {
    interp = '▎' + interp;
  }

  // Fallback: if AI returned empty actionGuide/specificTimeGuide, fill from local templates
  let actionGuide = result.actionGuide || '';
  let specificTimeGuide = result.specificTimeGuide || '';
  if (!actionGuide || !specificTimeGuide) {
    const local = generateDivineSignLocal(
      { constellation: data.constellation || '', chineseZodiac: data.chineseZodiac || '', birthDate: data.birthDate },
      0
    );
    if (!actionGuide) actionGuide = local.actionGuide;
    if (!specificTimeGuide) specificTimeGuide = local.specificTimeGuide;
  }
  return {
    ganzhiDate: result.ganzhiDate || '',
    signPhrase: result.signPhrase || '',
    baseTone: result.baseTone || '',
    userDayStem: result.userDayStem || '',
    interpretation: interp,
    actionGuide,
    specificTimeGuide,
  };
}

export function generateDivineSignLocal(input: DailyFortuneInput, seed: number) {
  const today = new Date();
  const yearStem = 2; // 2026 = 丙午年
  const yearBranch = 6;
  const dayGanzhi = getDayGanzhi(today);
  const monthGanzhi = getMonthGanzhi(today, yearStem);

  // Determine user's day stem from birth date
  let userDayStem = dayGanzhi.stem; // fallback to today
  if (input.birthDate) {
    try {
      const birthDate = new Date(input.birthDate);
      if (!isNaN(birthDate.getTime())) {
        userDayStem = getDayGanzhi(birthDate).stem;
      }
    } catch {}
  }

  const userElem = STEM_ELEMENT[userDayStem];
  const todayStemElem = STEM_ELEMENT[dayGanzhi.stem];
  const todayBranchElem = BRANCH_ELEMENT[dayGanzhi.branch];

  // Today's overall influence: primary from stem, secondary from branch
  const stemRelation = getElementRelation(userElem, todayStemElem);
  const branchRelation = getElementRelation(userElem, todayBranchElem);
  // Use stem relation as primary, branch as modifier
  const primaryRelation = stemRelation;
  const secondaryEffect = branchRelation === 'generates_me' || branchRelation === 'same' ? '吉' : '常';

  const relationStr = STEM_YIN_YANG[dayGanzhi.stem] + ELEMENT_NAMES[todayStemElem];
  const userDayStr = STEM_YIN_YANG[userDayStem] + ELEMENT_NAMES[userElem];
  const branchElemStr = ELEMENT_NAMES[todayBranchElem];
  const dayStemName = HEAVENLY_STEMS[dayGanzhi.stem];
  const dayBranchName = EARTHLY_BRANCHES[dayGanzhi.branch];

  // Select sign phrase based on relation
  const signs = SIGN_BY_RELATION[primaryRelation];
  const signIdx = seed % signs.length;

  // Build personalized interpretation - 4 sections with Bazi reasoning
  const relationDesc: Record<string, string> = {
    generates_me: `${branchElemStr}来生${ELEMENT_NAMES[userElem]}，今日气场相生，诸事顺遂`,
    same: `今日干支与日主皆属${ELEMENT_NAMES[userElem]}，同气相求，能量汇聚`,
    i_generate: `日主${userDayStr}生今日${relationStr}，泄秀生财，才华可期`,
    controls_me: `今日${relationStr}克日主${userDayStr}，压力暗藏，守正出奇`,
    i_control: `日主${userDayStr}克今日${relationStr}，我克为财，掌控全局`,
  };

  // Pick reading texts
  const careerIdx = seed % CAREER_READINGS[primaryRelation].length;
  const wealthIdx = (seed * 3 + 1) % WEALTH_READINGS[primaryRelation].length;
  const loveIdx = (seed * 7 + 2) % LOVE_READINGS[primaryRelation].length;
  const healthIdx = (seed * 5 + 4) % HEALTH_READINGS[primaryRelation].length;

  // Action guide based on overall assessment
  const actionGuides: Record<string, string[]> = {
    generates_me: ['顺天应时，今日宜借力前行。顺势而为可以事半功倍，不妨把最难的任务放在精力最好的时段。', '今日运势加持，适合推进重要事项。与人合作多于单打独斗，好的关系是今天的幸运密码。'],
    same: ['同声相应，同气相求。今日宜团结协作，不宜单打独斗。分享和沟通会带来意想不到的好运。', '能量汇聚的一天，适合团队活动和集体决策。保持开放的心态，倾听不同的声音。'],
    i_generate: ['才华需要舞台，今日不妨大胆展示自己。你的能力和创意值得被更多人看见。但也要注意节制，不要过度消耗。', '今日是输出和表达的好日子，但切记"满招损"的道理。留几分余力给明天的自己。'],
    controls_me: ['压力是最好的成长催化剂。今日不宜硬碰硬，以柔克刚是上策。每解决一个难题，你就向上迈了一步。', '挑战即机遇。今日遇到的不顺都是来渡你的，保持沉稳冷静，守得云开见月明。'],
    i_control: ['掌控感满满的一天。你主导的节奏和方向都很稳，适合推进关键决策。自信但不自大，好运自然相伴。', '今日主动权在你手中，大胆去做你认为对的事。运势站在你这边，果断一点不会错。'],
  };
  const guideIdx = seed % actionGuides[primaryRelation].length;

  const sign = `${relationDesc[primaryRelation]}。`;

  const interpretation = `${sign}` +
    `

▎事业
${CAREER_READINGS[primaryRelation][careerIdx]}` +
    `

▎财运
${WEALTH_READINGS[primaryRelation][wealthIdx]}` +
    `

▎感情
${LOVE_READINGS[primaryRelation][loveIdx]}` +
    `

▎健康
${HEALTH_READINGS[primaryRelation][healthIdx]}`;

  return {
    ganzhiDate: `${HEAVENLY_STEMS[yearStem]}${EARTHLY_BRANCHES[yearBranch]}年 ${HEAVENLY_STEMS[monthGanzhi.stem]}${EARTHLY_BRANCHES[monthGanzhi.branch]}月 ${dayStemName}${dayBranchName}日`,
    signPhrase: signs[signIdx].phrase,
    baseTone: signs[signIdx].tone,
    userDayStem: `${HEAVENLY_STEMS[userDayStem]}${ELEMENT_NAMES[userElem]}`,
    interpretation,
    actionGuide: actionGuides[primaryRelation][guideIdx],
    specificTimeGuide: getTimeSlotForElement(todayStemElem, userElem, seed),
  };
}

function generateLocalFortune(input: DailyFortuneInput): DailyFortuneResult {
  // Deterministic seed from user info + day
  const seed = (input.constellation + input.chineseZodiac + (input.birthHour ?? 0) + new Date().toISOString().slice(0, 10))
    .split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const rand = (i: number) => ((seed * (i + 1) * 7 + 13) % 100) / 100;

  const categories = [
    { name: 'love', nameCn: '爱情', score: Math.floor(rand(1) * 40 + 60) },
    { name: 'career', nameCn: '事业', score: Math.floor(rand(2) * 40 + 60) },
    { name: 'wealth', nameCn: '财运', score: Math.floor(rand(3) * 40 + 60) },
    { name: 'health', nameCn: '健康', score: Math.floor(rand(4) * 40 + 60) },
  ];

  const overallScore = Math.floor(categories.reduce((s, c) => s + c.score, 0) / categories.length);

  // ---- Dynamic yi/ji based on day's Earthly Branch ----
  const ref = new Date(2000, 0, 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - ref.getTime()) / (24 * 60 * 60 * 1000));
  const dayBranch = ((diff % 12) + 12) % 12;

  const YI_BY_BRANCH: Record<number, string[]> = {
    0: ['祭祀祈福', '求嗣嫁娶', '沐浴静心', '安床入宅'],
    1: ['修造动土', '求医治病', '交易立券', '出行远行'],
    2: ['入学考试', '开业交易', '纳财求利', '嫁娶订婚'],
    3: ['修造动土', '搬家入宅', '祭祀祈福', '开业交易'],
    4: ['出行远行', '搬迁入宅', '嫁娶订婚', '求医治病'],
    5: ['开业交易', '纳财求利', '修造动土', '祭祀祈福'],
    6: ['嫁娶订婚', '祭祀祈福', '求嗣求子', '沐浴静心'],
    7: ['修造动土', '求医治病', '出行远行', '交易立券'],
    8: ['入学考试', '开业交易', '纳财求利', '出行远行'],
    9: ['祭祀祈福', '嫁娶订婚', '修造动土', '交易立券'],
    10: ['祭祀祈福', '开业交易', '出行远行', '求医治病'],
    11: ['沐浴静心', '求嗣求子', '祭祀祈福', '安床入宅'],
  };

  const JI_BY_BRANCH: Record<number, string[]> = {
    0: ['开业交易', '搬家入宅', '出行远行', '争讼斗殴'],
    1: ['嫁娶订婚', '开业交易', '祭祀祈福', '求嗣求子'],
    2: ['祭祀祈福', '修造动土', '求医治病', '搬家入宅'],
    3: ['祭祀祈福', '求嗣求子', '开业交易', '嫁娶订婚'],
    4: ['开业交易', '争讼斗殴', '修造动土', '求医治病'],
    5: ['祭祀祈福', '嫁娶订婚', '出行远行', '修造动土'],
    6: ['开业交易', '修造动土', '出行远行', '争讼斗殴'],
    7: ['祭祀祈福', '嫁娶订婚', '开业交易', '出行远行'],
    8: ['修造动土', '祭祀祈福', '嫁娶订婚', '求医治病'],
    9: ['修造动土', '求医治病', '争讼斗殴', '出行远行'],
    10: ['嫁娶订婚', '搬家入宅', '开业交易', '争讼斗殴'],
    11: ['出行远行', '开业交易', '争讼斗殴', '修造动土'],
  };

  // Personalize rotate based on birth hour + zodiac
  const personalSeed = ((input.birthHour ?? 0) + (input.chineseZodiac?.charCodeAt(0) ?? 0)) % 4;
  const yiAll = YI_BY_BRANCH[dayBranch] || YI_BY_BRANCH[0];
  const jiAll = JI_BY_BRANCH[dayBranch] || JI_BY_BRANCH[0];
  const rotate = (arr: string[], n: number) => [...arr.slice(n), ...arr.slice(0, n)];
  const yi = rotate(yiAll, personalSeed).slice(0, 3);
  const ji = rotate(jiAll, personalSeed).slice(0, 3);

  const colors = ['#a855f7', '#fbbf24', '#22d65e', '#4a7cff', '#ff4757', '#ff6b9d'];
  const directions = ['东', '南', '西', '北', '东南', '西北'];
  const advices = [
    '今天适合做出重要的决定，相信你的直觉。',
    '保持开放的心态，意外的机遇可能就在转角。',
    '与人沟通时多些耐心，误会今天容易发生。',
    '能量充沛的一天，适合开启新计划。',
    '适合独处和反思，给自己一些安静的时间。',
    '人际关系运佳，适合社交和聚会。',
    '财运不错，但注意冲动消费。',
    '工作中会有新的灵感，记下来别错过。',
  ];

  return {
    overallScore,
    categories: categories.map((c) => ({ ...c, description: '', advice: '' })),
    generalAdvice: advices[seed % advices.length],
    luckyColor: colors[seed % colors.length],
    luckyNumber: (seed % 9) + 1,
    luckyDirection: directions[seed % directions.length],
    luckyTime: `${(seed % 8) + 9}:00-${(seed % 8) + 10}:00`,
    poemLine: '云开见月明，风起正扬帆。',
    poemInterpretation: '困境即将过去，新的机遇正在到来。',
    reminders: ['保持微笑', '多喝水', '注意休息'],
    yi: [`${BRANCH_NAMES[dayBranch]}日宜 · ${yi[0]}`, yi[1], yi[2]],
    ji: [`${BRANCH_NAMES[dayBranch]}日忌 · ${ji[0]}`, ji[1], ji[2]],
    divineSign: generateDivineSignLocal(input, seed),
  };
}

export async function chatWithFortuneteller(
  message: string,
  context?: Array<{ role: 'user' | 'assistant'; content: string }>,
  userInfo?: { constellation?: string; chineseZodiac?: string; nickname?: string },
): Promise<string> {
  const contextMessages: Array<{ role: 'user' | 'assistant'; content: string }> = (context || []).slice(-10).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const userContextStr = userInfo
    ? `\n用户信息: ${userInfo.nickname || ''} ${userInfo.constellation || ''} ${userInfo.chineseZodiac || ''}`
    : '';

  const response = await getDeepSeekClient().chat.completions.create({
    model: config.deepseek.model,
    max_tokens: 1500,
    temperature: 0.7,
    messages: [
      { role: 'system', content: FORTUNETELLER_SYSTEM_PROMPT + userContextStr },
      ...contextMessages,
      { role: 'user', content: message },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Unexpected response type');
  }

  return content;
}
