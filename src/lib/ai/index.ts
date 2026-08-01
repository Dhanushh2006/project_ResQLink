import type { AiProvider } from './provider';
import { RuleBasedProvider } from './rule-based-provider';
import { OpenAiProvider } from './openai-provider';

let cached: AiProvider | null = null;

export function getProvider(): AiProvider {
  if (cached) return cached;
  const mode = (process.env.AI_PROVIDER || 'local').toLowerCase();
  if (mode === 'openai' && process.env.OPENAI_API_KEY) {
    cached = new OpenAiProvider();
  } else {
    cached = new RuleBasedProvider();
  }
  return cached;
}

export function providerInfo() {
  const p = getProvider();
  return { name: p.name, mode: p.mode };
}

export * from './provider';
