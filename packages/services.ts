import { Service } from '@idg/idg';

export default function() {
  const services: Service[] = [];
  try {
    const gui = require.context('./__gui__', false, /services\.(ts|js)$/);
    const keys = gui.keys();
    if (keys.length > 0) {
      const p = gui(keys[0]);
      services.push(...p.default());
    }
  } catch(e) {}

  return services;
}
