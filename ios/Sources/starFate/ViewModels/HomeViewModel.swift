import Foundation

@MainActor
class HomeViewModel: ObservableObject {
    @Published var dailyFortune: DailyFortune?
    @Published var todayReadingCount = 0
    @Published var isLoading = false
    @Published var error: Error?

    private var userId: String? { AuthManager.shared.userId }

    func loadDailyFortune() async {
        guard let userId else { return }
        isLoading = true
        error = nil
        do {
            dailyFortune = try await APIClient.shared.dailyFortune(userId: userId)
        } catch {
            self.error = error
        }
        isLoading = false
    }

    func loadTodayReadingCount() async {
        // Would be from local tracking or API
        // Simple local tracking for MVP
        let today = Calendar.current.startOfDay(for: Date())
        let key = "readings_\(today.timeIntervalSince1970)"
        todayReadingCount = UserDefaults.standard.integer(forKey: key)
    }

    func recordReading() {
        let today = Calendar.current.startOfDay(for: Date())
        let key = "readings_\(today.timeIntervalSince1970)"
        let count = UserDefaults.standard.integer(forKey: key)
        UserDefaults.standard.set(count + 1, forKey: key)
        todayReadingCount = count + 1
    }

    var isAtLimit: Bool {
        todayReadingCount >= Constants.maxFreeReadingsPerDay
    }

    var remainingReadings: Int {
        max(0, Constants.maxFreeReadingsPerDay - todayReadingCount)
    }
}
