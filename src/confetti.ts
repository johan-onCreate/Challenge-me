import confetti from "canvas-confetti";

/** En konfettiburst — används av prisupplåsningar och catch-up-banneren. */
export function burstConfetti(): void {
  confetti({
    particleCount: 110,
    spread: 75,
    startVelocity: 45,
    origin: { x: 0.5, y: 0.75 },
  });
}
