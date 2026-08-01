// OpenAI-compatible LLM provider.
//
// Calls a chat-completions endpoint requesting JSON output. On any
// error (missing key, network, malformed response) it falls back to
// the rule-based provider so the app keeps working.

import type {
  AiProvider,
  BriefInput,
  ClassifyInput,
  ClassifyResult,
  CommDraftInput,
  EscalationInput,
  EscalationResult,
  RelatedInput,
  RelatedResult,
  ResourceRecInput,
  ResourceRecResult,
  SummaryInput,
} from './provider';
import { RuleBasedProvider } from './rule-based-provider';

const fallback = new RuleBasedProvider();

export class OpenAiProvider implements AiProvider {
  readonly name = 'OpenAI-Compatible LLM';
  readonly mode = 'llm' as const;
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  private async chatJSON<T>(system: string, user: string, fallback: () => Promise<T>): Promise<T> {
    if (!this.apiKey) return fallback();
    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('empty LLM content');
      return JSON.parse(content) as T;
    } catch (err) {
      console.error('[ai] llm request failed, using rule-based provider:', (err as Error).message);
      return fallback();
    }
  }

  async classifyIncident(input: ClassifyInput): Promise<ClassifyResult> {
    // Blend LLM classification with deterministic guards.
    const base = await fallback.classifyIncident(input);
    return this.chatJSON<ClassifyResult>(
      'You are an emergency dispatch triage analyst. Return strict JSON matching the requested schema. Never invent locations.',
      `Analyze this emergency report and return JSON with keys: category, severity (CRITICAL|HIGH|MODERATE|LOW), urgency (LOW|NORMAL|HIGH|CRITICAL), confidence (0-1), agencies (array of POLICE|FIRE|EMS|MUNICIPAL|RELIEF), risks (array), suggestedAction (string), missingInfo (array), requiredResources (array), title (string).\n\nReport: "${input.text}"\nLocation: ${input.locationName || 'unknown'}\n\nUse these enums for category: FIRE,FLOOD,COLLISION,MEDICAL,HAZMAT,STRUCTURAL,CROWD,ROAD_BLOCKAGE,UTILITY,EARTHQUAKE,MISSING_PERSON,OTHER.`,
      async () => base,
    );
  }

  summarizeIncident(input: SummaryInput): Promise<string> {
    return this.chatJSON<{ summary: string }>(
      'You write concise emergency incident summaries. Return JSON {"summary": string}.',
      `Title: ${input.title}\nDescription: ${input.description}\nUpdates: ${input.updates.join(' | ')}`,
      async () => ({ summary: await fallback.summarizeIncident(input) }),
    ).then((r) => r.summary);
  }

  recommendResources(input: ResourceRecInput): Promise<ResourceRecResult> {
    return this.chatJSON<ResourceRecResult>(
      'You recommend emergency resources. Return JSON {picks:[{resourceId,label,reason}],rationale:[string],confidence:number}. Only pick from provided available resources.',
      JSON.stringify(input),
      async () => fallback.recommendResources(input),
    );
  }

  draftCommunication(input: CommDraftInput): Promise<{ subject: string; body: string }> {
    return this.chatJSON<{ subject: string; body: string }>(
      'You draft professional, factual emergency communications. Return JSON {subject, body}. No speculation.',
      JSON.stringify(input),
      async () => fallback.draftCommunication(input),
    );
  }

  assessEscalationRisk(input: EscalationInput): Promise<EscalationResult> {
    return this.chatJSON<EscalationResult>(
      'You assess incident escalation risk. Return JSON {shouldEscalate:boolean,toSeverity,reasons:[string],confidence:number}.',
      JSON.stringify(input),
      async () => fallback.assessEscalationRisk(input),
    );
  }

  detectRelatedIncidents(input: RelatedInput): Promise<RelatedResult> {
    return this.chatJSON<RelatedResult>(
      'You detect duplicate/related emergency reports. Return JSON {matches:[{id,likelihood,reason}]}.',
      JSON.stringify(input),
      async () => fallback.detectRelatedIncidents(input),
    );
  }

  generateBrief(input: BriefInput): Promise<string> {
    return this.chatJSON<{ brief: string }>(
      'You are an incident command briefing officer. Return JSON {"brief": string} with clear sections.',
      JSON.stringify(input),
      async () => ({ brief: await fallback.generateBrief(input) }),
    ).then((r) => r.brief);
  }
}
