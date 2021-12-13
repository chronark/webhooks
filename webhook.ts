import { createHash } from "./deps.ts";

export type Webhook = {
  id: string;
  url: string;
  request: {
    method: string;
    headers: Record<string, string>;
    body: string;
  };
  hash: string;
};

export function newWebhook(
  raw: Omit<Webhook, "id" | "hash"> & Partial<Pick<Webhook, "id">>
): Webhook {
  const hash = createHash("sha256")
    .update(JSON.stringify([raw.url, raw.request]))
    .toString("hex");

  return {
    id: raw.id ?? hash,
    hash,
    url: raw.url,
    request: raw.request,
  };
}
