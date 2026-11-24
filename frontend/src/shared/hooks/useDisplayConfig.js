import { useEffect, useState } from 'react';
import { DEFAULT_DISPLAY_CONFIG, loadDisplayConfig, resolveProductDisplay } from '../utils/productDisplay';

// One shared fetch (cached for 5 min) used by every product card on the page.
export const useDisplayConfig = () => {
  const [config, setConfig] = useState(DEFAULT_DISPLAY_CONFIG);
  useEffect(() => {
    let alive = true;
    loadDisplayConfig().then(c => { if (alive) setConfig(c); });
    return () => { alive = false; };
  }, []);
  return config;
};

export const useProductDisplay = (product) => {
  const config = useDisplayConfig();
  return resolveProductDisplay(product, config);
};
