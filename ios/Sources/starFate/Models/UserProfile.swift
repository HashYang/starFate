import Foundation

struct UserProfile: Codable, Identifiable {
    let id: String
    var nickname: String
    var birthDate: Date
    var birthHour: Int?
    var birthMinute: Int?
    var birthPlace: String?
    var gender: String?
    var avatarUrl: String?

    // Computed
    var zodiac: Zodiac {
        Zodiac.from(date: birthDate)
    }

    var constellation: Constellation {
        Constellation.from(date: birthDate)
    }

    var chineseZodiac: ChineseZodiac {
        ChineseZodiac.from(year: Calendar.current.component(.year, from: birthDate))
    }

    // Stats
    var totalReadings: Int = 0
    var currentStreak: Int = 0
    var longestStreak: Int = 0
    var memberDays: Int = 0
    var fulfilledPredictions: Int = 0

    var createdAt: Date = Date()
    var lastActiveAt: Date = Date()
}

enum Zodiac: String, Codable, CaseIterable {
    case aries = "白羊座"
    case taurus = "金牛座"
    case gemini = "双子座"
    case cancer = "巨蟹座"
    case leo = "狮子座"
    case virgo = "处女座"
    case libra = "天秤座"
    case scorpio = "天蝎座"
    case sagittarius = "射手座"
    case capricorn = "摩羯座"
    case aquarius = "水瓶座"
    case pisces = "双鱼座"

    static func from(date: Date) -> Zodiac {
        let calendar = Calendar.current
        let month = calendar.component(.month, from: date)
        let day = calendar.component(.day, from: date)
        switch (month, day) {
        case (3, 21...31), (4, 1...19): return .aries
        case (4, 20...30), (5, 1...20): return .taurus
        case (5, 21...31), (6, 1...21): return .gemini
        case (6, 22...30), (7, 1...22): return .cancer
        case (7, 23...31), (8, 1...22): return .leo
        case (8, 23...31), (9, 1...22): return .virgo
        case (9, 23...30), (10, 1...23): return .libra
        case (10, 24...31), (11, 1...22): return .scorpio
        case (11, 23...30), (12, 1...21): return .sagittarius
        case (12, 22...31), (1, 1...19): return .capricorn
        case (1, 20...31), (2, 1...18): return .aquarius
        default: return .pisces
        }
    }
}

enum Constellation: String, Codable, CaseIterable {
    case aries = "白羊"
    case taurus = "金牛"
    case gemini = "双子"
    case cancer = "巨蟹"
    case leo = "狮子"
    case virgo = "处女"
    case libra = "天秤"
    case scorpio = "天蝎"
    case ophiuchus = "蛇夫"
    case sagittarius = "射手"
    case capricorn = "摩羯"
    case aquarius = "水瓶"
    case pisces = "双鱼"

    static func from(date: Date) -> Constellation {
        let calendar = Calendar.current
        let month = calendar.component(.month, from: date)
        let day = calendar.component(.day, from: date)
        switch (month, day) {
        case (1, 1...19): return .capricorn
        case (1, 20...31), (2, 1...18): return .aquarius
        case (2, 19...28), (3, 1...20): return .pisces
        case (3, 21...31), (4, 1...19): return .aries
        case (4, 20...30), (5, 1...20): return .taurus
        case (5, 21...31), (6, 1...21): return .gemini
        case (6, 22...30), (7, 1...22): return .cancer
        case (7, 23...31), (8, 1...22): return .leo
        case (8, 23...31), (9, 1...22): return .virgo
        case (9, 23...30), (10, 1...22): return .libra
        case (10, 23...31), (11, 1...21): return .scorpio
        case (11, 22...30), (12, 1...21): return .sagittarius
        default: return .ophiuchus
        }
    }
}

enum ChineseZodiac: String, Codable, CaseIterable {
    case rat = "鼠"
    case ox = "牛"
    case tiger = "虎"
    case rabbit = "兔"
    case dragon = "龙"
    case snake = "蛇"
    case horse = "马"
    case goat = "羊"
    case monkey = "猴"
    case rooster = "鸡"
    case dog = "狗"
    case pig = "猪"

    static func from(year: Int) -> ChineseZodiac {
        let animals = Self.allCases
        return animals[(year - 4) % 12]
    }
}
