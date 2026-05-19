import SwiftUI

// MARK: - 主题配色
struct Theme {
    // 主色调
    static let primary = Color.purple
    static let primaryDark = Color(red: 0.3, green: 0.1, blue: 0.5)
    static let primaryLight = Color(red: 0.7, green: 0.4, blue: 1.0)

    // 背景
    static let background = Color(red: 0.05, green: 0.02, blue: 0.10)
    static let surface = Color(red: 0.10, green: 0.05, blue: 0.18)
    static let surfaceLight = Color(red: 0.18, green: 0.10, blue: 0.28)

    // 功能色
    static let gold = Color(red: 1.0, green: 0.84, blue: 0.0)
    static let mysticBlue = Color(red: 0.3, green: 0.5, blue: 1.0)
    static let rosePink = Color(red: 1.0, green: 0.4, blue: 0.7)
    static let energyGreen = Color(red: 0.2, green: 0.9, blue: 0.6)
    static let warningRed = Color(red: 1.0, green: 0.2, blue: 0.3)

    // 文字
    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.7)
    static let textMuted = Color.white.opacity(0.4)

    // 运势分数映射
    static func scoreColor(_ score: Int) -> Color {
        switch score {
        case 0..<30: return warningRed
        case 30..<50: return Color.orange
        case 50..<70: return gold
        case 70..<90: return energyGreen
        default: return mysticBlue
        }
    }
}

// MARK: - 神秘背景渐变
struct MysticGradient {
    static let background = LinearGradient(
        colors: [Theme.background, Color(red: 0.08, green: 0.02, blue: 0.15), Theme.background],
        startPoint: .top, endPoint: .bottom
    )

    static let cardGlow = RadialGradient(
        colors: [Theme.primaryLight.opacity(0.3), .clear],
        center: .center, startRadius: 20, endRadius: 150
    )

    static func scoreGradient(_ score: Int) -> LinearGradient {
        let color = Theme.scoreColor(score)
        return LinearGradient(
            colors: [color.opacity(0.6), color],
            startPoint: .leading, endPoint: .trailing
        )
    }
}

// MARK: - 动画
struct Animations {
    static let cardFlip = Animation.spring(response: 0.6, dampingFraction: 0.7)
    static let cardDeal = Animation.spring(response: 0.5, dampingFraction: 0.8).delay(0.1)
    static let shimmer = Animation.linear(duration: 2.0).repeatForever(autoreverses: false)
    static let pulse = Animation.easeInOut(duration: 2.0).repeatForever(autoreverses: true)

    static func dealDelay(index: Int) -> Animation {
        Animation.spring(response: 0.5, dampingFraction: 0.8).delay(Double(index) * 0.15)
    }
}

// MARK: - 星命名
struct StarNames {
    static let appName = "星命"
    static let appSubtitle = "你的 AI 命运伴侣"

    static let tabHome = "今日"
    static let tabChat = "占卜"
    static let tabArchive = "档案"
    static let tabProfile = "我的"
}
