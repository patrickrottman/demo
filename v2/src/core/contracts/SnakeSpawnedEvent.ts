export interface SnakeSpawnedEvent {
  readonly type: 'snakeSpawned';
  readonly snakeId: number;
  readonly isPlayer: boolean;
}
