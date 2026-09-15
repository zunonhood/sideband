import CryptoKit
import Foundation

struct MessageEnvelope: Codable {
    let version: Int
    let nonce: Data
    let ciphertext: Data
    let tag: Data
}

actor MessageService {
    private let vault = LocalVault.shared

    func seal(_ plaintext: String, conversationId: String) async throws -> MessageEnvelope {
        let combined = try await vault.seal(Data(plaintext.utf8), scope: "message.\(conversationId)")
        let box = try AES.GCM.SealedBox(combined: combined)
        return MessageEnvelope(version: 1, nonce: box.nonce.withUnsafeBytes { Data($0) }, ciphertext: box.ciphertext, tag: box.tag)
    }

    func open(_ envelope: MessageEnvelope, conversationId: String) async throws -> String {
        let box = try AES.GCM.SealedBox(nonce: .init(data: envelope.nonce), ciphertext: envelope.ciphertext, tag: envelope.tag)
        let combined = box.combined ?? Data()
        let plaintext = try await vault.open(combined, scope: "message.\(conversationId)")
        return String(decoding: plaintext, as: UTF8.self)
    }
}
