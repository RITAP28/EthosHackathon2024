export interface User {
    id: number;
    name: string;
    email: string;
}

export interface ChatPartner {
    id: number;
    chatPartnerId: number;
    chatPartnerName: string;
    startedAt: Date;
};