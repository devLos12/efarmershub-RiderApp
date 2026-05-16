import React, { useEffect, useState } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { View, Text, TouchableOpacity, Image, Switch, ScrollView, Alert, ActivityIndicator } from "react-native";
import { RootStackParamList } from "../types/navigation";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/useAuth";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "@env";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen: React.FC = () => {
    const { token, logOut, setOrders, user, setUser } = useAuth();
    const navigation = useNavigation<NavProp>();
    const [isOnline, setIsOnline] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    
    // ← NEW: Modal states for status update
    const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [statusModalMessage, setStatusModalMessage] = useState<string>("");
    const [statusSuccess, setStatusSuccess] = useState<boolean>(true);
    
    // Rider profile
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                
                const res = await fetch(`${API_URL}/api/getProfile`, { 
                    method: "GET",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                const data = await res.json();
                
                if(!res.ok) throw new Error(data.message);
                
                setUser(data);
                setIsOnline(data.status === "available" || data.status === "online");
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.log("Error fetching profile:", error.message);
                    Alert.alert("Error", error.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

        

    // ← NEW: Modal animation effect
    useEffect(() => {
        if (showStatusModal) {
            setTimeout(() => setIsModalVisible(true), 10);
            const timer = setTimeout(() => {
                setIsModalVisible(false);
                setTimeout(() => setShowStatusModal(false), 300);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [showStatusModal]);

    const handleToggle = async (value: boolean) => {
        setIsOnline(value);
        const status = value ? "available" : "offline";

        try {
            const res = await fetch(`${API_URL}/api/updateActiveStatus`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });    

            const data = await res.json();

            if(!res.ok) throw new Error(data.message);

            if (user) {
                setUser({ ...user, status });
            }

            // ← NEW: Show success modal instead of Alert
            setStatusSuccess(true);
            setStatusModalMessage(`You are now ${status === "available" ? "online" : "offline"}`);
            setShowStatusModal(true);
            
        } catch (error: unknown) {
            setIsOnline(!value);
            
            if(error instanceof Error) {
                console.log("Error: ", error.message);
                // ← NEW: Show error modal instead of Alert
                setStatusSuccess(false);
                setStatusModalMessage(error.message);
                setShowStatusModal(true);
            } else {
                console.log("Unknown Error: ", error);
                setStatusSuccess(false);
                setStatusModalMessage("Failed to update status");
                setShowStatusModal(true);
            }
        }
    };

    const handleLogout = () => {
        logOut();
        setOrders([]);
        setUser(null);

        navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
        });
    };

    // ✅ LOADING STATE
    if(loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="green" />
                    <Text className="mt-2">Loading Profile</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1" edges={["top"]}>
            {/* ← NEW: Status Update Modal */}
            {showStatusModal && (
                <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 9999, justifyContent: 'center', alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                }}>
                    <View style={{
                        backgroundColor: 'white', borderRadius: 20, padding: 24,
                        alignItems: 'center', minWidth: 280,
                        transform: [{ scale: isModalVisible ? 1 : 0.9 }],
                        opacity: isModalVisible ? 1 : 0,
                    }}>
                        {statusSuccess ? (
                            <>
                                <View className="bg-green-100 rounded-full p-4 mb-4">
                                    <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
                                </View>
                                <Text className="text-xl font-bold text-gray-800 mb-2">Success!</Text>
                            </>
                        ) : (
                            <>
                                <View className="bg-red-100 rounded-full p-4 mb-4">
                                    <Ionicons name="close-circle" size={48} color="#ef4444" />
                                </View>
                                <Text className="text-xl font-bold text-gray-800 mb-2">Error</Text>
                            </>
                        )}
                        <Text className="text-base text-gray-600 text-center">{statusModalMessage}</Text>
                    </View>
                </View>
            )}

            <ScrollView className="flex-1"
            showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="bg-white px-5 py-4 mx-3 rounded-2xl">
                    <Text className="text-black text-2xl font-bold text-center">My Profile</Text>
                </View>

                {/* Profile Info */}
                <View className="bg-white mt-3 mx-3 p-5 rounded-2xl items-center">
                    <View className="relative">
                        {!user?.imageFile ? (
                            <View className="items-center justify-center bg-black rounded-full"
                            style={{width: 100, height: 100 }}>
                                <Text className="uppercase font-semibold text-white text-5xl">
                                    {user?.firstname?.charAt(0)}
                                </Text>
                            </View>
                        ):(
                            <Image 
                                source={{ uri: `${user?.imageFile}`}}
                                className="rounded-full"
                                style={{ height: 100, width: 100 }}
                            />
                        )}
                        <View 
                            className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                        />
                    </View>
                    <View className="flex-row gap-2 mt-4">
                        <Text className="text-gray-900 text-xl font-semibold capitalize">{user?.firstname}</Text>
                        <Text className="text-gray-900 text-xl font-semibold capitalize">{user?.lastname}</Text>
                    </View>

                    <Text className="text-gray-500 text-base mt-1">Rider</Text>
                </View>

                {/* Online/Offline Toggle */}
                <View className="bg-white mt-3 mx-3 rounded-2xl p-2">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                            <View className={`w-10 h-10 rounded-full items-center justify-center ${isOnline ? 'bg-green-100' : 'bg-gray-100'}`}>
                                <Ionicons 
                                    name={isOnline ? "checkmark-circle" : "close-circle"} 
                                    size={24} 
                                    color={isOnline ? "#22c55e" : "#9ca3af"} 
                                />
                            </View>
                            <View>
                                <Text className="text-gray-900 font-semibold text-base">
                                    {isOnline ? "Online" : "Offline"}
                                </Text>
                                <Text className="text-gray-500 text-xs mt-0.5">
                                    {isOnline ? "Available for deliveries" : "Not accepting orders"}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isOnline}
                            onValueChange={handleToggle}
                            trackColor={{ false: "#d1d5db", true: "#86efac" }}
                            thumbColor={isOnline ? "#22c55e" : "#f3f4f6"}
                        />
                    </View>
                </View>

                {/* Contact Information */}
                <View className="bg-white mt-3 mx-3 p-2 rounded-2xl">
                    <View className="flex-row items-center gap-3 py-4 border-b border-gray-100">
                        <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                            <Ionicons name="mail-outline" size={20} color="#a855f7" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-500 text-xs">Email</Text>
                            <Text className="text-gray-900 text-base mt-0.5">{user?.email || "Not provided"}</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center gap-3 py-4">
                        <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center">
                            <Ionicons name="wallet-outline" size={20} color="#f97316" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-500 text-xs">E-Wallet Account</Text>
                            <View className="flex-row justify-between">
                                <Text className="text-gray-900 text-base mt-0.5">{user?.e_WalletAcc?.number || "Not provided"}</Text>
                                <Text className="text-sm mt-0.5 capitalize text-gray-500 me-3">{user?.e_WalletAcc?.type || "Not provided"}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Menu Options */}
                <View className="bg-white my-3 mx-3 p-2 rounded-2xl">
                    <TouchableOpacity 
                        className="flex-row items-center justify-between py-4 border-b border-gray-100"
                        onPress={() => navigation.navigate("EditProfile")}
                    >
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                                <Ionicons name="person-outline" size={20} color="#3b82f6" />
                            </View>
                            <Text className="text-gray-900 text-base">Edit Profile</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>



                    <TouchableOpacity 
                        className="flex-row items-center justify-between py-4 border-b border-gray-100"
                        onPress={() => navigation.navigate("QrPayment")}
                    >
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center">
                                <Ionicons name="qr-code-outline" size={20} color="#6366f1" />
                            </View>
                            <Text className="text-gray-900 text-base">QR Payment</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>


                    <TouchableOpacity 
                        className="flex-row items-center justify-between py-4 border-b border-gray-100"
                        onPress={() => navigation.navigate("ChangePassword")}
                    >
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                                <Ionicons name="lock-closed-outline" size={20} 
                                color="#6b7280"
                                />
                            </View>
                            <Text className="text-gray-900 text-base">Change Password</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                    
                    
                    <TouchableOpacity className="flex-row items-center justify-between py-4"
                    onPress={async()=> {
                        try {
                            const senderData = {
                                receiverId: "unknown",
                                receiverRole: "admin"
                            }

                            const res = await fetch(`${API_URL}/api/getRiderChatId`, {
                                method: "POST",
                                headers : {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token}`
                                },
                                body: JSON.stringify(senderData)
                            })

                            const data = await res.json();  
                            if(!res.ok) throw new Error(data.message);

                            navigation.navigate("Messages", {
                                source: "admin",
                                chatId: data.chatId,
                                senderId: data.senderId,
                                credentials: {
                                    id: data.receiverId,
                                    name: "admin",
                                    email: data.email,
                                    role: "admin"
                                }
                            })
                        } catch (error: unknown ) {
                            if(error instanceof Error)
                            console.log("Error: ", error.message);
                        }
                    }}>
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                                <Ionicons name="help-circle-outline" size={20} color="#6b7280" />
                            </View>
                            <Text className="text-gray-900 text-base">Help & Support</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        className="flex-row items-center justify-between py-4"
                        onPress={handleLogout}
                    >
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                                <Ionicons name="log-out-outline" size={20} color="#6b7280" />
                            </View>
                            <Text className="text-gray-900 text-base">Exit</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};



export default ProfileScreen;