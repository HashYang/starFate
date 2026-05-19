import Foundation

/// 命运档案 — 核心差异化功能
/// 每次占卜都记录为一条档案条目，累积形成用户的命运时间线
struct FateArchive: Codable, Identifiable {
    let id: String
    let userId: String
    let type: ReadingType
    let question: String
    let readingResult: ReadingResult
    let aiInterpretation: String
    let aiAdvice: String?

    // 卡片信息
    let cards: [TarotCard]
    let spreadName: String?

    // 元数据
    let createdAt: Date
    let tags: [String]

    // 预言追踪
    var predictionStatus: PredictionStatus?
    var predictionDueDate: Date?
    var predictionNote: String?

    // 用户反馈
    var userRating: Int? // 1-5
    var userReflection: String?
    var isShared: Bool = false
}

enum ReadingType: String, Codable, CaseIterable {
    case tarot = "塔罗占卜"
    case dailyFortune = "每日运势"
    case zodiac = "星座运势"
    case chineseZodiac = "生肖运势"
    case numerology = "数字占卜"
    case yesNo = "是非占卜"
    case custom = "自定义占卜"

    var icon: String {
        switch self {
        case .tarot: return "🃏"
        case .dailyFortune: return "⭐"
        case .zodiac: return "♈"
        case .chineseZodiac: return "🐉"
        case .numerology: return "🔢"
        case .yesNo: return "⚖️"
        case .custom: return "✨"
        }
    }
}

struct ReadingResult: Codable {
    let summary: String
    let details: String
    let score: Int? // 运势分数 1-100
    let luckyColor: String?
    let luckyNumber: Int?
    let luckyDirection: String?
    let advice: String?
    let timing: String? // 应期
}

enum PredictionStatus: String, Codable {
    case pending = "待验证"
    case fulfilled = "已应验"
    case unfulfilled = "未应验"
    case partially = "部分应验"

    var icon: String {
        switch self {
        case .pending: return "⏳"
        case .fulfilled: return "✅"
        case .unfulfilled: return "❌"
        case .partially: return "🔄"
        }
    }
}

// MARK: - 档案统计数据
struct ArchiveStats: Codable {
    let totalReadings: Int
    let totalQuestions: Int
    let totalCardsDrawn: Int
    let fulfilledPredictions: Int
    let pendingPredictions: Int
    let accuracyRate: Double // 0-1

    let topTags: [TagCount]
    let streakDays: Int
    let longestStreak: Int
    let memberDays: Int

    // 随时间变化的趋势
    let readingsByMonth: [MonthlyReading]
    let commonCards: [CardFrequency]
}

struct TagCount: Codable, Identifiable {
    let tag: String
    let count: Int
    var id: String { tag }
}

struct CardFrequency: Codable, Identifiable {
    let cardName: String
    let count: Int
    var id: String { cardName }
}

struct MonthlyReading: Codable, Identifiable {
    let month: String // "2026-01"
    let count: Int
    let primaryType: ReadingType

    var id: String { month }
}

// MARK: - 命运时间线条目
struct TimelineEntry: Codable, Identifiable {
    let id: String
    let date: Date
    let type: ReadingType
    let summary: String
    let predictionStatus: PredictionStatus?
    let score: Int?
    let isMilestone: Bool
    let milestoneTitle: String?
}
