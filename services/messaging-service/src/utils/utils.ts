import { JwtPayload } from "jsonwebtoken";
import { Document } from "mongoose";
import { WebSocket } from "ws";
import dotenv from 'dotenv';

dotenv.config();

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

export interface ExtendedDecodedToken extends JwtPayload {
    email: string;
    iat: number;
};

export interface ExtendedWebsocket extends WebSocket {
    user: ExtendedDecodedToken;
    chatPartner: ExtendedWebsocket;
};

export const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET as string;
export const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET as string;
export const PORT = process.env.PORT;