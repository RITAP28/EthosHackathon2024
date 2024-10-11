import { JwtPayload } from "jsonwebtoken";
import { Document } from "mongoose";
import { WebSocket } from "ws";

export interface Text extends Document {
    senderId: number;
    senderName: string;
    receiverId: number;
    receiverName: string;
    textMetadata: string;
    sentAt: Date;
    receivedAt: Date;
    isDelivered: boolean;
    isRead: boolean;
}

interface User {
    email: string;
}

export interface ExtendedDecodedToken extends JwtPayload {
    email: string;
    iat: number;
};

export interface ExtendedWebsocket extends WebSocket {
    user: ExtendedDecodedToken;
    chatPartner: ExtendedWebsocket;
}