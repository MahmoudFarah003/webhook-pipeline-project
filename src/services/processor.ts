export function processPayload(action: string, payload: any) {

  if (action === "uppercase") {
    return {
      text: payload.text.toUpperCase(),
    };
  }

  if (action === "wordcount") {
    return {
      words: payload.text.split(" ").length,
    };
  }

  if (action === "timestamp") {
    return {
      ...payload,
      timestamp: new Date(),
    };
  }

  return payload;
}