import Foundation

@MainActor
class ArchiveViewModel: ObservableObject {
    @Published var entries: [FateArchive] = []
    @Published var stats: ArchiveStats?
    @Published var timeline: [TimelineEntry] = []
    @Published var selectedEntry: FateArchive?

    @Published var filterType: ReadingType?
    @Published var filterPredictionStatus: PredictionStatus?

    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var error: Error?
    @Published var hasMore = true

    private var currentPage = 1
    private var userId: String? { AuthManager.shared.userId }
    private let manager = ArchiveManager.shared

    var filteredEntries: [FateArchive] {
        var result = entries
        if let filterType {
            result = result.filter { $0.type == filterType }
        }
        if let filterPredictionStatus {
            result = result.filter { $0.predictionStatus == filterPredictionStatus }
        }
        return result.sorted { $0.createdAt > $1.createdAt }
    }

    func loadArchive() async {
        guard let userId else { return }
        isLoading = true
        error = nil
        currentPage = 1

        await manager.loadArchives(userId: userId, page: 1)
        await manager.loadStats(userId: userId)
        await manager.loadTimeline(userId: userId)

        entries = manager.archives
        stats = manager.stats
        timeline = manager.timeline
        hasMore = manager.archives.count >= Constants.archivePageSize
        isLoading = false
    }

    func loadMore() async {
        guard let userId, hasMore, !isLoadingMore else { return }
        isLoadingMore = true
        currentPage += 1

        let oldCount = manager.archives.count
        await manager.loadArchives(userId: userId, page: currentPage)
        entries = manager.archives
        hasMore = manager.archives.count > oldCount
        isLoadingMore = false
    }

    func updatePredictionStatus(entryId: String, status: PredictionStatus, note: String? = nil) async {
        await manager.updatePredictionStatus(entryId: entryId, status: status, note: note)
        entries = manager.archives
        if let idx = entries.firstIndex(where: { $0.id == entryId }) {
            selectedEntry = entries[idx]
        }
    }

    func selectEntry(_ entry: FateArchive) {
        selectedEntry = entry
    }

    var accuracyRateText: String {
        guard let stats else { return "--" }
        return "\(Int(stats.accuracyRate * 100))%"
    }

    var totalReadingsText: String {
        guard let stats else { return "--" }
        return "\(stats.totalReadings)"
    }

    var streakText: String {
        guard let stats else { return "--" }
        return "\(stats.streakDays) 天"
    }
}
