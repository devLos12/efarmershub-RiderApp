import React, { useState, useRef, useEffect } from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator,
    RefreshControl,
    Alert,
    TouchableWithoutFeedback,
    Pressable
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@env";
import { useAuth } from "../context/useAuth";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from '@expo/vector-icons';

type NavProp = NativeStackNavigationProp<RootStackParamList, "Messages">;


const Inbox: React.FC = () => {
    const [refreshing, setRefreshing] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    
    const { 
        token, 
        inboxList, 
        setInboxList, 
        inboxLoading, 
        inboxError, 
        getChatsInbox,
        setInboxBadge 
    } = useAuth();
    const navigation = useNavigation<NavProp>();

    const onRefresh = async () => {
        setRefreshing(true);
        await getChatsInbox();
        setRefreshing(false);
    };

    const formatTime = (date: string) => {
        const messageDate = new Date(date);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60));

        if (diffHours < 24 && now.getDate() === messageDate.getDate()) {
            return messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        return messageDate.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    const getRandomColor = (name: string) => {
        const colors = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6f42c1", "#20c997"];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const handleChatPress = async (chatData: any) => {
        // Close menu if open
        if (openMenuId) {
            setOpenMenuId(null);
            return;
        }

        const sender = chatData.participants.find((p: any) => p.role.toLowerCase() === "rider");
        const receiver = chatData.participants.find((p: any) => p.role.toLowerCase() !== "rider");

        if (!sender || !receiver) return;

        const currentUnread = chatData.unreadCount?.rider || 0;
        const displayName = receiver.accountId?.firstname
            ? `${receiver.accountId.firstname} ${receiver.accountId.lastname}`
            : receiver.role;

        // Navigate FIRST
        navigation.navigate('Messages', {
            source: receiver.role,
            chatId: chatData._id,
            senderId: sender.accountId._id,
            credentials: {
                id: receiver.accountId._id,
                name: displayName,
                email: receiver.accountId.email,
                role: receiver.role
            }
        });

        // Update state and API in background
        setInboxList((prev) =>  
            prev.map((con) => 
                con._id === chatData._id 
                ? { ...con, unreadCount: { ...con.unreadCount, rider: 0 } }
                : con 
            )
        );

        if (currentUnread > 0) {
            setInboxBadge((prev) => ({
                number: Math.max(0, prev.number - 1),
                show: (prev.number - 1) > 0
            }));
        }

        // API call without await (fire and forget)
        fetch(`${API_URL}/api/updateMarkAsReadFromRider/${chatData._id}`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}` }
        }).catch(err => console.log("Error marking as read:", err));
    };
    
    const handleDeleteChat = async (chatId: string) => {
        const chatToDelete = inboxList.find(chat => chat._id === chatId);
        const hasUnread = (chatToDelete?.unreadCount?.rider || 0) > 0;

        // Update local state
        setInboxList((chats) => chats.filter((chat) => chat._id !== chatId));

        // Update badge if deleted chat had unread messages
        if (hasUnread) {
            setInboxBadge((prev) => ({
                number: Math.max(0, prev.number - 1),
                show: (prev.number - 1) > 0
            }));
        }
                
        // Close menu
        setOpenMenuId(null);

        try {
            await fetch(`${API_URL}/api/deleteRiderChat/${chatId}`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
        } catch (err) {
            console.log("Error deleting chat:", err);
            getChatsInbox(); // Refresh on error
        }
    };

    if (inboxLoading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#007bff" />
                </View>
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <Pressable 
                className="flex-1 px-4"
                onPress={() => {
                    if (openMenuId) setOpenMenuId(null);
                }}
            >
                {/* Header */}
                <View className="py-4">
                    <View className="flex-row items-center">
                        <Text className="text-2xl font-bold capitalize">inbox</Text>
                        <Text className="text-lg font-bold ml-2">{inboxList.length}</Text>
                    </View>
                </View>

                {/* Chat List */}
                <ScrollView
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {inboxList.length > 0 ? (
                        inboxList.map((data) => {
                            const sender = data.participants.find((p) => p.role.toLowerCase() === "rider");
                            const receiver = data.participants.find((p) => p.role.toLowerCase() !== "rider");
                            
                            if (!sender || !receiver) return null;

                            const displayName = receiver.accountId?.firstname
                                ? `${receiver.accountId.firstname} ${receiver.accountId.lastname}`
                                : receiver.role;
                            const unreadCount = data.unreadCount?.rider || 0;
                            const avatarColor = getRandomColor(displayName);
                            const isMenuOpen = openMenuId === data._id;

                            return (
                                <TouchableOpacity
                                    key={data._id}
                                    onPress={() => handleChatPress(data)}
                                    activeOpacity={0.7}
                                    className={`${unreadCount > 0 ? "bg-blue-50" : "bg-white"} rounded-2xl p-3 mb-3 flex-row items-center shadow-sm`}
                                >
                                    {/* Avatar */}
                                    <View
                                        className="w-12 h-12 rounded-full justify-center items-center"
                                        style={{ backgroundColor: avatarColor }}
                                    >
                                        <Text className="text-white text-xl font-bold">
                                            {displayName.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>

                                    {/* Chat Info */}
                                    <View className="flex-1 ml-3">
                                        <View className="flex-row items-center">
                                            <Text className="text-base font-bold capitalize">{displayName}</Text>
                                            <Text className="ml-1.5 text-gray-600">
                                                ({receiver.role === "User" ? "Buyer" : receiver.role})
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center mt-1">
                                            {unreadCount > 1 ? (
                                                <Text className={`${unreadCount > 0 ? "text-black font-bold" : "text-gray-600"}`}>
                                                    {unreadCount > 5 ? "5+" : unreadCount} new messages
                                                </Text>
                                            ) : (
                                                <View className="flex-row items-center">
                                                    {sender.accountId._id === data.lastSender && (
                                                        <Text className="text-gray-600 mr-1">You: </Text>
                                                    )}
                                                    <Text className={`${unreadCount > 0 ? "text-black font-bold" : "text-gray-600"}`}>
                                                        {data.lastMessage.length > 30 ? data.lastMessage.slice(0, 30) + "..." : data.lastMessage}
                                                    </Text>
                                                </View>
                                            )}
                                            <Text className="text-gray-400 ml-2">• {formatTime(data.updatedAt)}</Text>
                                        </View>
                                    </View>

                                    {/* Unread Badge */}
                                    {unreadCount > 0 && (
                                        <View className="bg-blue-500 rounded-xl min-w-[24px] h-6 justify-center items-center px-1.5 mr-2">
                                            <Text className="text-white text-xs font-bold">
                                                {unreadCount > 9 ? "9+" : unreadCount}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Menu Button */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            setOpenMenuId(isMenuOpen ? null : data._id);
                                        }}
                                        className="w-9 h-9 rounded-full bg-gray-100 border border-gray-300 justify-center items-center"
                                    >
                                        <Ionicons name="ellipsis-horizontal" size={18} color="#666" />
                                    </TouchableOpacity>

                                    {/* Delete Menu */}
                                    {isMenuOpen && (
                                        <View className="absolute top-14 right-3 bg-white rounded-lg shadow-lg p-2 z-10 border border-gray-200">
                                            <TouchableOpacity
                                                onPress={() => handleDeleteChat(data._id)}
                                                className="flex-row items-center px-3 py-2 rounded"
                                            >
                                                <Ionicons name="trash-outline" size={18} color="#dc3545" />
                                                <Text className="text-red-600 font-semibold ml-2 capitalize">delete</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <Pressable onPress={() => {
                            if (openMenuId) setOpenMenuId(null);
                        }}>
                            <View className="bg-white rounded-2xl p-10 items-center mt-5">
                                <Text className="text-gray-400 capitalize">
                                    {inboxError || "no messages"}
                                </Text>
                            </View>
                        </Pressable>
                    )}
                </ScrollView>
            </Pressable>
        </SafeAreaView>
    );
};

export default Inbox;