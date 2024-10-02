import { useContext } from "react";
import { WebSocketContext } from "../context/WebSocketContext";

export const useWebSocket = () => {
    return useContext(WebSocketContext);
};