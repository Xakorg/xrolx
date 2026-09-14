import { createFileRoute } from "@tanstack/react-router";

const SYSTEM = `You are Xrolx AI — the assistant inside the Xrolx ecosystem (a connected AI OS with Builder, Mail, Design Hub, World Hub, Cloud, and more). Be concise, friendly, and proactive. Format with markdown when helpful.`;

export const Route = createFileRoute("/api/public/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages, system, model } = (await request.json()) as {
            messages: { role: "user" | "assistant"; content: string }[];
            system?: string;
            model?: string;
          };

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
              { status: 500, headers: { "content-type": "application/json" } },
            );
          }

          const upstream = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: model || "google/gemini-2.5-pro",
                stream: true,
                messages: [
                  { role: "system", content: system || SYSTEM },
                  ...(messages ?? []),
                ],
              }),
            },
          );

          if (!upstream.ok || !upstream.body) {
            if (upstream.status === 429) {
              return new Response(
                JSON.stringify({ error: "Rate limit hit. Try again shortly." }),
                { status: 429, headers: { "content-type": "application/json" } },
              );
            }
            if (upstream.status === 402) {
              return new Response(
                JSON.stringify({
                  error: "AI credits exhausted. Add funds in Settings → Workspace → Usage.",
                }),
                { status: 402, headers: { "content-type": "application/json" } },
              );
            }
            const text = await upstream.text();
            return new Response(
              JSON.stringify({ error: `AI gateway error: ${text}` }),
              { status: 500, headers: { "content-type": "application/json" } },
            );
          }

          return new Response(upstream.body, {
            headers: {
              "content-type": "text/event-stream",
              "cache-control": "no-cache",
              connection: "keep-alive",
            },
          });
        } catch (e) {
          return new Response(
            JSON.stringify({
              error: e instanceof Error ? e.message : "Unknown error",
            }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
