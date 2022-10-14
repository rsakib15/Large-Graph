try {
  const files = require.context('../packages/__gui__', true, /\.(ts|js)$/);
  const keys = files.keys();
  if (keys.length > 0) {
    keys.forEach((key) => {
      // packages/__gui__/uses.ts|js
      if (key === './uses.ts' || key === './uses.js') {
        files(key);
      }
    });
  }
} catch (e) {}
