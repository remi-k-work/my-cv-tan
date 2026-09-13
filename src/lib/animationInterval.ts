// A requestAnimationFrame-based alternative to setInterval()
export default function animationInterval(ms: number, signals: AbortSignal[], callback: (time: number) => void) {
  // Record the start time of the animation
  const start = performance.now();

  // Tracks the last interval tick that has been executed
  let lastTick = -1;

  // Called on each animation frame
  function step(time: number) {
    // Stop immediately on any abort signal
    if (signals.some((signal) => signal.aborted)) return;

    // Time passed since the animation started
    const elapsed = time - start;

    // Current tick (which interval we're in, 0-based)
    const tick = Math.floor(elapsed / ms);

    // Only fire the callback when we hit a new tick
    if (tick > lastTick) {
      lastTick = tick;

      // Pass the exact interval timestamp
      callback(tick * ms);
    }

    // Continue the loop
    requestAnimationFrame(step);
  }

  // Kick off the animation loop
  requestAnimationFrame(step);
}
