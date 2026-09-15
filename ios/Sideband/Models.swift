import Foundation

struct SystemSnapshot: Codable {
    let identity: Identity
    let balances: [String: Double]
    let policies: [Policy]
    let recentTransactions: [Transaction]
}

struct Identity: Codable {
    let handle: String
    let account: String
    let chainId: Int
    let signer: String
    let recoveryReady: Bool
}

struct Contact: Codable, Identifiable {
    let id: String
    let name: String
    let handle: String
    let account: String?
    let verified: Bool?
}

struct Policy: Codable, Identifiable {
    let id: String
    let app: String
    let scope: String
    var active: Bool
    let spendLimit: Double?
    let asset: String?
    let expiresAt: String
}

struct Transaction: Codable, Identifiable {
    let id: String
    let hash: String
    let mode: String
    let chainId: Int
    let contactId: String
    let amount: Double
    let asset: String
    let memo: String
    let status: String
    let createdAt: String
}
