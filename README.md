# AI Vlog 剪辑 Copilot (MVP)

一个基于 Next.js + Tailwind 的剪辑方案 Demo，支持通过 Qwen（DashScope）生成 brief 与剪辑方案。

## 本地运行

```bash
npm install
npm run dev
```

## 环境变量

```bash
DASHSCOPE_API_KEY=your_key
QWEN_MODEL=qwen3-vl-flash
```

## 功能

- / 生成并编辑 brief
- /assets 导入素材、读取时长并生成缩略图
- /plan 生成剪辑方案、微调与复制 JSON
