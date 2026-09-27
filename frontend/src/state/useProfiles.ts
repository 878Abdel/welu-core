import { useCallback, useEffect, useState } from 'react';
import { api, type ApiProfile } from '../services/api';
import { errText } from '../lib/toast';

/** Liste des profils réels (/api/profiles) avec chargement, erreur et relance. */
export function useProfiles() {
  const [profiles, setProfiles] = useState<ApiProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfiles(await api.profiles());
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { profiles, error, loading, reload: load };
}
