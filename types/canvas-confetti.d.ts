declare module 'canvas-confetti' {
  type ConfettiOptions = Record<string, unknown>;
  function confetti(opts?: ConfettiOptions): void;
  export default confetti;
}
