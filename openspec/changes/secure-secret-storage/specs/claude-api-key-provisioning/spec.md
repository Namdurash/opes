## ADDED Requirements

### Requirement: Claude API key is not shipped in the app binary

The in-app Subscription Detective agent SHALL obtain Claude access without the Claude API key being embedded in the distributed app binary. The build-time `react-native-config` inlining of `CLAUDE_API_KEY` SHALL NOT be the source of the key for the shipped, in-app agent.

#### Scenario: Key absent from the distributed build

- **WHEN** the released app binary (IPA/APK) is inspected
- **THEN** no usable Claude API key is present in the bundle or native config

### Requirement: Agent obtains Claude access through a secret-safe channel

The in-app agent SHALL obtain Claude access through one of two acceptable channels (the specific choice is recorded in `design.md`): a **server-side proxy** that holds the key and forwards requests, or a **user-supplied key** persisted through the `secret-storage` capability. In either case the key MUST NOT be readable from the app binary.

#### Scenario: Server-side proxy path

- **WHEN** the app issues an agent request via the proxy
- **THEN** the proxy attaches the Claude API key server-side and the app never holds the key

#### Scenario: User-supplied key path

- **WHEN** a user enters their own Anthropic API key
- **THEN** the key is stored via the `secret-storage` capability (encrypted at rest) and used for that user's agent requests only

### Requirement: Developer harness remains environment-driven

The in-app provisioning rules SHALL NOT apply to the developer-only `npm run agent:dev` harness, which MAY continue to read `CLAUDE_API_KEY` from the local environment. This exemption applies only to the non-shipped dev harness.

#### Scenario: Dev harness uses the environment key

- **WHEN** a developer runs `npm run agent:dev`
- **THEN** the harness reads `CLAUDE_API_KEY` from the environment and runs, unaffected by the in-app provisioning rules
