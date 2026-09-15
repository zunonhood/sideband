import SwiftUI

@main
struct SidebandApp: App {
    @StateObject private var model = SystemModel()

    var body: some Scene {
        WindowGroup {
            RootView().environmentObject(model)
                .task { await model.refresh() }
        }
    }
}

@MainActor
final class SystemModel: ObservableObject {
    @Published var snapshot: SystemSnapshot?
    @Published var contacts: [Contact] = []
    @Published var error: String?
    @Published var loading = false

    func refresh() async {
        loading = true
        defer { loading = false }
        do {
            async let system = APIClient.shared.system()
            async let people = APIClient.shared.contacts()
            (snapshot, contacts) = try await (system, people)
            error = nil
        } catch {
            self.error = "Sideband service is unavailable."
        }
    }

    func setPolicy(_ policy: Policy, active: Bool) async {
        do {
            _ = try await APIClient.shared.updatePolicy(id: policy.id, active: active)
            await refresh()
        } catch { self.error = "Could not update permission." }
    }

    func payMira() async {
        do {
            _ = try await APIClient.shared.pay(contactId: "mira", amount: 12, memo: "Shared relay")
            await refresh()
        } catch { self.error = "Payment was not authorized." }
    }
}

struct RootView: View {
    @EnvironmentObject private var model: SystemModel

    var body: some View {
        TabView {
            NavigationStack { DashboardView() }
                .tabItem { Label("Home", systemImage: "house.fill") }
            NavigationStack { ContactsView() }
                .tabItem { Label("People", systemImage: "person.2.fill") }
            NavigationStack { ApplicationsView() }
                .tabItem { Label("Apps", systemImage: "square.grid.2x2.fill") }
            NavigationStack { PermissionsView() }
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
        }
        .tint(.primary)
        .alert("Sideband", isPresented: .constant(model.error != nil)) {
            Button("OK") { model.error = nil }
        } message: { Text(model.error ?? "") }
    }
}

struct DashboardView: View {
    @EnvironmentObject private var model: SystemModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                accountCard
                HStack {
                    ActionButton(title: "Send", icon: "arrow.up")
                    ActionButton(title: "Request", icon: "arrow.down")
                    ActionButton(title: "Scan", icon: "qrcode.viewfinder")
                    ActionButton(title: "More", icon: "ellipsis")
                }
                Text("Today").font(.headline)
                Button(action: { Task { await model.payMira() } }) {
                    EventRow(icon: "person.fill", title: "Mira requested 12.00 USDC", detail: "Encrypted message · now")
                }.buttonStyle(.plain)
                NavigationLink(destination: PermissionsView()) {
                    EventRow(icon: "checkmark.shield.fill", title: "\(activePolicies) active app permissions", detail: "Tap to inspect access")
                }.buttonStyle(.plain)
            }.padding()
        }
        .navigationTitle("Sideband")
        .refreshable { await model.refresh() }
    }

    private var activePolicies: Int { model.snapshot?.policies.filter(\.active).count ?? 0 }
    private var accountCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Label(model.snapshot?.identity.handle ?? "Loading…", systemImage: "circle.hexagongrid.fill")
                Spacer()
                Text("CHAIN \(model.snapshot?.identity.chainId ?? 4663)").font(.caption2)
            }
            Text("TOTAL BALANCE").font(.caption2).foregroundStyle(.secondary)
            Text(totalBalance, format: .currency(code: "USD")).font(.system(size: 34, weight: .semibold))
            Text(model.snapshot?.identity.account ?? "—").font(.caption2).foregroundStyle(.secondary).lineLimit(1)
        }
        .padding().foregroundStyle(.white)
        .background(Color.black.gradient, in: RoundedRectangle(cornerRadius: 22))
    }
    private var totalBalance: Double {
        let usdc = model.snapshot?.balances["USDC"] ?? 0
        return usdc + (model.snapshot?.balances["ETH"] ?? 0) * 2600
    }
}

struct ContactsView: View {
    @EnvironmentObject private var model: SystemModel
    var body: some View {
        List(model.contacts) { contact in
            HStack(spacing: 12) {
                Circle().fill(Color.green.opacity(0.25)).frame(width: 42, height: 42)
                    .overlay(Text(contact.name.prefix(2)).font(.caption).bold())
                VStack(alignment: .leading) {
                    Text(contact.name).font(.headline)
                    Text(contact.handle).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                if contact.verified == true { Image(systemName: "checkmark.seal.fill") }
            }
        }.navigationTitle("People")
    }
}

struct PermissionsView: View {
    @EnvironmentObject private var model: SystemModel
    var body: some View {
        List {
            Section("Application capabilities") {
                ForEach(model.snapshot?.policies ?? []) { policy in
                    Toggle(isOn: Binding(
                        get: { policy.active },
                        set: { active in Task { await model.setPolicy(policy, active: active) } }
                    )) {
                        VStack(alignment: .leading) {
                            Text(policy.app).font(.headline)
                            Text(policy.scope).font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }.navigationTitle("Permissions")
    }
}

struct ApplicationsView: View {
    let apps = [("Relay", "bubble.left.and.bubble.right.fill"), ("Market", "chart.line.uptrend.xyaxis"), ("Terminal", "terminal.fill"), ("Agent", "sparkles")]
    var body: some View {
        List(apps, id: \.0) { app in
            Label(app.0, systemImage: app.1).padding(.vertical, 8)
        }.navigationTitle("Applications")
    }
}

struct ActionButton: View {
    let title: String; let icon: String
    var body: some View {
        VStack { Image(systemName: icon).frame(width: 44, height: 44).background(.thinMaterial, in: Circle()); Text(title).font(.caption2) }
            .frame(maxWidth: .infinity)
    }
}

struct EventRow: View {
    let icon: String; let title: String; let detail: String
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon).frame(width: 38, height: 38).background(Color.green.opacity(0.2), in: Circle())
            VStack(alignment: .leading) { Text(title).font(.subheadline).bold(); Text(detail).font(.caption).foregroundStyle(.secondary) }
            Spacer(); Image(systemName: "chevron.right").foregroundStyle(.tertiary)
        }.padding(.vertical, 4)
    }
}
