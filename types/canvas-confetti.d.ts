declare module 'canvas-confetti' {
  // Minimal typing to keep TS happy
  type ConfettiOptions = Record<string, unknown>;
  function confetti(opts?: ConfettiOptions): void;
  export default confetti;
}
