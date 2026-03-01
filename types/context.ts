import { ReactNode } from "react";

export type User = {
    _id: string;
    imageFile: string;
    firstname: string;
    lastname: string;
    email: string;
    contact: string;
    status: string;
    e_WalletAcc: {
        type: string;
        number: string;
    },
}


export type Orders = {
    _id: string;
    orderId: string;
    userId: string;
    firstname: string;
    lastname: string;
    email: string;
    contact: string;
    address: string;
    paymentStatus: string;
    statusDelivery: string;
    statusHistory: {
        _id: string;
        status: string;
        description: string;
        location: string;
        date: string;
        timestamp: string;
        imageFile: string;
    }[];
    rider: string;
    imageFile?: string;
    orderItems: {
        imageFile: string;
        prodName: string;
        prodPrice: number;
        prodDisc: string;
        quantity: number;
    }[];
    totalPrice: number
}

export type BadgeState = {
    number: number;
    show: boolean;
}

export interface InboxItem {
    _id: string;
    participants: {
        role: string;
        accountId: {
            _id: string;
            firstname: string;
            lastname: string;
            email: string;
        };
    }[];
    lastMessage: string;
    lastSender: string;
    updatedAt: string;
    unreadCount: {
        rider?: number;
    };
}

export type AuthContextProps = {
    token: string | null;
    setToken: React.Dispatch<React.SetStateAction<string | null>>
    login: (newToken: string) => Promise<void>;
    logOut: () => Promise<void>;
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    orders: Orders[];
    setOrders: React.Dispatch<React.SetStateAction<Orders[]>>;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>
    triggerUi: boolean;
    setTriggerUi: React.Dispatch<React.SetStateAction<boolean>>; 
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    // Inbox data
    inboxBadge: BadgeState;
    setInboxBadge: React.Dispatch<React.SetStateAction<BadgeState>>;
    inboxList: InboxItem[];
    setInboxList: React.Dispatch<React.SetStateAction<InboxItem[]>>;
    inboxLoading: boolean;
    inboxError: string | null;
    getChatsInbox: () => Promise<void>;
    ordersLoading: boolean;
    setOrdersLoading: React.Dispatch<React.SetStateAction<boolean>>;
    
}   

export type AuthProviderProps = {
    children: ReactNode;
}



