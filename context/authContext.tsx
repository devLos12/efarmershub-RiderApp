import React, { createContext, ReactNode, useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Orders, AuthContextProps, AuthProviderProps, User, BadgeState } from "../types/context";
import { API_URL } from "@env";
import { io } from "socket.io-client";

interface Participant {
    role: string;
    accountId: {
        _id: string;
        firstname: string;
        lastname: string;
        email: string;
    };
}

interface InboxItem {
    _id: string;
    participants: Participant[];
    lastMessage: string;
    lastSender: string;
    updatedAt: string;
    unreadCount: {
        rider?: number;
    };
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthContextProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Orders[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [triggerUi, setTriggerUi] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    
    // Inbox state
    const [inboxBadge, setInboxBadge] = useState<BadgeState>({
        number: 0,
        show: false
    });
    const [inboxList, setInboxList] = useState<InboxItem[]>([]);
    const [inboxLoading, setInboxLoading] = useState(true);
    const [inboxError, setInboxError] = useState<string | null>(null);
    const socketRef = useRef<any>(null);
    const [ordersLoading, setOrdersLoading] = useState(true);





    // Fetch inbox chats
    const getChatsInbox = async () => {
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/getRiderInboxChat`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            

            setInboxLoading(false);
            setInboxError(null);
            setInboxList(data);

            
            

            // Count unread chats and update badge
            const unreadChatsCount = data.filter((chat: InboxItem) => {
                return (chat.unreadCount?.rider || 0) > 0;
            }).length;

            setInboxBadge({
                number: unreadChatsCount,
                show: unreadChatsCount > 0
            });

        } catch (err: any) {
            setInboxLoading(false);
            setInboxError(err.message);
            console.log("Error fetching inbox:", err.message);
        }
    };

    // Load token on mount
    useEffect(() => {
        const loadToken = async () => {
            try {
                const storedToken = await AsyncStorage.getItem("accessToken");
                if (storedToken) {
                    setToken(storedToken);
                } 
            } finally {
                setLoading(false);
            }
        };

        loadToken();
    }, []); 

    // Setup socket and fetch inbox when token is available
    useEffect(() => {
        if (!token) return;

        socketRef.current = io(API_URL);
        getChatsInbox();

        socketRef.current.on("newChatInbox", (e: any) => {
            getChatsInbox();
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [token]);

    const login = async (newToken: string) => {
        await AsyncStorage.setItem("accessToken", newToken);
        setToken(newToken);
    }

    const logOut = async () => {
        await AsyncStorage.removeItem("accessToken");
        setToken(null);
        // Reset inbox state on logout
        setInboxBadge({ number: 0, show: false });
        setInboxList([]);
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
    }


    
    return (
        <AuthContext.Provider value={{ 
            token, 
            setToken, 
            login, 
            logOut, 
            loading,
            setLoading,
            orders, 
            setOrders,
            error, 
            setError,
            triggerUi, 
            setTriggerUi,
            user, 
            setUser,
            // Inbox data
            inboxBadge,
            setInboxBadge,
            inboxList,
            setInboxList,
            inboxLoading,
            inboxError,
            getChatsInbox,
            ordersLoading,
            setOrdersLoading
        }}>
            {children}
        </AuthContext.Provider>
    )
}

