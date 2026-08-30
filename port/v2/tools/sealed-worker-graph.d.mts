export type JavaScriptDependencyEdgeKind =
  | 'module-static'
  | 'module-dynamic'
  | 'nested-worker'
  | 'nested-shared-worker'
  | 'import-scripts';

export interface JavaScriptDependencyEdge {
  readonly kind: JavaScriptDependencyEdgeKind;
  readonly position: number;
  readonly specifier: string | null;
}

export declare function javascriptModuleImports(source: string): readonly JavaScriptDependencyEdge[];
export declare function sealedWorkerJavaScriptDependencyEdges(
  source: string,
): readonly JavaScriptDependencyEdge[];
