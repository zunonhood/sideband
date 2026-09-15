import Foundation

actor APIClient {
    static let shared = APIClient()
    private let baseURL = URL(string: "http://127.0.0.1:4173")!
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    func system() async throws -> SystemSnapshot {
        try await get("/api/system")
    }

    func contacts() async throws -> [Contact] {
        try await get("/api/contacts")
    }

    func updatePolicy(id: String, active: Bool) async throws -> Policy {
        try await send("/api/policies/\(id)", method: "PATCH", body: ["active": active])
    }

    func pay(contactId: String, amount: Double, asset: String = "USDC", memo: String) async throws -> Transaction {
        struct Payment: Encodable { let contactId: String; let amount: Double; let asset: String; let memo: String }
        return try await send("/api/payments", method: "POST", body: Payment(contactId: contactId, amount: amount, asset: asset, memo: memo))
    }

    private func get<T: Decodable>(_ path: String) async throws -> T {
        let (data, response) = try await URLSession.shared.data(from: baseURL.appending(path: path))
        try validate(response)
        return try decoder.decode(T.self, from: data)
    }

    private func send<Input: Encodable, Output: Decodable>(_ path: String, method: String, body: Input) async throws -> Output {
        var request = URLRequest(url: baseURL.appending(path: path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)
        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response)
        return try decoder.decode(Output.self, from: data)
    }

    private func validate(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode else {
            throw URLError(.badServerResponse)
        }
    }
}
