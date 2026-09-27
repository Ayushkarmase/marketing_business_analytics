import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const BusinessContext = createContext();

export function BusinessProvider({ children }) {
  const [business, setBusiness] = useState(null);
  const [dataSources, setDataSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [syncingSourceId, setSyncingSourceId] = useState(null);
  const [syncFeedback, setSyncFeedback] = useState(null);

  const refreshDataSources = useCallback(async () => {
    try {
      const res = await api.getDataSources();
      setDataSources(res.data_sources || []);
    } catch (err) {
      console.error('Failed to load data sources:', err);
    } finally {
      setLoadingSources(false);
    }
  }, []);

  useEffect(() => {
    api.getCurrentBusiness()
      .then(res => setBusiness(res.business))
      .catch(console.error);

    refreshDataSources();
  }, [refreshDataSources]);

  const triggerSyncNow = async (sourceId) => {
    setSyncingSourceId(sourceId);
    setSyncFeedback(null);
    try {
      const res = await api.syncDataSourceNow(sourceId);
      setSyncFeedback({
        type: 'success',
        message: res.message || 'Synchronization completed successfully.'
      });
      await refreshDataSources();
      return res;
    } catch (err) {
      setSyncFeedback({
        type: 'error',
        message: err.message || 'Synchronization failed. Previous valid data preserved.',
        missing_credentials: err.data?.missing_credentials
      });
      await refreshDataSources();
      throw err;
    } finally {
      setSyncingSourceId(null);
    }
  };

  const hasSampleData = dataSources.some(ds => ds.is_sample_data);
  const latestSyncDate = dataSources.reduce((latest, ds) => {
    if (!ds.last_sync_at) return latest;
    const d = new Date(ds.last_sync_at);
    return !latest || d > latest ? d : latest;
  }, null);

  return (
    <BusinessContext.Provider value={{
      business,
      dataSources,
      loadingSources,
      syncingSourceId,
      syncFeedback,
      hasSampleData,
      latestSyncDate,
      refreshDataSources,
      triggerSyncNow
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => useContext(BusinessContext);
