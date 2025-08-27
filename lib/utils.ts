export const REWARD_THRESHOLD = 10
export function pctFill(stamps: number, threshold = REWARD_THRESHOLD) {
  const clamped = Math.max(0, Math.min(stamps, threshold))
  return (clamped / threshold) * 100
}
export function formatPhone(p: string) {
  const digits = p.replace(/\D/g, '').slice(-10)
  const m = digits.match(/(\d{3})(\d{3})(\d{4})/)
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : p
}
export function makeCode() { return Math.floor(100000 + Math.random() * 900000).toString() }
