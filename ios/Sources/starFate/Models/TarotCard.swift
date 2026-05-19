import Foundation

struct TarotCard: Codable, Identifiable, Equatable {
    let id: Int
    let name: String
    let nameCn: String
    let suit: Suit
    let isMajor: Bool
    let number: Int
    let isReversed: Bool

    // Meanings
    let meaningLove: String
    let meaningCareer: String
    let meaningWealth: String
    let keyword: String

    // Symbolism
    let element: Element
    let astrology: String?
    let imageDescription: String

    enum Suit: String, Codable, CaseIterable {
        case major = "大阿尔卡纳"
        case cups = "圣杯"
        case wands = "权杖"
        case swords = "宝剑"
        case pentacles = "星币"
    }

    enum Element: String, Codable {
        case fire = "火"
        case water = "水"
        case air = "风"
        case earth = "土"
        case spirit = "灵"
    }

    var displayName: String {
        isReversed ? "逆位 \(nameCn)" : nameCn
    }

    var directionSymbol: String {
        isReversed ? "⬇" : "⬆"
    }
}

// MARK: - 牌阵
struct TarotSpread: Codable, Identifiable {
    let id: String
    let name: String
    let nameCn: String
    let description: String
    let cardCount: Int
    let positions: [SpreadPosition]

    static let defaultSpreads: [TarotSpread] = [
        TarotSpread(
            id: "single", name: "Single Card", nameCn: "单牌指引",
            description: "一张牌快速解答你的问题", cardCount: 1,
            positions: [SpreadPosition(index: 0, name: "指引", nameCn: "当下指引")]
        ),
        TarotSpread(
            id: "three", name: "Three Cards", nameCn: "三牌展开",
            description: "过去-现在-未来，看清事情脉络", cardCount: 3,
            positions: [
                SpreadPosition(index: 0, name: "Past", nameCn: "过去"),
                SpreadPosition(index: 1, name: "Present", nameCn: "现在"),
                SpreadPosition(index: 2, name: "Future", nameCn: "未来"),
            ]
        ),
        TarotSpread(
            id: "celtic", name: "Celtic Cross", nameCn: "凯尔特十字",
            description: "全面深入分析你的处境", cardCount: 10,
            positions: [
                SpreadPosition(index: 0, name: "Present", nameCn: "当前状况"),
                SpreadPosition(index: 1, name: "Challenge", nameCn: "挑战"),
                SpreadPosition(index: 2, name: "Past", nameCn: "过去基础"),
                SpreadPosition(index: 3, name: "Future", nameCn: "近期未来"),
                SpreadPosition(index: 4, name: "Above", nameCn: "潜在影响"),
                SpreadPosition(index: 5, name: "Below", nameCn: "潜在阻碍"),
                SpreadPosition(index: 6, name: "Advice", nameCn: "建议"),
                SpreadPosition(index: 7, name: "Environment", nameCn: "环境"),
                SpreadPosition(index: 8, name: "Hopes", nameCn: "希望与恐惧"),
                SpreadPosition(index: 9, name: "Outcome", nameCn: "最终结果"),
            ]
        ),
    ]
}

struct SpreadPosition: Codable, Identifiable {
    let index: Int
    let name: String
    let nameCn: String

    var id: Int { index }
}

