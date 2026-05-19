import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ZStack {
            if appState.isAuthenticated {
                MainTabView()
            } else {
                OnboardingView()
            }
        }
    }
}

struct MainTabView: View {
    @State private var selectedTab: Tab = .home

    enum Tab: String, CaseIterable {
        case home = "今日"
        case chat = "占卜"
        case archive = "档案"
        case profile = "我的"

        var icon: String {
            switch self {
            case .home: return "sparkles"
            case .chat: return "message.fill"
            case .archive: return "clock.fill"
            case .profile: return "person.fill"
            }
        }
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Image(systemName: Tab.home.icon)
                    Text(Tab.home.rawValue)
                }
                .tag(Tab.home)

            ChatView()
                .tabItem {
                    Image(systemName: Tab.chat.icon)
                    Text(Tab.chat.rawValue)
                }
                .tag(Tab.chat)

            ArchiveView()
                .tabItem {
                    Image(systemName: Tab.archive.icon)
                    Text(Tab.archive.rawValue)
                }
                .tag(Tab.archive)

            ProfileView()
                .tabItem {
                    Image(systemName: Tab.profile.icon)
                    Text(Tab.profile.rawValue)
                }
                .tag(Tab.profile)
        }
        .tint(.purple)
    }
}

struct OnboardingView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        VStack(spacing: 30) {
            Spacer()

            Image(systemName: "sparkles")
                .font(.system(size: 80))
                .foregroundStyle(.purple)

            Text("星命")
                .font(.largeTitle)
                .bold()

            Text("你的 AI 命运伴侣\n记录每一次命运的指引")
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)

            Spacer()

            Button(action: { appState.isAuthenticated = true }) {
                Text("开始探索命运")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding(.horizontal, 40)
                    .padding(.vertical, 16)
                    .background(.purple)
                    .clipShape(Capsule())
            }

            Spacer().frame(height: 50)
        }
        .padding()
    }
}

class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var userProfile: UserProfile?
    @Published var dailyFortune: DailyFortune?
}
