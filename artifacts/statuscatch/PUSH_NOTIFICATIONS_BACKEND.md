# Push Notifications — Backend Setup (Railway)

The mobile app is now configured to register for push notifications and send the
Expo push token to the backend at `POST /api/mobile/push-token`. The backend
needs three small additions to enable end-to-end pushes.

## 1. Database — add a `MobileDevice` table

Add to `prisma/schema.prisma`:

```prisma
model MobileDevice {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  pushToken   String   @unique
  platform    String
  deviceName  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  lastSeenAt  DateTime @default(now())

  @@index([userId])
}
```

Then on Railway:

```bash
npx prisma migrate deploy
```

## 2. API — register / unregister tokens

Add `app/api/mobile/push-token/route.ts` (Next.js App Router):

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/mobile-auth"; // your existing helper

const Body = z.object({
  token: z.string().min(1),
  platform: z.string(),
  deviceName: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const auth = await requireMobileAuth(req);
  if (!auth.ok) return auth.response;

  const body = Body.parse(await req.json());
  await prisma.mobileDevice.upsert({
    where: { pushToken: body.token },
    create: {
      userId: auth.userId,
      pushToken: body.token,
      platform: body.platform,
      deviceName: body.deviceName ?? null,
    },
    update: {
      userId: auth.userId,
      platform: body.platform,
      deviceName: body.deviceName ?? null,
      lastSeenAt: new Date(),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await requireMobileAuth(req);
  if (!auth.ok) return auth.response;
  const { token } = z.object({ token: z.string() }).parse(await req.json());
  await prisma.mobileDevice.deleteMany({ where: { pushToken: token, userId: auth.userId } });
  return NextResponse.json({ ok: true });
}
```

## 3. Sender — fire notifications when incidents arrive

Wherever you currently process new incidents (likely the BullMQ worker / poller),
add a call to push to all devices belonging to users subscribed to that vendor.

```ts
import fetch from "node-fetch";

async function sendIncidentPush(incident: {
  id: string;
  title: string;
  vendorName: string;
  impact: string;
  vendorSubscriptionUserIds: string[];
}) {
  const devices = await prisma.mobileDevice.findMany({
    where: { userId: { in: incident.vendorSubscriptionUserIds } },
  });
  if (devices.length === 0) return;

  const messages = devices.map((d) => ({
    to: d.pushToken,
    // Use "default" for the system sound, OR a custom filename bundled with the app
    // (see artifacts/statuscatch/assets/sounds/). Custom sounds require an EAS rebuild.
    sound: "alert.wav",
    title: `${incident.vendorName}: ${incident.impact}`,
    body: incident.title,
    data: { incidentId: incident.id },
  }));

  // Expo allows up to 100 messages per request
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chunk),
    });
    const result = (await res.json()) as { data: Array<{ status: string; details?: { error?: string } }> };
    // Clean up tokens reported as DeviceNotRegistered
    for (let j = 0; j < result.data.length; j++) {
      if (result.data[j].details?.error === "DeviceNotRegistered") {
        await prisma.mobileDevice.delete({ where: { pushToken: chunk[j].to } }).catch(() => {});
      }
    }
  }
}
```

Skip pushing for `MAINTENANCE` type incidents to match the in-app behavior.

## 4. EAS — push credentials are auto-managed

When you run `eas build --platform ios` for the next build, EAS will detect the
`expo-notifications` plugin and prompt you to enable Push Notifications on the
Apple Developer Portal. Accept the prompt — EAS handles the APNs key
provisioning automatically. No manual entitlement file changes are required.
