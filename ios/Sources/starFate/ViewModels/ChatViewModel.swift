import Foundation

@MainActor
class ChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var inputText = ""
    @Published var isLoading = false
    @Published var showSpreadPicker = false
    @Published var selectedSpread: TarotSpread = .defaultSpreads[1] // 三牌默认
    @Published var drawnCards: [TarotCard] = []
    @Published var currentReading: ReadingSession?
    @Published var error: Error?

    // 动画状态
    @Published var isDealingCards = false
    @Published var dealtCardCount = 0
    @Published var showInterpretation = false

    private var userId: String? { AuthManager.shared.userId }
    private var currentContextId: String?

    func sendMessage() async {
        guard let userId, !inputText.trimmingCharacters(in: .whitespaces).isEmpty else { return }

        let question = inputText.trimmingCharacters(in: .whitespaces)
        inputText = ""

        // Add user message
        messages.append(ChatMessage(content: question, isUser: true))

        isLoading = true
        error = nil

        do {
            // If this is a fortune-telling request, do tarot reading
            if shouldDoTarot(question) {
                let reading = try await APIClient.shared.tarotReading(
                    question: question,
                    spreadId: selectedSpread.id,
                    userId: userId
                )
                currentReading = reading
                drawnCards = reading.cards

                // Animate card dealing
                isDealingCards = true
                dealtCardCount = 0

                // Cards dealt one by one
                for i in 0..<reading.cards.count {
                    try? await Task.sleep(nanoseconds: 300_000_000) // 0.3s
                    dealtCardCount = i + 1
                }

                isDealingCards = false
                showInterpretation = true

                messages.append(ChatMessage(
                    content: reading.interpretation,
                    isUser: false,
                    cards: reading.cards
                ))
                currentContextId = reading.sessionId
            } else {
                // Normal chat with AI fortuneteller
                let response = try await APIClient.shared.chat(
                    message: question,
                    userId: userId,
                    contextId: currentContextId
                )
                messages.append(ChatMessage(content: response.reply, isUser: false))
                currentContextId = response.contextId
            }
        } catch {
            self.error = error
            messages.append(ChatMessage(content: "抱歉，星命暂时无法回应，请稍后再试 🙏", isUser: false))
        }

        isLoading = false
    }

    func selectSpread(_ spread: TarotSpread) {
        selectedSpread = spread
        showSpreadPicker = false
    }

    func resetChat() {
        messages = []
        drawnCards = []
        currentReading = nil
        currentContextId = nil
        showInterpretation = false
        isDealingCards = false
    }

    // Simple heuristic: if question asks about fortune/love/career etc.
    private func shouldDoTarot(_ question: String) -> Bool {
        let keywords = ["占卜", "运势", "感情", "事业", "财运", "爱情",
                        "工作", "健康", "学业", "未来", "选择", "是否",
                        "tarot", "fortune", "love", "career"]
        return keywords.contains { question.lowercased().contains($0) }
    }
}

struct ChatMessage: Identifiable, Equatable {
    let id = UUID().uuidString
    let content: String
    let isUser: Bool
    let timestamp: Date = Date()
    let cards: [TarotCard]?

    init(content: String, isUser: Bool, cards: [TarotCard]? = nil) {
        self.content = content
        self.isUser = isUser
        self.cards = cards
    }
}

struct ReadingSession: Codable, Identifiable {
    let sessionId: String
    var id: String { sessionId }
    let question: String
    let cards: [TarotCard]
    let interpretation: String
    let spreadName: String
    let archivedId: String?
}
