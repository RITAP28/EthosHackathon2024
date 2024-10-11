/* eslint-disable no-console */
import axios from 'axios';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAppSelector } from '../redux/hooks/hook';

const WebSocketContext = createContext<WebSocket | null>(null);

function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppSelector((state) => state.user);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [token, setToken] = useState<string>('');

  const getToken = async (userId: number) => {
    try {
      const tokenResponse = await axios.get(
        `http://localhost:8000/readtoken?id=${userId}`,
        {
          withCredentials: true,
        },
      );
      console.log('token response: ', tokenResponse);
      setToken(tokenResponse.data.token);
    } catch (error) {
      console.error('Error while fetching token: ', error);
    }
  };

  useEffect(() => {
    getToken(currentUser?.id as number);
  }, [currentUser]);

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (token) {
      console.log('Token available, connecting to WebSocket');
      const socket = new WebSocket('ws://localhost:8001');
      socket.onopen = () => {
        console.log(`WebSocket connection established`);
        socket.send(token);
      };
      socket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        console.log('Message from server: ', data);
      };
      socket.onclose = () => {
        console.log(`Websocket connection closed`);
      };

      setWs(socket);

      return () => {
        if (socket) socket.close();
      };
    }
  }, [token]);
  return (
    <WebSocketContext.Provider value={ws}>{children}</WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

export default WebSocketProvider;
