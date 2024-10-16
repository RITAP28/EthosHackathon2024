export interface User {
    id: number;
    name: string;
    email: string;
}

export interface ChatPartner {
    id: number;
    chatPartnerId: number;
    chatPartnerName: string;
    chatPartnerEmail: string;
    startedAt: Date;
};

export interface ChatHistory {
    chatId: number,
    senderEmail: string;
    receiverEmail: string;
    textMetadata: string;
    sentAt: Date;
    receivedAt: Date;
    isDelivered: boolean;
    isRead: boolean;
}