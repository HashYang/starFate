import SwiftUI

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    headerView
                    // Daily Fortune Card
                    dailyFortuneCard
                    // Quick Actions
                    quickActionsGrid
                    // Streak
                    streakView
                    // Today's Activity
                    todayActivity
                }
                .padding()
            }
            .background(Theme.background)
            .navigationTitle("今日星运")
            .navigationBarTitleDisplayMode(.large)
            .task { await viewModel.loadDailyFortune() }
        }
    }

    // MARK: - Header
    private var headerView: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(Date(), formatter: DateFormatter.fortuneDate)
                    .font(.subheadline)
                    .foregroundColor(Theme.textSecondary)
                Text("今日免费占卜 \(viewModel.remainingReadings) 次")
                    .font(.caption)
                    .foregroundColor(Theme.gold)
            }
            Spacer()
            // Constellation badge
            if let fortune = viewModel.dailyFortune {
                VStack(spacing: 2) {
                    Text(fortune.constellation.rawValue)
                        .font(.caption)
                        .foregroundColor(Theme.primaryLight)
                    Text(fortune.chineseZodiac.rawValue)
                        .font(.caption2)
                        .foregroundColor(Theme.textMuted)
                }
                .padding(8)
                .background(Theme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
        }
    }

    // MARK: - Daily Fortune Card
    private var dailyFortuneCard: some View {
        Group {
            if let fortune = viewModel.dailyFortune {
                NavigationLink(destination: DailyFortuneDetailView(fortune: fortune)) {
                    FortuneCardView(fortune: fortune)
                }
                .buttonStyle(.plain)
            } else {
                LoadingFortuneCard()
            }
        }
    }

    // MARK: - Quick Actions
    private var quickActionsGrid: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("快速占卜")
                .font(.headline)
                .foregroundColor(Theme.textPrimary)

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 4), spacing: 12) {
                QuickActionButton(icon: "🃏", title: "塔罗牌") { /* navigate to tarot */ }
                QuickActionButton(icon: "⭐", title: "今日运势") { /* refresh fortune */ }
                QuickActionButton(icon: "♈", title: "星座") { /* navigate to zodiac */ }
                QuickActionButton(icon: "⚖️", title: "是非占卜") { /* navigate to yes/no */ }
            }
        }
    }

    // MARK: - Streak
    private var streakView: some View {
        HStack(spacing: 20) {
            StreakStat(icon: "flame.fill", value: "\(viewModel.dailyFortune != nil ? 1 : 0)", label: "连续天数", color: .orange)
            StreakStat(icon: "book.fill", value: "\(viewModel.todayReadingCount)", label: "今日占卜", color: .purple)
            StreakStat(icon: "checkmark.circle.fill", value: "0", label: "应验预言", color: .green)
        }
        .padding()
        .background(Theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Today Activity
    private var todayActivity: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("今日动态")
                .font(.headline)
                .foregroundColor(Theme.textPrimary)

            if viewModel.todayReadingCount == 0 {
                HStack {
                    Image(systemName: "sparkles")
                        .foregroundColor(Theme.primaryLight)
                    Text("今天还没有占卜，去看看吧")
                        .font(.subheadline)
                        .foregroundColor(Theme.textSecondary)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Theme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                Text("今天已进行了 \(viewModel.todayReadingCount) 次占卜")
                    .font(.subheadline)
                    .foregroundColor(Theme.textSecondary)
            }
        }
    }
}

// MARK: - Subviews
struct FortuneCardView: View {
    let fortune: DailyFortune

    var body: some View {
        VStack(spacing: 16) {
            HStack {
                Text("每日运势")
                    .font(.title3).bold()
                Spacer()
                Text("\(fortune.overallScore)")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundColor(Theme.scoreColor(fortune.overallScore))
            }

            HStack(spacing: 0) {
                ForEach(fortune.categories, id: \.name) { cat in
                    VStack(spacing: 4) {
                        Text(cat.nameCn.prefix(1))
                            .font(.caption2)
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Theme.surfaceLight)
                                .frame(width: 20, height: 4)
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Theme.scoreColor(cat.score))
                                .frame(width: 20 * CGFloat(cat.score) / 100, height: 4)
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
            }

            Text(fortune.generalAdvice)
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)
                .lineLimit(2)

            HStack {
                Label(fortune.luckyColor, systemImage: "paintpalette")
                Spacer()
                Label("\(fortune.luckyNumber)", systemImage: "number")
                Spacer()
                Label(fortune.luckyDirection, systemImage: "location")
            }
            .font(.caption)
            .foregroundColor(Theme.textMuted)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Theme.surface)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Theme.primaryLight.opacity(0.3), lineWidth: 1)
                )
        )
    }
}

struct LoadingFortuneCard: View {
    @State private var isAnimating = false

    var body: some View {
        VStack(spacing: 16) {
            Circle()
                .trim(from: 0, to: 0.7)
                .stroke(Theme.primaryLight, lineWidth: 3)
                .frame(width: 40, height: 40)
                .rotationEffect(.degrees(isAnimating ? 360 : 0))
                .onAppear { withAnimation(.linear(duration: 1).repeatForever(autoreverses: false)) { isAnimating = true } }

            Text("星辰正在读取你的运势...")
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)
        }
        .padding(40)
        .frame(maxWidth: .infinity)
        .background(Theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}

struct QuickActionButton: View {
    let icon: String
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Text(icon)
                    .font(.title2)
                Text(title)
                    .font(.caption2)
                    .foregroundColor(Theme.textSecondary)
            }
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(Theme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

struct StreakStat: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(color)
            VStack(alignment: .leading, spacing: 1) {
                Text(value)
                    .font(.title3).bold()
                    .foregroundColor(Theme.textPrimary)
                Text(label)
                    .font(.caption2)
                    .foregroundColor(Theme.textMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Placeholder (will be replaced)
struct DailyFortuneDetailView: View {
    let fortune: DailyFortune
    var body: some View {
        Text("运势详情 - \(fortune.date.description)")
            .navigationTitle("运势详情")
    }
}
