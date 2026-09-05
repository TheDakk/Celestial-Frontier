export type GameBuildMode = 'evidence' | 'distributable';

export declare function readBuiltGameMode(distDir: string): GameBuildMode;
export declare function assertBuiltGameMode(
  distDir: string,
  expectedMode: GameBuildMode,
): GameBuildMode;
