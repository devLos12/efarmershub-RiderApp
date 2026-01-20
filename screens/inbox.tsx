import React, { useState } from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator,
    RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@env";
import { useAuth } from "../context/useAuth";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavProp = NativeStackNavigationProp<RootStackParamList, "Messages">;


const Inbox: React.FC = () => {
    const [refreshing, setRefreshing] = useState(false);
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
        const sender = chatData.participants.find((p: any) => p.role.toLowerCase() === "rider");
        const receiver = chatData.participants.find((p: any) => p.role.toLowerCase() !== "rider");

        if (!sender || !receiver) return;

        const currentUnread = chatData.unreadCount?.rider || 0;

        // Update local state immediately
        setInboxList((prev) =>  
            prev.map((con) => 
                con._id === chatData._id 
                ? { ...con, unreadCount: { ...con.unreadCount, rider: 0 } }
                : con 
            )
        );

        // Update badge immediately (decrement if there was unread)
        if (currentUnread > 0) {
            setInboxBadge((prev) => ({
                number: Math.max(0, prev.number - 1),
                show: (prev.number - 1) > 0
            }));
        }

        const displayName = receiver.accountId?.firstname
            ? `${receiver.accountId.firstname} ${receiver.accountId.lastname}`
            : receiver.role;

        try {
            await fetch(`${API_URL}/api/updateMarkAsReadFromRider/${chatData._id}`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });

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
        } catch (err) {
            console.log("Error marking as read:", err);
        }
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

        try {
            await fetch(`${API_URL}/api/deleteChat/${chatId}`, {
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
            <View className="flex-1 px-4">
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

                            return (
                                <TouchableOpacity
                                    key={data._id}
                                    onPress={() => handleChatPress(data)}
                                    onLongPress={() => handleDeleteChat(data._id)}
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
                                            <Text className="ml-1.5 text-gray-600">({receiver.role})</Text>
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
                                        <View className="bg-blue-500 rounded-xl min-w-[24px] h-6 justify-center items-center px-1.5">
                                            <Text className="text-white text-xs font-bold">
                                                {unreadCount > 9 ? "9+" : unreadCount}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <View className="bg-white rounded-2xl p-10 items-center mt-5">
                            <Text className="text-gray-400 capitalize">
                                {inboxError || "no messages"}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

export default Inbox;