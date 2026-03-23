export type ActionType = 'uppercase' | 'wordcount' | 'timestamp' | 'reverse' | 'echo';

interface Payload {
  text?: string;
  [key: string]: any;
}

export function processPayload(action: ActionType, payload: Payload): Payload {
  if (!payload) {
    throw new Error('Payload is required');
  }

  switch(action) {
    case 'uppercase':
      if (!payload.text) {
        throw new Error('Text is required for uppercase action');
      }
      return {
        ...payload,
        text: payload.text.toUpperCase(),
        processed: true,
        action: 'uppercase'
      };

    case 'wordcount':
      if (!payload.text) {
        throw new Error('Text is required for wordcount action');
      }
      return {
        ...payload,
        words: payload.text.trim().split(/\s+/).length, 
        characters: payload.text.length,
        processed: true,
        action: 'wordcount'
      };

    case 'timestamp':
      return {
        ...payload,
        timestamp: new Date().toISOString(), 
        processed: true,
        action: 'timestamp'
      };

    case 'reverse':
      if (!payload.text) {
        throw new Error('Text is required for reverse action');
      }
      return {
        ...payload,
        text: payload.text.split('').reverse().join(''),
        processed: true,
        action: 'reverse'
      };

    case 'echo':
      return {
        ...payload,
        processed: true,
        action: 'echo',
        receivedAt: new Date().toISOString()
      };

    default:
      console.warn(`Unknown action type: ${action}`);
      return {
        ...payload,
        processed: false,
        action: action,
        error: `Unknown action type: ${action}`
      };
  }
}

export async function processPayloadAsync(action: ActionType, payload: Payload): Promise<Payload> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return processPayload(action, payload);
}