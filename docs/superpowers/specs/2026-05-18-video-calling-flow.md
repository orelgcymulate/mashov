# Video calling — how the call finds the right device

## Architecture (one picture)

```mermaid
graph TB
    subgraph "Anywhere (parent on the go)"
        P[Parent's phone<br/>Chrome / Safari<br/>cookie: mashov_session]
    end

    subgraph "At home (the wall)"
        T[Wall tablet<br/>Fully Kiosk Browser<br/>cookies:<br/>mashov_session<br/>+ mashov_device=tablet]
    end

    subgraph "Railway"
        N[NestJS API<br/>/api/calls/socket.io<br/>and the rest of /api/*]
        M[(MongoDB<br/>kids, homework, ...)]
    end

    G[Google STUN<br/>stun.l.google.com:19302]

    P -->|"1. WebSocket signaling<br/>(SDP offer/answer + ICE)"| N
    T -->|"1. WebSocket signaling<br/>(SDP offer/answer + ICE)"| N
    N --- M
    P -.->|"2. NAT discovery"| G
    T -.->|"2. NAT discovery"| G
    P <==>|"3. 🎥🎤 audio+video peer-to-peer<br/>once ICE picks a path"| T
```

The NestJS API only relays a few JSON messages to set up the connection.
**Once the call is connected, the media (camera + microphone) flows directly
between phone and tablet — the server is no longer involved.**

## How the API knows which device to ring

When either device opens the dashboard and the WebSocket connects:

1. The handshake sends the `mashov_session` cookie. The gateway verifies the
   JWT and pulls `userId` out of it (one family = one userId).
2. The query string carries `?role=tablet` or `?role=phone`. The wall tablet
   becomes `tablet`; everything else is `phone` (set by the `mashov_device`
   cookie that `DeviceRoleSetter` writes the first time the URL had
   `?device=tablet`).
3. The gateway adds the socket to its in-memory registry:

```
byUser["family-1"] = {
  tablet:  "socket_abc123",       ← the wall tablet
  phones:  { "socket_xyz789" },   ← the parent's phone
}
```

When the phone emits `call:initiate`, the gateway looks up
`byUser[userId].tablet` and emits `call:incoming` to that socket.
That's the whole "routing" — a Map lookup by `userId`, then by role.

## Sequence — what fires when you tap 📞 התקשר

```mermaid
sequenceDiagram
    autonumber
    participant Phone as Parent's phone<br/>(caller, role=phone)
    participant API as NestJS API<br/>(CallsGateway)
    participant Tablet as Wall tablet<br/>(callee, role=tablet)

    Note over Phone,Tablet: Both already opened the dashboard and<br/>logged in once with the family password.<br/>Cookies + WebSocket connections are alive.

    Phone->>API: call:initiate { kidId }
    Note right of API: svc.startCall()<br/>finds the tablet socket<br/>for this userId<br/>(throws 'no_tablet' if absent)
    API-->>Tablet: call:incoming<br/>{ callId, kidId, callerName }
    API-->>Phone: call:outgoing { callId }

    Note over Phone: shows "מתקשר…"
    Note over Tablet: full-screen ring<br/>(IncomingCallOverlay)

    Tablet->>API: call:accept { callId }
    API-->>Phone: call:accepted { callId }

    Note over Phone,Tablet: Both sides now run startPeer():<br/>getUserMedia(cam, mic) +<br/>new RTCPeerConnection({ iceServers })

    Phone->>API: call:signal<br/>{ kind:'offer', data: SDP }
    API->>Tablet: call:signal (relayed opaquely)
    Tablet->>API: call:signal<br/>{ kind:'answer', data: SDP }
    API->>Phone: call:signal (relayed opaquely)

    loop ICE candidates (multiple)
        Phone->>API: call:signal { kind:'ice', candidate }
        API->>Tablet: call:signal (relayed)
        Tablet->>API: call:signal { kind:'ice', candidate }
        API->>Phone: call:signal (relayed)
    end

    Note over Phone,Tablet: Each browser tries every candidate pair<br/>and picks the best path.<br/>Same Wi-Fi → direct LAN.<br/>Different network → via Google STUN.

    Phone-->>Tablet: 🎥🎤 audio + video peer-to-peer<br/>(API no longer in the picture)

    Note over Phone,Tablet: …call continues until one side hangs up…

    Phone->>API: call:hangup { callId }
    API-->>Tablet: call:ended { reason:'hangup' }
    API-->>Phone: call:ended { reason:'hangup' }
    Note over Phone,Tablet: cleanup(): pc.close(),<br/>stop all media tracks,<br/>release camera + mic
```

## The two questions this answers

- **"How does my phone know which tablet to ring?"**
  Both devices share the family `userId` (same login). The gateway keeps a
  map `userId → { tablet, phones }`. Initiate from `phones` → ring `tablet`.

- **"Why is video fast even though my data goes through Railway?"**
  It doesn't, for the video. Railway only sees the call-setup messages
  (a few hundred bytes). The actual stream goes directly between the two
  browsers using whichever network path STUN/ICE discovers — usually the
  same Wi-Fi when you're home, the public internet via NAT punching when
  you're away. The server bandwidth cost is constant regardless of call
  duration or quality.
