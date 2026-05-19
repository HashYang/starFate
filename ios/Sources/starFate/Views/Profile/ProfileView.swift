import SwiftUI

struct ProfileView: View {
    @StateObject private var viewModel = ProfileViewModel()
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Avatar & Basic Info
                    profileHeader

                    // Personal Info
                    personalInfoSection

                    // Stats
                    statsSection

                    // Settings
                    settingsSection

                    // Logout
                    logoutButton
                }
                .padding()
            }
            .background(Theme.background)
            .navigationTitle("我的")
            .task { await viewModel.loadProfile() }
            .sheet(isPresented: $viewModel.isEditing) {
                EditProfileView(viewModel: viewModel)
            }
        }
    }

    // MARK: - Profile Header
    private var profileHeader: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Theme.primaryDark)
                    .frame(width: 80, height: 80)
                Text(viewModel.profile?.nickname.prefix(1) ?? "?")
                    .font(.title)
                    .foregroundColor(Theme.gold)
            }

            Text(viewModel.profile?.nickname ?? "用户")
                .font(.title2).bold()
                .foregroundColor(Theme.textPrimary)

            if let profile = viewModel.profile {
                HStack(spacing: 16) {
                    Label(profile.constellation.rawValue, systemImage: "sparkles")
                    Label(profile.chineseZodiac.rawValue, systemImage: "hare")
                    Label(profile.zodiac.rawValue, systemImage: "star")
                }
                .font(.caption)
                .foregroundColor(Theme.textSecondary)
            }

            Button("编辑资料") {
                viewModel.startEditing()
            }
            .font(.subheadline)
            .foregroundColor(Theme.primaryLight)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    // MARK: - Personal Info
    private var personalInfoSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("个人信息")
                .font(.headline)
                .foregroundColor(Theme.textPrimary)

            if let profile = viewModel.profile {
                InfoRow(label: "昵称", value: profile.nickname)
                InfoRow(label: "星座", value: profile.constellation.rawValue)
                InfoRow(label: "生肖", value: profile.chineseZodiac.rawValue)
                InfoRow(label: "出生日期", value: profile.birthDate.formatted(date: .numeric, time: .omitted))
                if let hour = profile.birthHour {
                    InfoRow(label: "出生时辰", value: "\(hour)时")
                }
                if let place = profile.birthPlace {
                    InfoRow(label: "出生地", value: place)
                }
            }
        }
        .padding()
        .background(Theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Stats
    private var statsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("占卜统计")
                .font(.headline)
                .foregroundColor(Theme.textPrimary)

            if let profile = viewModel.profile {
                HStack(spacing: 0) {
                    StatItem(value: "\(profile.totalReadings)", label: "总占卜", icon: "book.fill", color: .purple)
                    Divider().background(Theme.surfaceLight).frame(height: 40)
                    StatItem(value: "\(profile.currentStreak)", label: "连续天数", icon: "flame.fill", color: .orange)
                    Divider().background(Theme.surfaceLight).frame(height: 40)
                    StatItem(value: "\(profile.memberDays)", label: "加入天数", icon: "calendar", color: .blue)
                }
                .padding(.vertical, 8)
            }
        }
        .padding()
        .background(Theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Settings
    private var settingsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("设置")
                .font(.headline)
                .foregroundColor(Theme.textPrimary)

            SettingsRow(icon: "bell.fill", iconColor: .orange, title: "推送通知")
            SettingsRow(icon: "shareparty.fill", iconColor: .blue, title: "分享给朋友")
            SettingsRow(icon: "star.fill", iconColor: .yellow, title: "给我们评分")
            SettingsRow(icon: "doc.text.fill", iconColor: .gray, title: "隐私政策")
            SettingsRow(icon: "info.circle.fill", iconColor: .gray, title: "关于星命")
        }
        .padding()
        .background(Theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Logout Button
    private var logoutButton: some View {
        Button(action: viewModel.logout) {
            Text("退出登录")
                .font(.subheadline)
                .foregroundColor(Theme.warningRed)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Theme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

// MARK: - Supporting Views
struct InfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)
            Spacer()
            Text(value)
                .font(.subheadline)
                .foregroundColor(Theme.textPrimary)
        }
    }
}

struct SettingsRow: View {
    let icon: String
    let iconColor: Color
    let title: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(iconColor)
                .frame(width: 20)
            Text(title)
                .font(.subheadline)
                .foregroundColor(Theme.textPrimary)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(Theme.textMuted)
        }
        .padding(.vertical, 4)
    }
}

struct EditProfileView: View {
    @ObservedObject var viewModel: ProfileViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("基本信息") {
                    TextField("昵称", text: $viewModel.editNickname)
                    DatePicker("出生日期", selection: $viewModel.editBirthDate, displayedComponents: .date)
                    TextField("出生地", text: $viewModel.editBirthPlace)
                }

                Section("出生时辰（可选）") {
                    Picker("时辰", selection: Binding(
                        get: { viewModel.editBirthHour ?? 12 },
                        set: { viewModel.editBirthHour = $0 == 12 ? nil : $0 }
                    )) {
                        Text("未知").tag(12)
                        ForEach(0..<24) { hour in
                            Text("\(hour)时").tag(hour)
                        }
                    }
                }
            }
            .navigationTitle("编辑资料")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("保存") {
                        Task { await viewModel.saveProfile(); dismiss() }
                    }
                }
            }
        }
    }
}
