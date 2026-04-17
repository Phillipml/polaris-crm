function unwrapJsonFromMarkdown(raw: string): string {
  const t = raw.trim();
  const m = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(t);
  if (m?.[1]) {
    return m[1].trim();
  }
  return t;
}

export function parseGeneratedMessages(rawText: string): string[] | null {
  const normalized = unwrapJsonFromMarkdown(rawText);
  try {
    const parsed = JSON.parse(normalized) as { messages?: unknown };
    if (!Array.isArray(parsed.messages)) {
      return null;
    }
    const cleaned = parsed.messages
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    if (cleaned.length < 2 || cleaned.length > 3) {
      return null;
    }
    return cleaned;
  } catch {
    return null;
  }
}

function llmHttpError(status: number, responseText: string): Error {
  let detail = responseText.slice(0, 400);
  try {
    const errJson = JSON.parse(responseText) as {
      error?: { message?: string } | string;
    };
    if (typeof errJson.error === "object" && errJson.error?.message) {
      detail = errJson.error.message;
    } else if (typeof errJson.error === "string") {
      detail = errJson.error;
    }
  } catch {}
  return new Error(`llm_request_failed:${status}:${detail}`);
}

async function generateWithGemini(params: {
  apiKey: string;
  model: string;
  prompt: string;
}): Promise<string[]> {
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(params.model)}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: params.prompt }] }],
      generationConfig: {
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            messages: {
              type: "array",
              minItems: 2,
              maxItems: 3,
              items: { type: "string" },
            },
          },
          required: ["messages"],
        },
      },
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw llmHttpError(response.status, responseText);
  }

  const payload = JSON.parse(responseText) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = parseGeneratedMessages(raw);
  if (!parsed) {
    throw new Error("llm_invalid_output");
  }
  return parsed;
}

async function generateWithGroq(params: {
  apiKey: string;
  model: string;
  prompt: string;
}): Promise<string[]> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      temperature: 0.6,
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Reply with a single JSON object only, no markdown fences. Shape: {\"messages\":[\"...\",\"...\"]}. The array must have exactly 2 or 3 short commercial outreach strings in Portuguese when the user content is in Portuguese.",
        },
        { role: "user", content: params.prompt },
      ],
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw llmHttpError(response.status, responseText);
  }

  const payload = JSON.parse(responseText) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = payload.choices?.[0]?.message?.content ?? "";
  const parsed = parseGeneratedMessages(raw);
  if (!parsed) {
    throw new Error("llm_invalid_output");
  }
  return parsed;
}

export function isAllowedLlmProvider(provider: string | undefined): boolean {
  const p = (provider ?? "").trim().toLowerCase();
  return p === "google" || p === "groq";
}

export function describeInvalidLlmEnv(
  provider: string | undefined,
  model: string | undefined,
  apiKey: string | undefined
): string {
  const parts: string[] = [];
  const pt = (provider ?? "").trim();
  if (!pt) {
    parts.push("LLM_PROVIDER_missing");
  } else if (!isAllowedLlmProvider(provider)) {
    parts.push("LLM_PROVIDER_must_be_google_or_groq");
  }
  if (!(model ?? "").trim()) {
    parts.push("LLM_MODEL_missing");
  }
  if (!(apiKey ?? "").trim()) {
    parts.push("LLM_API_KEY_missing");
  }
  return parts.join(",");
}

export async function generateMessageVariants(params: {
  provider: string;
  apiKey: string;
  model: string;
  prompt: string;
}): Promise<string[]> {
  const p = params.provider.trim().toLowerCase();
  if (p === "google") {
    return await generateWithGemini(params);
  }
  if (p === "groq") {
    return await generateWithGroq(params);
  }
  throw new Error("unsupported_llm_provider");
}