// MARK: - 塔罗牌数据库
extension TarotCard {
    static let allCards: [TarotCard] = {
        struct MajorCardDef {
            let num: Int; let name: String; let nameCn: String
            let keyword: String; let love: String; let career: String; let wealth: String
            let element: TarotCard.Element; let astrology: String?
        }
        let majors: [MajorCardDef] = [
            .init(num: 0, name: "The Fool", nameCn: "愚者", keyword: "新的开始", love: "冒险", career: "自由恋爱", wealth: "大胆投资", element: .air, astrology: "天王星"),
            .init(num: 1, name: "The Magician", nameCn: "魔术师", keyword: "创造", love: "主动追求", career: "技能变现", wealth: "创新盈利", element: .fire, astrology: "水星"),
            .init(num: 2, name: "The High Priestess", nameCn: "女祭司", keyword: "直觉", love: "等待", career: "内在智慧", wealth: "保守理财", element: .water, astrology: "月亮"),
            .init(num: 3, name: "The Empress", nameCn: "女皇", keyword: "丰收", love: "怀孕", career: "事业有成", wealth: "物质富足", element: .earth, astrology: "金星"),
            .init(num: 4, name: "The Emperor", nameCn: "皇帝", keyword: "稳定", love: "保护", career: "领导力", wealth: "财富积累", element: .fire, astrology: "白羊座"),
            .init(num: 5, name: "The Hierophant", nameCn: "教皇", keyword: "传统", love: "结婚", career: "贵人", wealth: "稳定收入", element: .earth, astrology: "金牛座"),
            .init(num: 6, name: "The Lovers", nameCn: "恋人", keyword: "选择", love: "热恋", career: "合伙", wealth: "合作生财", element: .air, astrology: "双子座"),
            .init(num: 7, name: "The Chariot", nameCn: "战车", keyword: "胜利", love: "主动出击", career: "突破", wealth: "努力得财", element: .water, astrology: "巨蟹座"),
            .init(num: 8, name: "Strength", nameCn: "力量", keyword: "内在力量", love: "以柔克刚", career: "耐心", wealth: "持续收益", element: .fire, astrology: "狮子座"),
            .init(num: 9, name: "The Hermit", nameCn: "隐士", keyword: "内省", love: "单身期", career: "反思", wealth: "财务规划", element: .earth, astrology: "处女座"),
            .init(num: 10, name: "Wheel of Fortune", nameCn: "命运之轮", keyword: "转变", love: "缘分", career: "机遇", wealth: "财运起伏", element: .water, astrology: "木星"),
            .init(num: 11, name: "Justice", nameCn: "正义", keyword: "平衡", love: "公平", career: "法律", wealth: "公平分配", element: .air, astrology: "天秤座"),
            .init(num: 12, name: "The Hanged Man", nameCn: "倒吊人", keyword: "等待", love: "牺牲", career: "新视角", wealth: "暂停支出", element: .water, astrology: "海王星"),
            .init(num: 13, name: "Death", nameCn: "死神", keyword: "结束", love: "感情转变", career: "重新开始", wealth: "财务重组", element: .water, astrology: "天蝎座"),
            .init(num: 14, name: "Temperance", nameCn: "节制", keyword: "调和", love: "磨合", career: "稳健", wealth: "收支平衡", element: .fire, astrology: "射手座"),
            .init(num: 15, name: "The Devil", nameCn: "恶魔", keyword: "执着", love: "欲望", career: "物质束缚", wealth: "贪欲警示", element: .earth, astrology: "摩羯座"),
            .init(num: 16, name: "The Tower", nameCn: "高塔", keyword: "剧变", love: "分手", career: "破产", wealth: "财务危机", element: .fire, astrology: "火星"),
            .init(num: 17, name: "The Star", nameCn: "星星", keyword: "希望", love: "疗愈", career: "灵感", wealth: "新财源", element: .air, astrology: "水瓶座"),
            .init(num: 18, name: "The Moon", nameCn: "月亮", keyword: "恐惧", love: "欺骗", career: "潜意识", wealth: "虚假机会", element: .water, astrology: "双鱼座"),
            .init(num: 19, name: "The Sun", nameCn: "太阳", keyword: "快乐", love: "美满", career: "成功", wealth: "财运亨通", element: .fire, astrology: "太阳"),
            .init(num: 20, name: "Judgement", nameCn: "审判", keyword: "觉醒", love: "复合", career: "升职", wealth: "重新评估", element: .fire, astrology: "冥王星"),
            .init(num: 21, name: "The World", nameCn: "世界", keyword: "完成", love: "圆满", career: "达成目标", wealth: "财务自由", element: .earth, astrology: "土星"),
        ]

        var cards: [TarotCard] = []
        for m in majors {
            cards.append(TarotCard(
                id: m.num, name: m.name, nameCn: m.nameCn, suit: .major, isMajor: true,
                number: m.num, isReversed: false,
                meaningLove: m.love, meaningCareer: m.career, meaningWealth: m.wealth,
                keyword: m.keyword, element: m.element, astrology: m.astrology,
                imageDescription: "\(m.nameCn)牌面描述"
            ))
            cards.append(TarotCard(
                id: m.num + 100, name: "\(m.name) Reversed", nameCn: "逆位 \(m.nameCn)",
                suit: .major, isMajor: true, number: m.num, isReversed: true,
                meaningLove: "\(m.love)受阻", meaningCareer: "\(m.career)延迟",
                meaningWealth: "\(m.wealth)波动",
                keyword: "\(m.keyword)的阻碍", element: m.element, astrology: m.astrology,
                imageDescription: "逆位\(m.nameCn)牌面描述"
            ))
        }
        return cards
    }()
}
