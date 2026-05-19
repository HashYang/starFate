import SwiftUI

struct TarotCardView: View {
    let card: TarotCard
    var size: CardSize = .medium
    @State private var isFlipped = false

    enum CardSize {
        case small, medium, large

        var width: CGFloat {
            switch self {
            case .small: return 60
            case .medium: return 100
            case .large: return 140
            }
        }

        var height: CGFloat {
            switch self {
            case .small: return 90
            case .medium: return 150
            case .large: return 210
            }
        }

        var font: Font {
            switch self {
            case .small: return .caption2
            case .medium: return .caption
            case .large: return .subheadline
            }
        }
    }

    var body: some View {
        ZStack {
            // Card Back (shown when not flipped)
            if !isFlipped {
                cardBack
                    .onTapGesture {
                        withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                            isFlipped = true
                        }
                    }
            } else {
                // Card Front
                cardFront
            }
        }
        .frame(width: size.width, height: size.height)
    }

    private var cardBack: some View {
        RoundedRectangle(cornerRadius: 10)
            .fill(LinearGradient(
                colors: [Theme.primaryDark, Color(red: 0.15, green: 0.05, blue: 0.25)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            ))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Theme.gold.opacity(0.6), lineWidth: 1.5)
            )
            .overlay(
                VStack(spacing: 4) {
                    Image(systemName: "sparkles")
                        .foregroundColor(Theme.gold.opacity(0.8))
                    Text("?")
                        .font(.title2)
                        .foregroundColor(Theme.gold.opacity(0.5))
                }
            )
    }

    private var cardFront: some View {
        RoundedRectangle(cornerRadius: 10)
            .fill(Theme.surface)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(
                        card.isReversed ? Theme.warningRed.opacity(0.6) : Theme.primaryLight.opacity(0.6),
                        lineWidth: 1.5
                    )
            )
            .overlay(
                VStack(spacing: 4) {
                    Text(card.suit.rawValue.prefix(1))
                        .font(size.font)
                        .foregroundColor(suitColor)

                    Text(card.nameCn)
                        .font(size.font)
                        .fontWeight(.bold)
                        .foregroundColor(Theme.textPrimary)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .minimumScaleFactor(0.7)

                    if card.isReversed {
                        Text("逆位")
                            .font(.system(size: 8))
                            .foregroundColor(Theme.warningRed)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 1)
                            .background(Theme.warningRed.opacity(0.2))
                            .clipShape(Capsule())
                    }

                    Text(card.keyword)
                        .font(.system(size: size == .small ? 6 : 8))
                        .foregroundColor(Theme.textMuted)
                        .lineLimit(1)
                }
                .padding(4)
            )
            .rotationEffect(card.isReversed ? .degrees(180) : .degrees(0))
    }

    private var suitColor: Color {
        switch card.suit {
        case .major: return Theme.gold
        case .cups: return Theme.mysticBlue
        case .wands: return .orange
        case .swords: return Theme.textSecondary
        case .pentacles: return Theme.energyGreen
        }
    }
}

// MARK: - Loading Animation Component
struct MysticLoadingView: View {
    @State private var rotation = 0.0
    @State private var opacity = 0.6
    var text: String = "星辰正在运转..."

    var body: some View {
        VStack(spacing: 16) {
            ZStack {
                ForEach(0..<3) { i in
                    Circle()
                        .trim(from: 0, to: 0.4)
                        .stroke(
                            AngularGradient(
                                colors: [Theme.primaryLight, Theme.gold, Theme.mysticBlue],
                                center: .center
                            ),
                            style: StrokeStyle(lineWidth: 2, lineCap: .round)
                        )
                        .frame(width: 40 + CGFloat(i * 12), height: 40 + CGFloat(i * 12))
                        .rotationEffect(.degrees(rotation + Double(i * 120)))
                }
            }

            Text(text)
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)
                .opacity(opacity)
        }
        .onAppear {
            withAnimation(.linear(duration: 2).repeatForever(autoreverses: false)) {
                rotation = 360
            }
            withAnimation(Animations.pulse) {
                opacity = 1.0
            }
        }
    }
}

// MARK: - Share Card Component
struct ShareCardView: View {
    let archive: FateArchive

    var body: some View {
        ZStack {
            MysticGradient.background

            VStack(spacing: 16) {
                Text("🔮 星命占卜")
                    .font(.title2).bold()
                    .foregroundColor(Theme.gold)

                Text(archive.question)
                    .font(.body)
                    .foregroundColor(Theme.textPrimary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                if !archive.cards.isEmpty {
                    HStack(spacing: 8) {
                        ForEach(archive.cards.prefix(3)) { card in
                            TarotCardView(card: card, size: .small)
                        }
                    }
                }

                Text(archive.readingResult.summary)
                    .font(.subheadline)
                    .foregroundColor(Theme.textSecondary)
                    .lineLimit(4)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                if let score = archive.readingResult.score {
                    Text("运势评分: \(score)")
                        .font(.headline)
                        .foregroundColor(Theme.scoreColor(score))
                }

                Text("—— 来自星命 App ——")
                    .font(.caption)
                    .foregroundColor(Theme.textMuted)
            }
            .padding()
        }
        .frame(width: 300, height: 500)
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}
