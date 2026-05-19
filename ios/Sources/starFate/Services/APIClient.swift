import Foundation
import os

enum APIError: LocalizedError {
    case invalidURL
    case noData
    case decodingFailed(Error)
    case networkError(Error)
    case serverError(statusCode: Int, message: String?)
    case unauthorized
    case rateLimited

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "无效的请求地址"
        case .noData: return "暂无数据"
        case .decodingFailed: return "数据解析失败"
        case .networkError(let e): return "网络错误: \(e.localizedDescription)"
        case .serverError(let code, let msg): return msg ?? "服务器错误 (\(code))"
        case .unauthorized: return "登录已过期，请重新登录"
        case .rateLimited: return "今日免费次数已用完"
        }
    }
}

final class APIClient: @unchecked Sendable {
    static let shared = APIClient()
    private let session: URLSession
    private let lock = OSAllocatedUnfairLock()
    private var _token: String?

    private var token: String? {
        get { lock.lock(); defer { lock.unlock() }; return _token }
        set { lock.lock(); defer { lock.unlock() }; _token = newValue }
    }

    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)
    }

    func setToken(_ token: String?) {
        self.token = token
    }

    // MARK: - Request Builder
    private func makeRequest(
        path: String,
        method: String = "GET",
        body: Encodable? = nil,
        queryItems: [URLQueryItem]? = nil
    ) throws -> URLRequest {
        guard var components = URLComponents(string: "\(Constants.baseURL)/api/\(Constants.apiVersion)\(path)") else {
            throw APIError.invalidURL
        }
        components.queryItems = queryItems

        guard let url = components.url else { throw APIError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            request.httpBody = try JSONEncoder().encode(body)
        }

        return request
    }

    // MARK: - Generic Request
    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.serverError(statusCode: 0, message: nil)
        }

        switch httpResponse.statusCode {
        case 200...299:
            do {
                return try JSONDecoder().decode(T.self, from: data)
            } catch {
                throw APIError.decodingFailed(error)
            }
        case 401:
            throw APIError.unauthorized
        case 429:
            throw APIError.rateLimited
        default:
            let msg = try? JSONDecoder().decode(ErrorResponse.self, from: data).message
            throw APIError.serverError(statusCode: httpResponse.statusCode, message: msg)
        }
    }

    // MARK: - API Methods

    // 占卜
    func tarotReading(question: String, spreadId: String, userId: String) async throws -> ReadingSession {
        let body = TarotRequest(question: question, spreadId: spreadId, userId: userId)
        let req = try makeRequest(path: "/readings/tarot", method: "POST", body: body)
        return try await perform(req)
    }

    // 每日运势
    func dailyFortune(userId: String) async throws -> DailyFortune {
        let req = try makeRequest(path: "/readings/daily-fortune/\(userId)", method: "GET")
        return try await perform(req)
    }

    // 命运档案列表
    func archiveList(userId: String, page: Int = 1, pageSize: Int = 20) async throws -> PaginatedResponse<FateArchive> {
        let query = [URLQueryItem(name: "page", value: "\(page)"), URLQueryItem(name: "pageSize", value: "\(pageSize)")]
        let req = try makeRequest(path: "/archive/\(userId)", queryItems: query)
        return try await perform(req)
    }

    // 档案详情
    func archiveDetail(id: String) async throws -> FateArchive {
        let req = try makeRequest(path: "/archive/entry/\(id)")
        return try await perform(req)
    }

    // 更新预言状态
    func updatePredictionStatus(id: String, status: PredictionStatus, note: String?) async throws -> FateArchive {
        let body = PredictionUpdate(status: status.rawValue, note: note)
        let req = try makeRequest(path: "/archive/entry/\(id)/status", method: "PUT", body: body)
        return try await perform(req)
    }

    // 档案统计
    func archiveStats(userId: String) async throws -> ArchiveStats {
        let req = try makeRequest(path: "/archive/\(userId)/stats")
        return try await perform(req)
    }

    // 档案时间线
    func archiveTimeline(userId: String) async throws -> [TimelineEntry] {
        let req = try makeRequest(path: "/archive/\(userId)/timeline")
        return try await perform(req)
    }

    // 用户信息
    func userProfile(userId: String) async throws -> UserProfile {
        let req = try makeRequest(path: "/user/\(userId)")
        return try await perform(req)
    }

    func updateUserProfile(userId: String, profile: UserProfileUpdate) async throws -> UserProfile {
        let req = try makeRequest(path: "/user/\(userId)", method: "PUT", body: profile)
        return try await perform(req)
    }

    // Auth
    func register(nickname: String, birthDate: Date) async throws -> AuthResponse {
        let body = RegisterRequest(nickname: nickname, birthDate: birthDate)
        let req = try makeRequest(path: "/auth/register", method: "POST", body: body)
        return try await perform(req)
    }

    func login(id: String) async throws -> AuthResponse {
        let body = LoginRequest(id: id)
        let req = try makeRequest(path: "/auth/login", method: "POST", body: body)
        return try await perform(req)
    }

    // AI 对话
    func chat(message: String, userId: String, contextId: String?) async throws -> ChatResponse {
        let body = ChatRequest(message: message, userId: userId, contextId: contextId)
        let req = try makeRequest(path: "/ai/chat", method: "POST", body: body)
        return try await perform(req)
    }
}

// MARK: - DTOs
struct TarotRequest: Codable { let question: String; let spreadId: String; let userId: String }
struct RegisterRequest: Codable { let nickname: String; let birthDate: Date }
struct LoginRequest: Codable { let id: String }
struct UserProfileUpdate: Codable { let nickname: String?; let birthDate: Date?; let birthHour: Int?; let birthPlace: String?; let gender: String? }
struct ChatRequest: Codable { let message: String; let userId: String; let contextId: String? }
struct PredictionUpdate: Codable { let status: String; let note: String? }
struct ErrorResponse: Codable { let message: String }

struct AuthResponse: Codable {
    let token: String
    let user: UserProfile
}

struct ChatResponse: Codable {
    let reply: String
    let contextId: String?
    let cards: [TarotCard]?
    let fortune: ReadingResult?
}

struct PaginatedResponse<T: Codable>: Codable {
    let items: [T]
    let total: Int
    let page: Int
    let pageSize: Int
    let hasMore: Bool
}
