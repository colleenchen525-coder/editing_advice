const DASHSCOPE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

export type QwenMessage = { role: "system" | "user"; content: string };

export async function callQwen(
  messages: readonly QwenMessage[],
  model: string
) {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error("缺少 DASHSCOPE_API_KEY");
  }

  const response = await fetch(DASHSCOPE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 1200
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DashScope 请求失败: ${errorText}`);
  }

  return response.json();
}

export function parseStrictJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("模型返回非 JSON");
    }
    return JSON.parse(match[0]);
  }
}
