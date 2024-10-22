import React, { createContext, useCallback, useEffect, useState } from "react";
import { useAppSelector } from "../redux/hooks/hook";
import axios from "axios";
import { useDispatch } from "react-redux";
import { AccessTokenRefreshSuccess } from "../redux/slices/user.slice";
export const WebSocketContext = createContext<WebSocket | null>(null);

function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const { currentUser, accessToken } = useAppSelector((state) => state.user);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [token, setToken] = useState<string>("");

  const getToken = useCallback(
    async (userId: number) => {
      try {
        const getTokenResponse = await axios.get(
          `http://localhost:8000/readtoken?id=${userId}`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("token received is: ", getTokenResponse.data);
        if (
          getTokenResponse.status === 401 &&
          getTokenResponse.data.success === false
        ) {
          console.log("access token has expired, making a new one...");
          const refreshAccessToken = await axios.post(
            `http://localhost:8000/refresh?id=${userId}`
          );
          console.log(
            "access token refreshed response: ",
            refreshAccessToken.data
          );
          dispatch(AccessTokenRefreshSuccess(refreshAccessToken.data));
          await getToken(currentUser?.id as number);
        }
        setToken(getTokenResponse.data.token);
      } catch (error) {
        console.error("Error while getting token: ", error);
      }
    },
    [accessToken, currentUser?.id, dispatch]
  );

  useEffect(() => {
    getToken(currentUser?.id as number);
  }, [currentUser, getToken]);

  useEffect(() => {
    if (token) {
      console.log("Token available, connecting to websocket");
      const socket = new WebSocket("ws://localhost:8001");
      setWs(socket);

      socket.onopen = () => {
        console.log("Connected to Websocket");
      };

      socket.onmessage = (message) => {
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
