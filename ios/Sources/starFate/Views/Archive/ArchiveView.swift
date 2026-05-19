import SwiftUI

struct ArchiveView: View {
    @StateObject private var viewModel = ArchiveViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Stats overview
                    statsHeader

                    // Timeline
                    timelineSection

                    // Reading history
                    historySection
                }
                .padding()
            }
            .background(Theme.background)
            .navigationTitle("命运档案")
            .task { await viewModel.loadArchive() }
            .sheet(item: $viewModel.selectedEntry) { entry in
                ArchiveDetailView(entry: entry, viewModel: viewModel)
            }
        }
    }

    // MARK: - Stats Header
    private var statsHeader: some View {
        VStack(spacing: 16) {
            Text("命运档案")
                .font(.title2).bold()
                .foregroundColor(Theme.textPrimary)

            Text("每一次占卜都记录在案\n追踪你的命运轨迹")
                .font(.caption)
                .foregroundColor(Theme.textSecondary)
                .multilineTextAlignment(.center)

            HStack(spacing: 0) {
                StatItem(value: viewModel.totalReadingsText, label: "占卜次数", icon: "book.fill", color: .purple)
                Divider().background(Theme.surfaceLight).frame(height: 40)
                StatItem(value: viewModel.streakText, label: "连续天数", icon: "flame.fill", color: .orange)
                Divider().background(Theme.surfaceLight).frame(height: 40)
                StatItem(value: viewModel.accuracyRateText, label: "应验率", icon: "target", color: .green)
            }
            .padding()
            .background(Theme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .padding()
        .background(Theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    // MARK: - Timeline
    private var timelineSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("命运时间线")
                .font(.headline)
                .foregroundColor(Theme.textPrimary)

            if viewModel.timeline.isEmpty {
                emptyTimelinePlaceholder
            } else {
                ForEach(viewModel.timeline.prefix(5)) { entry in
                    TimelineRow(entry: entry)
                }
            }

            if viewModel.timeline.count > 5 {
                Button("查看全部") {
                    // Navigate to full timeline
                }
                .font(.subheadline)
                .foregroundColor(Theme.primaryLight)
            }
        }
    }

    private var emptyTimelinePlaceholder: some View {
        VStack(spacing: 8) {
            Image(systemName: "clock")
                .font(.title)
                .foregroundColor(Theme.textMuted)
            Text("还没有占卜记录\n去进行第一次占卜吧")
                .font(.subheadline)
                .foregroundColor(Theme.textMuted)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - History
    private var historySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("历史记录")
                .font(.headline)
                .foregroundColor(Theme.textPrimary)

            // Filter chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    FilterChip(title: "全部", isSelected: viewModel.filterType == nil) {
                        viewModel.filterType = nil
                    }
                    ForEach(ReadingType.allCases, id: \.rawValue) { type in
                        FilterChip(title: type.rawValue, isSelected: viewModel.filterType == type) {
                            viewModel.filterType = type
                        }
                    }
                }
            }

            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding()
            } else if viewModel.filteredEntries.isEmpty {
                Text("暂无匹配记录")
                    .font(.subheadline)
                    .foregroundColor(Theme.textMuted)
                    .padding()
            } else {
                ForEach(viewModel.filteredEntries) { entry in
                    ArchiveRow(entry: entry)
                        .onTapGesture { viewModel.selectEntry(entry) }
                }

                if viewModel.hasMore {
                    Button("加载更多") {
                        Task { await viewModel.loadMore() }
                    }
                    .font(.subheadline)
                    .foregroundColor(Theme.primaryLight)
                    .frame(maxWidth: .infinity)
                    .padding()
                }
            }
        }
    }
}

// MARK: - Supporting Views
struct StatItem: View {
    let value: String
    let label: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.caption)
            Text(value)
                .font(.title3).bold()
                .foregroundColor(Theme.textPrimary)
            Text(label)
                .font(.caption2)
                .foregroundColor(Theme.textMuted)
        }
        .frame(maxWidth: .infinity)
    }
}

struct TimelineRow: View {
    let entry: TimelineEntry

    var body: some View {
        HStack(spacing: 12) {
            // Timeline dot + line
            VStack(spacing: 0) {
                Circle()
                    .fill(entry.isMilestone ? Theme.gold : Theme.primaryLight)
                    .frame(width: 8, height: 8)
                Rectangle()
                    .fill(Theme.surfaceLight)
                    .frame(width: 1, height: 40)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(entry.summary)
                    .font(.subheadline)
                    .foregroundColor(Theme.textPrimary)
                HStack(spacing: 8) {
                    Text(entry.date, formatter: DateFormatter.archiveDate)
                        .font(.caption2)
                        .foregroundColor(Theme.textMuted)
                    Text(entry.type.rawValue)
                        .font(.caption2)
                        .foregroundColor(Theme.primaryLight)
                    if let status = entry.predictionStatus {
                        Text(status.rawValue)
                            .font(.caption2)
                            .foregroundColor(status == .fulfilled ? Theme.energyGreen : Theme.textMuted)
                    }
                }
            }
        }
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Theme.primary : Theme.surface)
                .foregroundColor(isSelected ? .white : Theme.textSecondary)
                .clipShape(Capsule())
        }
    }
}

