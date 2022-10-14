import { Package } from "@idg/idg";
import largegraph from './largegraph';

const packages: Package[] = [
  largegraph,
];

try {
  const files = require.context('./__gui__', true, /\.(ts|js)$/);
  const keys = files.keys();
  if (keys.length > 0) {
    keys.forEach((key) => {
      // __gui__/index.ts
      if (key === './index.ts' || key === './index.js') {
        const p = files(key);
        packages.push(p.default);
      }
      // __gui__/packages/index.ts
      if (key === './packages/index.ts' || key === './packages/index.js') {
        const ps = files(key);
        packages.push(...ps.default);
      }
    });
  }
} catch (e) {}


export default packages;