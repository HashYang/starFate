import Foundation

@MainActor
final class AuthManager: ObservableObject {
    static let shared = AuthManager()

    private static func restoreSession() -> (isAuth: Bool, user: UserProfile?) {
        guard let token = UserDefaults.standard.string(forKey: "auth_token"),
              UserDefaults.standard.string(forKey: "user_id") != nil else {
            return (false, nil)
        }
        APIClient.shared.setToken(token)
        return (true, nil)
    }

    @Published var isAuthenticated = false
    @Published var currentUser: UserProfile?
    @Published var isLoading = false

    private let tokenKey = "auth_token"
    private let userIdKey = "user_id"

    init() {
        Task { @MainActor in
            let (isAuth, user) = Self.restoreSession()
            self.isAuthenticated = isAuth
            self.currentUser = user
        }
    }

    func register(nickname: String, birthDate: Date) async throws {
        await MainActor.run { isLoading = true }
        defer { Task { @MainActor in self.isLoading = false } }

        let response = try await APIClient.shared.register(nickname: nickname, birthDate: birthDate)

        await MainActor.run {
            UserDefaults.standard.set(response.token, forKey: self.tokenKey)
            UserDefaults.standard.set(response.user.id, forKey: self.userIdKey)
            APIClient.shared.setToken(response.token)
            self.currentUser = response.user
            self.isAuthenticated = true
        }
    }

    func logout() {
        UserDefaults.standard.removeObject(forKey: tokenKey)
        UserDefaults.standard.removeObject(forKey: userIdKey)
        APIClient.shared.setToken(nil)
        currentUser = nil
        isAuthenticated = false
    }

    var userId: String? {
        UserDefaults.standard.string(forKey: userIdKey)
    }
}
