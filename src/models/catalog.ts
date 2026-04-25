/**
 * Fictional “registry” of coding-assistant / LLM products for the lab UI.
 * Names mirror real families; this app does not call any provider APIs.
 */
export type VendorId =
  | "anthropic"
  | "openai"
  | "google"
  | "meta"
  | "mistral"
  | "xai"
  | "cohere"
  | "deepseek"
  | "qwen"
  | "amazon"
  | "infrastructure";

export type ModelEntry = {
  id: string;
  vendor: VendorId;
  /** Short label in the grid */
  displayName: string;
  /** Extra tokens for search (not all shown on card) */
  searchBlob: string;
};

export const VENDOR_LABEL: Record<VendorId, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  meta: "Meta",
  mistral: "Mistral",
  xai: "xAI",
  cohere: "Cohere",
  deepseek: "DeepSeek",
  qwen: "Alibaba Qwen",
  amazon: "Amazon",
  infrastructure: "Infra / routing",
};

export const CATALOG: ModelEntry[] = [
  {
    id: "claude-opus-4-5",
    vendor: "anthropic",
    displayName: "Claude Opus 4.5",
    searchBlob: "anthropic claude opus reasoning agent largest",
  },
  {
    id: "claude-sonnet-4-5",
    vendor: "anthropic",
    displayName: "Claude Sonnet 4.5",
    searchBlob: "anthropic claude sonnet coding balanced",
  },
  {
    id: "claude-sonnet-4-6",
    vendor: "anthropic",
    displayName: "Claude Sonnet 4.6",
    searchBlob: "anthropic claude sonnet newest",
  },
  {
    id: "claude-opus-4-1",
    vendor: "anthropic",
    displayName: "Claude Opus 4.1",
    searchBlob: "anthropic claude opus prior",
  },
  {
    id: "claude-4-0-opus",
    vendor: "anthropic",
    displayName: "Claude 4 Opus (legacy line)",
    searchBlob: "anthropic claude 4",
  },
  {
    id: "claude-3-7-sonnet",
    vendor: "anthropic",
    displayName: "Claude 3.7 Sonnet",
    searchBlob: "anthropic 3.7",
  },
  {
    id: "claude-3-5-sonnet",
    vendor: "anthropic",
    displayName: "Claude 3.5 Sonnet",
    searchBlob: "anthropic 3.5 workhorse",
  },
  {
    id: "claude-3-5-haiku",
    vendor: "anthropic",
    displayName: "Claude 3.5 Haiku",
    searchBlob: "anthropic fast cheap",
  },
  {
    id: "gpt-5-2",
    vendor: "openai",
    displayName: "GPT-5.2 (coding track)",
    searchBlob: "openai chatgpt",
  },
  {
    id: "gpt-5-1-codex",
    vendor: "openai",
    displayName: "GPT-5.1-Codex",
    searchBlob: "openai codex ide agent",
  },
  {
    id: "o3-pro",
    vendor: "openai",
    displayName: "o3 (high reasoning)",
    searchBlob: "openai o3",
  },
  {
    id: "gpt-4-1",
    vendor: "openai",
    displayName: "GPT-4.1",
    searchBlob: "openai 4.1",
  },
  {
    id: "gpt-4o",
    vendor: "openai",
    displayName: "GPT-4o",
    searchBlob: "openai 4o multimodal",
  },
  {
    id: "google-gemini-3-pro",
    vendor: "google",
    displayName: "Gemini 3 Pro",
    searchBlob: "google antigravity ide",
  },
  {
    id: "google-gemini-2-5-pro",
    vendor: "google",
    displayName: "Gemini 2.5 Pro",
    searchBlob: "google large context",
  },
  {
    id: "google-gemini-flash-2-5",
    vendor: "google",
    displayName: "Gemini 2.5 Flash",
    searchBlob: "google fast",
  },
  {
    id: "google-gemini-interactions-agentic",
    vendor: "google",
    displayName: "Gemini — Interactions API (agentic / tools path)",
    searchBlob: "interactions api tools mcp function calling state",
  },
  {
    id: "google-gemini-deep-research-agent",
    vendor: "google",
    displayName: "Deep Research agent (Interactions API, preview class)",
    searchBlob: "deep research agent background synthesis citations",
  },
  {
    id: "meta-llama-3-3-70b",
    vendor: "meta",
    displayName: "Llama 3.3 70B Instruct",
    searchBlob: "meta oss",
  },
  {
    id: "meta-llama-3-1-405b",
    vendor: "meta",
    displayName: "Llama 3.1 405B",
    searchBlob: "meta open weights",
  },
  {
    id: "mistral-large-2",
    vendor: "mistral",
    displayName: "Mistral Large 2",
    searchBlob: "mistral",
  },
  {
    id: "mistral-codestral",
    vendor: "mistral",
    displayName: "Codestral",
    searchBlob: "mistral code completion",
  },
  {
    id: "grok-4-20",
    vendor: "xai",
    displayName: "Grok 4.20 (coding)",
    searchBlob: "xai twitter",
  },
  {
    id: "grok-3",
    vendor: "xai",
    displayName: "Grok 3",
    searchBlob: "xai",
  },
  {
    id: "cohere-command-r-plus",
    vendor: "cohere",
    displayName: "Command R+",
    searchBlob: "cohere enterprise",
  },
  {
    id: "deepseek-v3-2",
    vendor: "deepseek",
    displayName: "DeepSeek V3.2",
    searchBlob: "deepseek",
  },
  {
    id: "deepseek-r1",
    vendor: "deepseek",
    displayName: "DeepSeek R1 (reasoning)",
    searchBlob: "deepseek chain of thought",
  },
  {
    id: "qwen-2-5-coder-32b",
    vendor: "qwen",
    displayName: "Qwen2.5-Coder 32B",
    searchBlob: "alibaba code",
  },
  {
    id: "qwen-3-235b",
    vendor: "qwen",
    displayName: "Qwen3 235B",
    searchBlob: "alibaba",
  },
  {
    id: "amazon-nova-pro",
    vendor: "amazon",
    displayName: "Amazon Nova Pro",
    searchBlob: "aws bedrock",
  },
  {
    id: "router-aggregate",
    vendor: "infrastructure",
    displayName: "“Auto / strongest available” (router)",
    searchBlob: "routing not a single model",
  },
];
