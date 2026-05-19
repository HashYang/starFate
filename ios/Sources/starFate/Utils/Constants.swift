import Foundation

struct Constants {
    // API
    static let baseURL = Bundle.main.infoDictionary?["API_BASE_URL"] as? String ?? "http://localhost:3000"
    static let apiVersion = "v1"

    // Limits
    static let maxFreeReadingsPerDay = 3
    static let maxQuestionLength = 500
    static let archivePageSize = 20

    // Feature Flags
    static let enableVoiceInput = false
    static let enableWidget = true
    static let enableStreakReminder = true

    // Storage Keys
    static let keychainService = "com.starfate.app"
    static let userDefaultsSuite = "group.com.starfate.app"
}

extension DateFormatter {
    static let archiveDate: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy年M月d日 HH:mm"
        f.locale = Locale(identifier: "zh_CN")
        return f
    }()

    static let fortuneDate: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "M月d日 EEEE"
        f.locale = Locale(identifier: "zh_CN")
        return f
    }()

    static let monthKey: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM"
        return f
    }()
}
