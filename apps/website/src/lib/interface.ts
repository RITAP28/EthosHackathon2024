export interface User {
    id?: number;
    name?: string;
    email: string;
    password: string
}

export interface ChatPartner {
    id: number;
    chatPartnerId: number;
    senderEmail: string;
    chatPartnerName: string;
    chatPartnerEmail: string;
    startedAt: Date;
    latestChat: string;
    updatedAt: Date;
};

export interface ChatHistory {
    chatId?: number,
    senderEmail: string;
    receiverEmail: string;
    textMetadata: string;
    sentAt: Date;
    receivedAt?: Date;
    isDelivered?: boolean;
    isRead?: boolean;
}