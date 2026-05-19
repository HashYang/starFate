import Foundation

struct DailyFortune: Codable, Identifiable {
    let id: String
    let userId: String
    let date: Date
    let overallScore: Int
    let categories: [FortuneCategory]

    // 综合
    let generalAdvice: String
    let luckyColor: String
    let luckyNumber: Int
    let luckyDirection: String
    let luckyTime: String?

    // 星座相关
    let constellation: Constellation
    let chineseZodiac: ChineseZodiac

    // AI 运势诗句
    let poemLine: String?
    let poemInterpretation: String?

    // 提醒
    let reminders: [String]
    let isRead: Bool = false
    let createdAt: Date = Date()
}

struct FortuneCategory: Codable, Identifiable {
    let name: String
    let nameCn: String
    let score: Int // 1-100
    let description: String
    let advice: String

    var id: String { name }

    static let all: [FortuneCategory] = [
        FortuneCategory(name: "love", nameCn: "爱情", score: 0, description: "", advice: ""),
        FortuneCategory(name: "career", nameCn: "事业", score: 0, description: "", advice: ""),
        FortuneCategory(name: "wealth", nameCn: "财运", score: 0, description: "", advice: ""),
        FortuneCategory(name: "health", nameCn: "健康", score: 0, description: "", advice: ""),
        FortuneCategory(name: "study", nameCn: "学业", score: 0, description: "", advice: ""),
    ]
}
