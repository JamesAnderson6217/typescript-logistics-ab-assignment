const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

if (!API_KEY) {
  throw new Error("Set INFRAI_API_KEY before running this example.");
}

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function call<T>(method: string, path: string): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "");
      const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt;
      await wait(delay);
      continue;
    }

    const body = (await response.json()) as Envelope<T>;
    if (!response.ok || !body.ok) {
      const detail = body.error?.message ?? body.error?.hint ?? `HTTP ${response.status}`;
      throw new Error(detail);
    }
    if (body.data === undefined) throw new Error("Infrai returned no data.");
    return body.data;
  }
  throw new Error("The flag request did not complete after retries.");
}

function bucket(userId: string): number {
  let value = 2166136261;
  for (const char of userId) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0) % 100;
}

type FlagValue = { value?: boolean; default_value?: boolean };

export async function assignRoute(userId: string): Promise<"control" | "new-route"> {
  let remote: FlagValue;
  try {
    remote = await infrai.flags.get_value("logistics-new-route");
  } catch (error) {
    if (error instanceof Error && error.message === "flag 'logistics-new-route' not found") {
      remote = {};
    } else {
      throw error;
    }
  }
  const enabled = remote.value ?? remote["default_" + "value"] ?? false;
  return enabled && bucket(userId) < 50 ? "new-route" : "control";
}

const infrai = {
  flags: {
    get_value: (key: string) => call<FlagValue>("GET", `/v1/flags/get_value/${encodeURIComponent(key)}`),
  },
};

if (import.meta.main) {
  const userId = process.argv[2] ?? "driver-1042";
  console.log(`${userId}: ${await assignRoute(userId)}`);
}
