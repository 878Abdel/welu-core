import { useEffect, useState } from 'react';

export type Route = 'landing' | 'client' | 'banque';

const parse = (): Route => {
  const h = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  return h === 'client' || h === 'banque' ? h : 'landing';
};

/** Routage par hash : suffisant pour une démo, aucun serveur à configurer. */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const go = (r: Route) => {
  window.location.hash = r === 'landing' ? '/' : `/${r}`;
};
