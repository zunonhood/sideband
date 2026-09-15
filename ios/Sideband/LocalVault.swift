import CryptoKit
import Foundation
import Security

enum VaultError: Error { case keychain(OSStatus), malformedEnvelope }

actor LocalVault {
    static let shared = LocalVault()
    private let service = "xyz.sideband.vault"

    func seal(_ data: Data, scope: String) throws -> Data {
        let key = try key(for: scope)
        return try AES.GCM.seal(data, using: key).combined ?? Data()
    }

    func open(_ envelope: Data, scope: String) throws -> Data {
        guard let box = try? AES.GCM.SealedBox(combined: envelope) else { throw VaultError.malformedEnvelope }
        return try AES.GCM.open(box, using: key(for: scope))
    }

    private func key(for scope: String) throws -> SymmetricKey {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: scope,
            kSecReturnData as String: true
        ]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecSuccess, let data = item as? Data { return SymmetricKey(data: data) }
        if status != errSecItemNotFound { throw VaultError.keychain(status) }
        let data = Data(SymmetricKey(size: .bits256).withUnsafeBytes { Data($0) })
        let add: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: scope,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
            kSecValueData as String: data
        ]
        let addStatus = SecItemAdd(add as CFDictionary, nil)
        guard addStatus == errSecSuccess else { throw VaultError.keychain(addStatus) }
        return SymmetricKey(data: data)
    }
}
