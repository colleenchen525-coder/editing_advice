import { NextResponse } from "next/server";
import { callQwen, parseStrictJson } from "../qwen";

const SYSTEM_PROMPT = `你是短视频剪辑助理。将用户自然语言需求提取为结构化 brief JSON。只输出 JSON。字段：title, platform(douyin/bilibili/xiaohongshu/other), target_duration_sec(10-120), style(短字符串), segments(3-6个中文段落名，包含“产品展示”如果用户提到产品/展示/带货)。用户没说则给默认合理值。`;

const DEFAULT_SEGMENTS = ["开场", "日常", "收尾", "产品展示"];

function normalizeBrief(data: any) {
  const now = new Date();
  const fallbackTitle = `Vlog-${now.getMonth() + 1}月${now.getDate()}日`;
  const title = typeof data?.title === "string" && data.title.trim() ? data.title.trim() : fallbackTitle;
  const platform = typeof data?.platform === "string" && data.platform.trim() ? data.platform.trim() : "douyin";
  const duration = Number(data?.target_duration_sec);
  const target_duration_sec = Number.isFinite(duration) ? Math.min(120, Math.max(10, duration)) : 40;
  const style = typeof data?.style === "string" && data.style.trim() ? data.style.trim() : "日常、清爽";
  const segmentsRaw = Array.isArray(data?.segments) ? data.segments : DEFAULT_SEGMENTS;
  const segments = segmentsRaw
    .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 6);
  while (segments.length < 3) {
    segments.push(`段落${segments.length + 1}`);
  }
  return {
    title,
    platform,
    target_duration_sec,
    style,
    segments
  };
}

async function generateBrief(userText: string, model: string) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userText || "生成一个日常 vlog brief" }
  ] as const;
  const data = await callQwen(messages, model);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("模型未返回内容");
  }
  return normalizeBrief(parseStrictJson(content));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { user_text?: string };
    const userText = (body.user_text ?? "").toString().slice(0, 1000);
    const model = process.env.QWEN_MODEL ?? "qwen3-vl-flash";

    try {
      const brief = await generateBrief(userText, model);
      return NextResponse.json(brief);
    } catch {
      const brief = await generateBrief(userText, model);
      return NextResponse.json(brief);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成 brief 失败" },
      { status: 500 }
    );
  }
}
