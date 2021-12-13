import { Webhook, newWebhook } from "./webhook.ts";
import { Redis } from "./repository.ts";

const redis = new Redis<ScheduledWebhook>();

const server = Deno.listen({ port: 3000 });

for await (const conn of server) {
  serveHttp(conn);
}

async function serveHttp(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);
  for await (const event of httpConn) {
    work(event.request)
      .then((res) => {
        event.respondWith(new Response(JSON.stringify(res)));
      })
      .catch((err) => {
        console.error(err);
        event.respondWith(new Response(JSON.stringify(err)));
      });
  }
}

type Attempt = {
  time: number;
  response: {
    code: number;
    message: string;
  };
};

type ScheduledWebhook = {
  /**
   * In seconds
   */
  debounceWindow?: number;
  attempts: Attempt[];

  webhook: Webhook;
  originalHash: string;
};

async function work(req: Request) {
  const url = new URL(req.url);

  const targetHost = req.headers.get("wh-target-host");
  if (!targetHost) {
    throw new Error("wh-target-host header is missing");
  }

  const targetUrl = `${targetHost}${url.pathname}`;

  const deduplicationId = req.headers.get("wh-deduplication-id") ?? undefined;
  const debounceWindow = Number.parseInt(
    req.headers.get("wh-debounce-window") ?? "0"
  );

  const headers: Record<string, string> = {};
  for (const [k, v] of req.headers) {
    if (!k.toLowerCase().startsWith("wh-")) {
      headers[k] = v;
    }
  }

  const body = await req.text();

  const webhook = newWebhook({
    id: deduplicationId,
    url: targetUrl,
    request: {
      method: req.method,
      body,
      headers,
    },
  });

  const storedWebhook = await redis.get(webhook.id);

  if (storedWebhook) {
    redis.set(webhook.id, {
      ...storedWebhook,
      webhook,
    });
  } else {
    redis.set(webhook.id, {
      debounceWindow,
      originalHash: webhook.hash,
      attempts: [],
      webhook,
    });
  }

  if (!storedWebhook || !debounceWindow) {
    await fetch(webhook.url, webhook.request).then(() => {
      console.log("Webhook delivered", webhook.id, webhook.request.body);
    });
  }

  if (debounceWindow) {
    console.log({ debounceWindow });
    setTimeout(async () => {
      const scheduledWebhook = await redis.get(webhook.id);
      if (!scheduledWebhook) {
        return;
      }

      if (webhook.hash !== scheduledWebhook.originalHash) {
        await fetch(
          scheduledWebhook.webhook.url,
          scheduledWebhook.webhook.request
        )
          .then(async (res) => {
            if (res.ok) {
              await redis.delete(scheduledWebhook.webhook.id);
              console.log(
                "Webhook delivered after debounce window",
                webhook.id,
                webhook.request.body
              );
            } else {
              console.warn("Unable to deliver webhook", webhook.id);
              await redis.set(webhook.id, {
                ...scheduledWebhook,
                attempts: [
                  ...scheduledWebhook.attempts,
                  {
                    time: Date.now(),
                    response: { code: res.status, message: await res.text() },
                  },
                ],
              });
            }
          })
          .catch(async (err) => {
            console.error("Unable to deliver webhook", webhook.id, err);
            await redis.set(webhook.id, {
              ...scheduledWebhook,
              attempts: [
                ...scheduledWebhook.attempts,
                {
                  time: Date.now(),
                  response: { code: 500, message: err.message },
                },
              ],
            });
          });
      }
    }, debounceWindow * 1000);
  }

  return { id: webhook.id };
}
