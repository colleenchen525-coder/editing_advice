import { NextResponse } from "next/server";
import { callQwen, parseStrictJson } from "../qwen";

const SYSTEM_PROMPT = `你不分析视频画面内容，只根据创作意图与素材元信息（时长、分组）给出剪辑结构与节奏决策。输出严格 JSON，字段 time_budget, timeline, warnings, next_actions。预算总和接近 target_duration_sec。对素材不足给降级策略。`;

type PlanRequest = {
  creative_brief: {
    title: string;
    platform: string;
    target_duration_sec: number;
    style: string;
    segments: string[];
  };
  assets: { id: string; name: string; duration_sec: number; segment: string }[];
  adjustment?: { pace?: "faster" | "slower"; emphasize?: "product" };
};

async function generatePlan(payload: PlanRequest, model: string) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: JSON.stringify(payload)
    }
  ] as const;
  const data = await callQwen(messages, model);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("模型未返回内容");
  }
  return parseStrictJson(content);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PlanRequest;
    const assets = Array.isArray(body.assets) ? body.assets.slice(0, 30) : [];
    const creative_brief = body.creative_brief;
    if (!creative_brief || !Array.isArray(creative_brief.segments)) {
      return NextResponse.json({ error: "缺少 creative_brief" }, { status: 400 });
    }

    const model = process.env.QWEN_MODEL ?? "qwen3-vl-flash";
    const payload: PlanRequest = {
      creative_brief,
      assets,
      adjustment: body.adjustment
    };

    try {
      const plan = await generatePlan(payload, model);
      return NextResponse.json(plan);
    } catch {
      const plan = await generatePlan(payload, model);
      return NextResponse.json(plan);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成 plan 失败" },
      { status: 500 }
    );
  }
}
