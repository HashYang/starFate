import Foundation

@MainActor
class ProfileViewModel: ObservableObject {
    @Published var profile: UserProfile?
    @Published var isLoading = false
    @Published var error: Error?
    @Published var isEditing = false

    // Edit form fields
    @Published var editNickname = ""
    @Published var editBirthDate = Date()
    @Published var editBirthHour: Int?
    @Published var editBirthPlace = ""
    @Published var editGender = ""

    private var userId: String? { AuthManager.shared.userId }

    func loadProfile() async {
        guard let userId else { return }
        isLoading = true
        error = nil
        do {
            profile = try await APIClient.shared.userProfile(userId: userId)
        } catch {
            self.error = error
        }
        isLoading = false
    }

    func startEditing() {
        guard let profile else { return }
        editNickname = profile.nickname
        editBirthDate = profile.birthDate
        editBirthHour = profile.birthHour
        editBirthPlace = profile.birthPlace ?? ""
        editGender = profile.gender ?? ""
        isEditing = true
    }

    func saveProfile() async {
        guard let userId else { return }
        isLoading = true
        error = nil
        do {
            let update = UserProfileUpdate(
                nickname: editNickname.isEmpty ? nil : editNickname,
                birthDate: editBirthDate,
                birthHour: editBirthHour,
                birthPlace: editBirthPlace.isEmpty ? nil : editBirthPlace,
                gender: editGender.isEmpty ? nil : editGender
            )
            profile = try await APIClient.shared.updateUserProfile(userId: userId, profile: update)
            isEditing = false
        } catch {
            self.error = error
        }
        isLoading = false
    }

    func logout() {
        AuthManager.shared.logout()
    }
}
