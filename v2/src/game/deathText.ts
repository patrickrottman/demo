import type { DeathCause } from '../core/contracts/DeathCause';

function killerLabel(killerName: string | null): string {
  return killerName && killerName.trim().length > 0 ? killerName : 'someone';
}

export function formatDeathCause(cause: DeathCause, killerName: string | null): string {
  if (cause === 'border') return 'You hit the wall';
  return `Eaten by ${killerLabel(killerName)}`;
}

export function formatKillFeed(name: string, cause: DeathCause, killerName: string | null): string {
  if (cause === 'border') return `${name} hit the wall`;
  return `${name} was eaten by ${killerLabel(killerName)}`;
}
