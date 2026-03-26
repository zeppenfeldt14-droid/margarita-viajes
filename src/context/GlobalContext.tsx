import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../services/api';
import type { Hotel, Transfer, Quotation, StaffUser, Reservation, Operation } from '../types';

interface GlobalContextProps {
  hotels: Hotel[];
  setHotels: React.Dispatch<React.SetStateAction<Hotel[]>>;
  transfers: Transfer[];
  setTransfers: React.Dispatch<React.SetStateAction<Transfer[]>>;
  quotes: Quotation[];
  setQuotes: React.Dispatch<React.SetStateAction<Quotation[]>>;
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  operations: Operation[];
  setOperations: React.Dispatch<React.SetStateAction<Operation[]>>;
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
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('staff_token');
      
      // Peticiones públicas
      const [hotelsData, transfersData] = await Promise.all([
        api.getHotels(),
        api.getTransfers()
      ]);

      setHotels(Array.isArray(hotelsData) ? hotelsData : []);
      setTransfers(Array.isArray(transfersData) ? transfersData : []);

      // Peticiones administrativas (solo si hay token)
      if (token) {
        try {
          const [quotesData, reservationsData, operationsData, usersData] = await Promise.all([
            api.getQuotes(),
            api.getReservations(),
            api.getOperations(),
            api.getUsers()
          ]);
          setQuotes(Array.isArray(quotesData) ? quotesData : []);
          setReservations(Array.isArray(reservationsData) ? reservationsData : []);
          setOperations(Array.isArray(operationsData) ? operationsData : []);
          setUsers(Array.isArray(usersData) ? usersData : []);
        } catch (adminError: any) {
          console.error('Error fetching admin data:', adminError);
          // If it's a 401, the api service has already cleared tokens and dispatched an event
          setQuotes([]);
          setUsers([]);
          setReservations([]);
          setOperations([]);
        }
      } else {
        setQuotes([]);
        setUsers([]);
      }
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
        reservations,
        setReservations,
        operations,
        setOperations,
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
