export function processPayload(action: string, payload: any) {

  console.log("PROCESSING ACTION:", action); // مهم للتشخيص

  switch (action) {

    case "uppercase":
      return {
        text: payload.text?.toUpperCase()
      };

    case "reverse":
      return {
        text: payload.text?.split("").reverse().join("")
      };

    case "wordcount":
      const text = payload.text || "";
      return {
        words: text.trim().split(/\s+/).length,
        characters: text.length
      };

    case "timestamp":
      return {
        ...payload,
        timestamp: new Date().toISOString()
      };

    case "echo":
      return {
        ...payload,
        processed: true,
        receivedAt: new Date().toISOString()
      };

    default:
      console.log("UNKNOWN ACTION:", action);
      return payload;
  }
}