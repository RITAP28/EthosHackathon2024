import React, { createContext, useEffect, useState } from "react";
import { useAppSelector } from "../redux/hooks/hook";
import axios from "axios";

export const WebSocketContext = createContext<WebSocket | null>(null);

function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppSelector((state) => state.user);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [token, setToken] = useState<string>("");

  const getToken = async (userId: number) => {
    try {
      const getTokenResponse = await axios.get(
        `http://localhost:8000/readtoken?id=${userId}`,
        {
          withCredentials: true,
        }
      );
      console.log("token received is: ", getTokenResponse.data);
      setToken(getTokenResponse.data.token);
    } catch (error) {
      console.error("Error while getting token: ", error);
    }
  };

  useEffect(() => {
    getToken(currentUser?.id as number);
  }, [currentUser]);

  useEffect(() => {
    if (token) {
      console.log("Token available, connecting to websocket");
      const socket = new WebSocket("ws://localhost:8001");
      setWs(socket);

      socket.onopen = () => {
        console.log("Connected to Websocket");
      };

      socket.onmessage = (message) => {
        // const data = JSON.parse(message.data);
        console.log("Received message from the server: ", message);
      };
      socket.onclose = () => {
        console.log("Connection to Websocket closed");
      };
      

      return () => {
        if (socket) socket.close();
      };
    }
  }, [token]);
  return (
    <WebSocketContext.Provider value={ws}>{children}</WebSocketContext.Provider>
  );
}

export default WebSocketProvider;
