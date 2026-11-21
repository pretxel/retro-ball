import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://retro-ball.pretlabs.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/r/", "/api/"],
      },
      // Explicit AI/LLM crawler allowlist for the public surfaces.
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "GoogleOther",
          "CCBot",
          "Applebot-Extended",
          "Bytespider",
          "Amazonbot",
          "DuckAssistBot",
          "MistralAI-User",
          "Cohere-AI",
          "FacebookBot",
        ],
        allow: ["/", "/llms.txt"],
        disallow: ["/r/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
