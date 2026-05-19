import Foundation

/// 命运档案管理器 — 本地缓存 + 远程同步
@MainActor
class ArchiveManager: ObservableObject {
    static let shared = ArchiveManager()

    @Published var archives: [FateArchive] = []
    @Published var stats: ArchiveStats?
    @Published var timeline: [TimelineEntry] = []
    @Published var isLoading = false
    @Published var error: Error?

    private let cacheKey = "cached_archives"
    private let statsCacheKey = "cached_stats"

    init() {
        loadCache()
    }

    // MARK: - 加载档案列表
    func loadArchives(userId: String, page: Int = 1) async {
        isLoading = true
        error = nil
        do {
            let response = try await APIClient.shared.archiveList(userId: userId, page: page)
            if page == 1 {
                archives = response.items
            } else {
                archives.append(contentsOf: response.items)
            }
            saveCache()
        } catch {
            self.error = error
        }
        isLoading = false
    }

    // MARK: - 加载档案统计
    func loadStats(userId: String) async {
        do {
            stats = try await APIClient.shared.archiveStats(userId: userId)
            saveCache()
        } catch {
            self.error = error
        }
    }

    // MARK: - 加载时间线
    func loadTimeline(userId: String) async {
        do {
            timeline = try await APIClient.shared.archiveTimeline(userId: userId)
        } catch {
            self.error = error
        }
    }

    // MARK: - 更新预言状态
    func updatePredictionStatus(entryId: String, status: PredictionStatus, note: String? = nil) async {
        do {
            let updated = try await APIClient.shared.updatePredictionStatus(id: entryId, status: status, note: note)
            if let index = archives.firstIndex(where: { $0.id == entryId }) {
                archives[index] = updated
            }
        } catch {
            self.error = error
        }
    }

    // MARK: - 本地缓存
    private func loadCache() {
        guard let data = UserDefaults.standard.data(forKey: cacheKey),
              let decoded = try? JSONDecoder().decode([FateArchive].self, from: data) else {
            return
        }
        archives = decoded
    }

    private func saveCache() {
        guard let data = try? JSONEncoder().encode(archives) else { return }
        UserDefaults.standard.set(data, forKey: cacheKey)
    }

    func clearCache() {
        UserDefaults.standard.removeObject(forKey: cacheKey)
        UserDefaults.standard.removeObject(forKey: statsCacheKey)
        archives = []
        stats = nil
        timeline = []
    }
}
