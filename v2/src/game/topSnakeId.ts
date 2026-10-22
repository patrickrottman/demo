export function topSnakeId(snakes: readonly { readonly id: number; readonly mass: number }[]): number | null {
  let bestId: number | null = null;
  let bestMass = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < snakes.length; i++) {
    const snake = snakes[i];
    if (!snake || snake.mass <= bestMass) continue;
    bestMass = snake.mass;
    bestId = snake.id;
  }
  return bestId;
}
