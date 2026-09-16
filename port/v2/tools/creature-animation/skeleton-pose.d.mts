import type {Affine2, Point2} from './kinematics.js';
export const MAX_SKELETON_JOINTS: number;
export interface SkeletonDefinition {
  readonly graph: ReadonlyArray<readonly [string, string]>;
  readonly bodyAxis: readonly [string, string];
}
export type SkeletonPose = Readonly<Record<string, {readonly rotation: number; readonly dx?: number; readonly dy?: number}>>;
export interface SkeletonPoseProgram {
  readonly jointNames: readonly string[];
  readonly bodyLength: number;
  pivot(name: string): Point2;
  evaluate(pose: SkeletonPose): Record<string, Affine2>;
}
export function createSkeletonPoseProgram(definition: SkeletonDefinition,
  landmarks: Readonly<Record<string, readonly [number, number]>>): SkeletonPoseProgram;
