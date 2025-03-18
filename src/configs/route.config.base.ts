export const NO_SIDEBAR_ROUTES = ['/login', '/register'];

// Map paths to their parent keys for submenu highlighting
export const pathToKeys: Record<string, string[]> = {
  '/': ['/'],
  // Tools section
  '/tools/text': ['/tools/text', 'tools'],
  '/tools/text2image': ['/tools/text2image', 'tools'],
  '/tools/image': ['/tools/image', 'tools'],
  '/tools/lipsync': ['/tools/lipsync', 'tools'],
  '/tools/soundeffect': ['/tools/soundeffect', 'tools'],
  '/creations': ['/creations'],
  '/tools/text2music': ['/tools/text2music', 'tools']
};

// Helper type for type-safe path lookup
export type PathKeys = keyof typeof pathToKeys;

// Helper type for route paths
export type RoutePath = PathKeys; 