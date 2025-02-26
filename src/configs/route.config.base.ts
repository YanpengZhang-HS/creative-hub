export const NO_SIDEBAR_ROUTES = ['/login', '/register'];

// Map paths to their parent keys for submenu highlighting
export const pathToKeys: Record<string, string[]> = {
  '/': ['/'],
  // Tools section
  '/tools/text': ['/tools/text', 'tools'],
  '/tools/image': ['/tools/image', 'tools'],
  '/creations': ['/creations'],
};

// Helper type for type-safe path lookup
export type PathKeys = keyof typeof pathToKeys;

// Helper type for route paths
export type RoutePath = PathKeys; 