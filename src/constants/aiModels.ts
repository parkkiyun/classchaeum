import { AIProvider, AIModel } from '../types'

export const AI_PROVIDERS: Record<AIProvider, { name: string; baseURL: string }> = {
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1'
  },
  anthropic: {
    name: 'Anthropic',
    baseURL: 'https://api.anthropic.com/v1'
  },
  google: {
    name: 'Google AI',
    baseURL: 'https://generativelanguage.googleapis.com/v1'
  },
  cohere: {
    name: 'Cohere',
    baseURL: 'https://api.cohere.ai/v1'
  },
  custom: {
    name: '사용자 정의',
    baseURL: ''
  }
}

export const AI_MODELS: Record<AIProvider, AIModel[]> = {
  openai: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      maxTokens: 128000,
      supportedFeatures: ['text', 'vision', 'function-calling']
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      maxTokens: 128000,
      supportedFeatures: ['text', 'vision', 'function-calling']
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      maxTokens: 128000,
      supportedFeatures: ['text', 'vision', 'function-calling']
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      maxTokens: 16385,
      supportedFeatures: ['text', 'function-calling']
    }
  ],
  anthropic: [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      maxTokens: 200000,
      supportedFeatures: ['text', 'vision']
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      maxTokens: 200000,
      supportedFeatures: ['text', 'vision']
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      maxTokens: 200000,
      supportedFeatures: ['text', 'vision']
    }
  ],
  google: [
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'google',
      maxTokens: 2097152,
      supportedFeatures: ['text', 'vision', 'audio']
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'google',
      maxTokens: 1048576,
      supportedFeatures: ['text', 'vision', 'audio']
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'google',
      maxTokens: 32768,
      supportedFeatures: ['text']
    }
  ],
  cohere: [
    {
      id: 'command-r-plus',
      name: 'Command R+',
      provider: 'cohere',
      maxTokens: 128000,
      supportedFeatures: ['text', 'rag']
    },
    {
      id: 'command-r',
      name: 'Command R',
      provider: 'cohere',
      maxTokens: 128000,
      supportedFeatures: ['text', 'rag']
    },
    {
      id: 'command',
      name: 'Command',
      provider: 'cohere',
      maxTokens: 4096,
      supportedFeatures: ['text']
    }
  ],
  custom: []
}

export const DEFAULT_API_CONFIG = {
  maxTokens: 4000,
  temperature: 0.7
} 