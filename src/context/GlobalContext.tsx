import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../services/api';
import type { Hotel, Transfer, Quotation, StaffUser } from '../types';

interface GlobalContextProps {
  hotels: Hotel[];
  setHotels: React.Dispatch<React.SetStateAction<Hotel[]>>;
  transfers: Transfer[];
  setTransfers: React.Dispatch<React.SetStateAction<Transfer[]>>;
  quotes: Quotation[];
  setQuotes: React.Dispatch<React.SetStateAction<Quotation[]>>;
  users: StaffUser[];
  setUsers: React.Dispatch<React.SetStateAction<StaffUser[]>>;
  loading: boolean;
  refreshData: () => Promise<void>;
}

const GlobalContext = createContext<GlobalContextProps | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [hotelsData, transfersData, quotesData, usersData] = await Promise.all([
        api.getHotels(),
        api.getTransfers(),
        api.getQuotes(),
        api.getUsers()
      ]);

      setHotels(Array.isArray(hotelsData) ? hotelsData : []);
      setTransfers(Array.isArray(transfersData) ? transfersData : []);
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching global data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        hotels,
        setHotels,
        transfers,
        setTransfers,
        quotes,
        setQuotes,
        users,
        setUsers,
        loading,
        refreshData: fetchInitialData,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalData = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobalData must be used within a GlobalProvider');
  }
  return context;
};
