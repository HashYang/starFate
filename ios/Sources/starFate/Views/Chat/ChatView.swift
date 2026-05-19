import SwiftUI

struct ChatView: View {
    @StateObject private var viewModel = ChatViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Messages
                ScrollViewReader { scrollProxy in
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(viewModel.messages) { msg in
                                MessageBubble(message: msg)
                            }

                            // Card dealing animation
                            if viewModel.isDealingCards {
                                cardDealingView
                            }

                            if viewModel.showInterpretation {
                                interpretationView
                            }
                        }
                        .padding()
                    }
                    .onChange(of: viewModel.messages.count) { _, _ in
                        withAnimation { scrollProxy.scrollTo("bottom", anchor: .bottom) }
                    }
                }

                // Spread picker
                if !viewModel.isLoading {
                    spreadPickerBar
                }

                // Input
                inputBar
            }
            .background(Theme.background)
            .navigationTitle("星命占卜")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: viewModel.resetChat) {
                        Image(systemName: "arrow.counterclockwise")
                    }
                }
            }
        }
    }

    // MARK: - Card Dealing Animation
    private var cardDealingView: some View {
        VStack(spacing: 16) {
            Text("命运之牌正在展开...")
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)

            HStack(spacing: 12) {
                ForEach(0..<viewModel.selectedSpread.cardCount, id: \.self) { i in
                    CardBackView()
                        .opacity(i < viewModel.dealtCardCount ? 0 : 1)
                        .scaleEffect(i < viewModel.dealtCardCount ? 0.01 : 1)
                        .animation(.spring(response: 0.5, dampingFraction: 0.7).delay(Double(i) * 0.15), value: viewModel.dealtCardCount)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
    }

    // MARK: - Interpretation
    private var interpretationView: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("🔮 解读")
                .font(.headline)
                .foregroundColor(Theme.gold)

            if let reading = viewModel.currentReading {
                // Display drawn cards first
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(reading.cards) { card in
                            TarotCardView(card: card, size: .small)
                        }
                    }
                }

                // The interpretation text
                Text(reading.interpretation)
                    .font(.body)
                    .foregroundColor(Theme.textPrimary)
            }
        }
        .padding()
        .background(Theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .transition(.opacity.combined(with: .move(edge: .bottom)))
    }

    // MARK: - Spread Picker
    private var spreadPickerBar: some View {
        HStack {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(TarotSpread.defaultSpreads) { spread in
                        Button(action: { viewModel.selectSpread(spread) }) {
                            Text(spread.nameCn)
                                .font(.caption)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(viewModel.selectedSpread.id == spread.id ? Theme.primary : Theme.surface)
                                .foregroundColor(viewModel.selectedSpread.id == spread.id ? .white : Theme.textSecondary)
                                .clipShape(Capsule())
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.vertical, 8)
        .background(Theme.surfaceLight.opacity(0.5))
    }

    // MARK: - Input Bar
    private var inputBar: some View {
        HStack(spacing: 12) {
            TextField("向星命提问...", text: $viewModel.inputText)
                .textFieldStyle(.plain)
                .padding(12)
                .background(Theme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .disabled(viewModel.isLoading)

            Button(action: { Task { await viewModel.sendMessage() } }) {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.title2)
                    .foregroundColor(viewModel.inputText.isEmpty || viewModel.isLoading ? Theme.textMuted : Theme.primary)
            }
            .disabled(viewModel.inputText.isEmpty || viewModel.isLoading)
        }
        .padding()
        .background(Theme.background)
    }
}

// MARK: - Subviews
struct MessageBubble: View {
    let message: ChatMessage

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            if message.isUser {
                Spacer(minLength: 60)
            } else {
                Image(systemName: "sparkles")
                    .foregroundColor(Theme.gold)
                    .font(.caption)
            }

            VStack(alignment: message.isUser ? .trailing : .leading, spacing: 8) {
                Text(message.content)
                    .font(.body)
                    .foregroundColor(Theme.textPrimary)
                    .padding(12)
                    .background(message.isUser ? Theme.primary.opacity(0.3) : Theme.surface)
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                // Cards if any
                if let cards = message.cards, !cards.isEmpty {
                    HStack(spacing: 8) {
                        ForEach(cards) { card in
                            TarotCardView(card: card, size: .small)
                        }
                    }
                }

                Text(message.timestamp, style: .time)
                    .font(.caption2)
                    .foregroundColor(Theme.textMuted)
            }

            if !message.isUser {
                Spacer(minLength: 60)
            }
        }
    }
}

struct CardBackView: View {
    var body: some View {
        RoundedRectangle(cornerRadius: 8)
            .fill(LinearGradient(
                colors: [Theme.primaryDark, Theme.surfaceLight],
                startPoint: .topLeading, endPoint: .bottomTrailing
            ))
            .frame(width: 60, height: 90)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Theme.gold.opacity(0.5), lineWidth: 1)
            )
            .overlay(
                Image(systemName: "star")
                    .foregroundColor(Theme.gold.opacity(0.5))
            )
    }
}