struct ArchiveRow: View {
    let entry: FateArchive

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(entry.type.rawValue)
                        .font(.caption)
                        .foregroundColor(Theme.primaryLight)
                    if let status = entry.predictionStatus {
                        Text(status.rawValue)
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(
                                status == .fulfilled ? Theme.energyGreen.opacity(0.2) :
                                status == .unfulfilled ? Theme.warningRed.opacity(0.2) :
                                Theme.surfaceLight
                            )
                            .foregroundColor(
                                status == .fulfilled ? Theme.energyGreen :
                                status == .unfulfilled ? Theme.warningRed :
                                Theme.textSecondary
                            )
                            .clipShape(Capsule())
                    }
                }
                Text(entry.question)
                    .font(.subheadline)
                    .foregroundColor(Theme.textPrimary)
                    .lineLimit(2)
                Text(entry.createdAt, formatter: DateFormatter.archiveDate)
                    .font(.caption2)
                    .foregroundColor(Theme.textMuted)
            }

            Spacer()

            if let score = entry.readingResult.score {
                VStack(spacing: 2) {
                    Text("\(score)")
                        .font(.headline)
                        .foregroundColor(Theme.scoreColor(score))
                    Text("分")
                        .font(.caption2)
                        .foregroundColor(Theme.textMuted)
                }
            }
        }
        .padding()
        .background(Theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Detail Sheet
struct ArchiveDetailView: View {
    let entry: FateArchive
    @ObservedObject var viewModel: ArchiveViewModel
    @State private var showPredictionUpdate = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    VStack(spacing: 8) {
                        Text(entry.type.rawValue)
                            .font(.caption)
                            .foregroundColor(Theme.primaryLight)
                        Text(entry.question)
                            .font(.title3).bold()
                            .foregroundColor(Theme.textPrimary)
                        Text(entry.createdAt, formatter: DateFormatter.archiveDate)
                            .font(.caption)
                            .foregroundColor(Theme.textMuted)
                    }
                    .frame(maxWidth: .infinity)

                    // Cards
                    if !entry.cards.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("抽取的牌")
                                .font(.headline)
                                .foregroundColor(Theme.textPrimary)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(entry.cards) { card in
                                        TarotCardView(card: card, size: .medium)
                                    }
                                }
                            }
                        }
                    }

                    // AI Interpretation
                    VStack(alignment: .leading, spacing: 8) {
                        Text("🔮 解读")
                            .font(.headline)
                            .foregroundColor(Theme.gold)
                        Text(entry.aiInterpretation)
                            .font(.body)
                            .foregroundColor(Theme.textPrimary)
                    }
                    .padding()
                    .background(Theme.surface)
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                    // Advice
                    if let advice = entry.aiAdvice {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("💡 建议")
                                .font(.headline)
                                .foregroundColor(Theme.energyGreen)
                            Text(advice)
                                .font(.body)
                                .foregroundColor(Theme.textPrimary)
                        }
                        .padding()
                        .background(Theme.surface)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }

                    // Score
                    if let score = entry.readingResult.score {
                        HStack {
                            Text("运势评分")
                            Spacer()
                            Text("\(score)")
                                .font(.title).bold()
                                .foregroundColor(Theme.scoreColor(score))
                        }
                        .padding()
                        .background(Theme.surface)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    // Prediction Status
                    VStack(alignment: .leading, spacing: 8) {
                        Text("预言追踪")
                            .font(.headline)
                            .foregroundColor(Theme.textPrimary)
                        HStack {
                            Button(action: { Task { await viewModel.updatePredictionStatus(entryId: entry.id, status: .fulfilled) } }) {
                                Label("已应验", systemImage: "checkmark")
                                    .padding(8)
                                    .background(Theme.energyGreen.opacity(0.2))
                                    .foregroundColor(Theme.energyGreen)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                            }
                            Button(action: { Task { await viewModel.updatePredictionStatus(entryId: entry.id, status: .unfulfilled) } }) {
                                Label("未应验", systemImage: "xmark")
                                    .padding(8)
                                    .background(Theme.warningRed.opacity(0.2))
                                    .foregroundColor(Theme.warningRed)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                            }
                            Button(action: { Task { await viewModel.updatePredictionStatus(entryId: entry.id, status: .partially) } }) {
                                Label("部分应验", systemImage: "arrow.clockwise")
                                    .padding(8)
                                    .background(Theme.gold.opacity(0.2))
                                    .foregroundColor(Theme.gold)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                            }
                        }
                    }
                    .padding()
                    .background(Theme.surface)
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                    // Tags
                    if !entry.tags.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("标签")
                                .font(.headline)
                                .foregroundColor(Theme.textPrimary)
                            HStack {
                                ForEach(entry.tags, id: \.self) { tag in
                                    Text(tag)
                                        .font(.caption)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Theme.surfaceLight)
                                        .foregroundColor(Theme.textSecondary)
                                        .clipShape(Capsule())
                                }
                            }
                        }
                    }
                }
                .padding()
            }
            .background(Theme.background)
            .navigationTitle("占卜详情")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("关闭") { dismiss() }
                }
            }
        }
    }
}
