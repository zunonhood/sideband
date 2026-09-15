import Foundation

actor ContactService {
    private let api = APIClient.shared
    private let vault = LocalVault.shared

    func contacts() async throws -> [Contact] {
        try await api.contacts()
    }

    func cache(_ contacts: [Contact]) async throws -> Data {
        let encoded = try JSONEncoder().encode(contacts)
        return try await vault.seal(encoded, scope: "contacts")
    }

    func restore(_ envelope: Data) async throws -> [Contact] {
        let decoded = try await vault.open(envelope, scope: "contacts")
        return try JSONDecoder().decode([Contact].self, from: decoded)
    }
}
