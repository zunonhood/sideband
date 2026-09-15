# Sideband

An interactive concept site for Sideband: a user-owned system layer for identity, encrypted messages, apps, payments and permissions.

## Local development

```bash
npm run dev
```

Open `http://127.0.0.1:4173`. There are no dependencies and no build step. The desktop is a four-pane workbench: interactive device and project note on the left, repository tree and detailed source viewer on the right.

The phone prototype supports app navigation, messages, a hold-to-confirm simulated USDC payment, permission revocation and an interactive source browser. All identities, balances and transactions are local demonstration data.

## Working MVP

The local service exposes:

- `GET /api/system`
- `GET /api/contacts`
- `GET|POST /api/messages`
- `GET /api/policies`
- `PATCH /api/policies/:id`
- `POST /api/payments`
- `GET /api/transactions`
- `GET /api/repository`
- `GET /api/source?path=...`

State is persisted atomically in `data/state.json`. The default mode is a safe local simulation: no real wallet or asset is used.

Run `npm test` to verify identity handling, authenticated message encryption, permission enforcement and payment settlement.

The SwiftUI sources under `ios/Sideband` require macOS and Xcode for simulator or device builds. Configure the API base URL for the Mac or LAN host before running on a physical iPhone.

The Solidity contracts are an unaudited architecture implementation and must not be deployed with real funds before security review.

Sideband is independent and is not affiliated with Robinhood Markets, Inc.
