const encoder = new TextEncoder('utf-8')
export function encodeBase64(input: string): string {
  return encoder.encode(input).toBase64()
}