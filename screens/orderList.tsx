import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert, SafeAreaView, ActivityIndicator } from "react-native";
import { useAuth } from "../context/useAuth";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RootStackParamList } from "../types/navigation";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { API_URL } from "@env";

type NavProps = NativeStackNavigationProp<RootStackParamList>;

type OrderListProps = {
    onRefresh: () => Promise<void>;
}

const OrderList: React.FC<OrderListProps> = ({ onRefresh }) => {
    const { orders, error, token, setOrders} = useAuth();
    const navigation = useNavigation<NavProps>();
    const [refreshing, setRefreshing] = useState(false);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    // ← NEW: Confirmation modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await onRefresh();
        } catch (err) {
            console.error("Failed to refresh orders:", err);
        } finally {
            setRefreshing(false);
        }
    };

    const toggleSelectMode = () => {
        setIsSelectMode(!isSelectMode);
        setSelectedIds(new Set());
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const updated = new Set(prev);
            if (updated.has(id)) {
                updated.delete(id);
            } else {
                updated.add(id);
            }
            return updated;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === orders.length) {
            setSelectedIds(new Set());
        } else {
            const allIds = new Set(orders.map((o) => o._id));
            setSelectedIds(allIds);
        }
    };

    // ← NEW: Show confirmation modal instead of Alert
    const handleDelete = async () => {
        if (selectedIds.size === 0) {
            Alert.alert("No Selection", "Please select at least one order to delete");
            return;
        }

        setShowConfirmModal(true);
        setIsConfirmModalVisible(false);
        setTimeout(() => setIsConfirmModalVisible(true), 10);
    };

    // ← NEW: Actual delete function
    const confirmDelete = async () => {
        setIsDeleting(true);
        const items = Array.from(selectedIds);
        
        // Optimistic UI Update - remove items immediately
        const previousOrders = [...orders];
        const updatedOrders = orders.filter(order => !selectedIds.has(order._id));
        setOrders(updatedOrders);
        
        // Reset selection state
        setSelectedIds(new Set());
        setIsSelectMode(false);

        try {
            const res = await fetch(`${API_URL}/api/riderDeleteOrders`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ items })
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message);
            }
            
            // Close modal on success
            setIsConfirmModalVisible(false);
            setTimeout(() => setShowConfirmModal(false), 300);
        } catch (error: unknown) {
            // Rollback on error
            setOrders(previousOrders);
            
            if (error instanceof Error) {
                Alert.alert("Error", error.message);
            }
            
            // Close modal on error
            setIsConfirmModalVisible(false);
            setTimeout(() => setShowConfirmModal(false), 300);
            
            // Optionally refresh to ensure sync
            await onRefresh();
        } finally {
            setIsDeleting(false);
        }
    };

    const closeConfirmModal = () => {
        if (!isDeleting) {
            setIsConfirmModalVisible(false);
            setTimeout(() => setShowConfirmModal(false), 300);
        }
    };
    
    if(orders.length === 0) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 h-screen">
                <Ionicons name="cube-outline" size={64} color="#d1d5db" />
                <Text className="capitalize text-lg text-center text-gray-400 mt-4 px-8">{error || 'No Orders'}</Text>
            </View>
        )
    }

    return(
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* ← NEW: Confirmation Modal */}
            {showConfirmModal && (
                <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 9999, justifyContent: 'center', alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                }}>
                    <View style={{
                        backgroundColor: 'white', borderRadius: 20, padding: 24,
                        alignItems: 'center', minWidth: 280,
                        transform: [{ scale: isConfirmModalVisible ? 0.9 : 0.9 }],
                        opacity: isConfirmModalVisible ? 1 : 0,
                    }}>
                        <View className="bg-red-100 rounded-full p-4 mb-4">
                            <Ionicons name="trash" size={48} color="#ef4444" />
                        </View>
                        <Text className="text-xl font-bold text-gray-800 mb-2 text-center">
                            Delete {selectedIds.size} Order{selectedIds.size > 1 ? 's' : ''}?
                        </Text>
                        <Text className="text-base text-gray-600 text-center mb-6">
                            This action cannot be undone.
                        </Text>
                        
                        {/* Buttons */}
                        <View className="flex-row gap-3 w-full">
                            <TouchableOpacity
                                onPress={closeConfirmModal}
                                disabled={isDeleting}
                                className="flex-1 bg-gray-100 rounded-lg py-3"
                                activeOpacity={0.7}
                            >
                                <Text className="text-gray-800 font-semibold text-center">Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                onPress={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 bg-red-500 rounded-lg py-3 flex-row items-center justify-center gap-2"
                                activeOpacity={0.7}
                            >

                                {isDeleting ? (
                                    <>
                                        <ActivityIndicator size="small" color="white" />
                                        <Text className="text-white font-semibold">Deleting...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="trash" size={18} color="white" />
                                        <Text className="text-white font-semibold">Delete</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
            

            {/* ← STICKY HEADER - Outside ScrollView */}
            <View className="px-3 py-4 bg-white border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2 flex-1">
                        <Ionicons name="time-outline" size={28} color="#16a34a" />
                        <View className="flex-1">
                            <Text className="capitalize font-bold text-lg text-gray-800">recent deliveries</Text>
                            {selectedIds.size > 0 && (
                                <Text className="text-sm text-gray-500">{selectedIds.size} selected</Text>
                            )}
                        </View>
                    </View>

                    <View className="flex-row gap-2">
                        {isSelectMode && selectedIds.size > 0 && (
                            <TouchableOpacity
                                onPress={handleDelete}
                                className="bg-red-500 px-4 py-2 rounded-xl flex-row items-center gap-2"
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash" size={16} color="white" />
                                <Text className="text-white font-semibold text-sm">Delete</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={toggleSelectMode}
                            className={`px-4 py-2 rounded-xl flex-row items-center gap-2 ${
                                isSelectMode ? "bg-gray-800" : "bg-green-600"
                            }`}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={isSelectMode ? "close" : "checkmark-circle-outline"}
                                size={16}
                                color="white"
                            />
                            <Text className="text-white font-semibold text-sm">
                                {isSelectMode ? "Cancel" : "Select"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView 
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={["#16a34a"]}
                        tintColor="#16a34a"
                    />
                }
            >
                <View className="mx-3 my-4 pb-4">
                    {/* Select All Button */}
                    {isSelectMode && (
                        <TouchableOpacity
                            onPress={toggleSelectAll}
                            className="bg-white rounded-xl p-3 mb-3 flex-row items-center justify-between border border-gray-200"
                            activeOpacity={0.7}
                        >
                            <View className="flex-row items-center gap-2">
                                <Ionicons
                                    name={selectedIds.size === orders.length ? "checkbox" : "square-outline"}
                                    size={24}
                                    color={selectedIds.size === orders.length ? "#16a34a" : "#9ca3af"}
                                />
                                <Text className="font-semibold text-gray-800">Select All</Text>
                            </View>
                            <Text className="text-sm text-gray-500">
                                {selectedIds.size}/{orders.length}
                            </Text>
                        </TouchableOpacity>
                    )}
                    
                    {orders.map((data, i) => (
                        <TouchableOpacity
                            key={i}
                            onPress={() => {
                                if (isSelectMode) {
                                    toggleSelect(data._id);
                                }
                            }}
                            activeOpacity={isSelectMode ? 0.7 : 1}
                            disabled={!isSelectMode}
                        >
                            <View className={`bg-white rounded-2xl shadow-sm border mb-3 overflow-hidden ${
                                selectedIds.has(data._id) ? "border-green-500 border-2" : "border-gray-100"
                            }`}>
                                {/* Selection Indicator */}
                                {isSelectMode && (
                                    <View className="absolute top-3 right-3 z-10">
                                        <View className={`w-6 h-6 rounded-full items-center justify-center ${
                                            selectedIds.has(data._id) ? "bg-green-600" : "bg-gray-200"
                                        }`}>
                                            {selectedIds.has(data._id) && (
                                                <Ionicons name="checkmark" size={16} color="white" />
                                            )}
                                        </View>
                                    </View>
                                )}

                                <View className="p-4">
                                    {/* Order Header */}
                                    <View className="flex-row items-center justify-between mb-3">
                                        <View className={`px-3 py-1 bg-gray-100 rounded-full opacity-75`}>
                                            <View className="flex-row items-center gap-1.5">
                                                <MaterialCommunityIcons
                                                    name={
                                                        data.statusDelivery === "in transit" ?
                                                        "truck-fast"
                                                        : data.statusDelivery === "delivered" ?
                                                        "check-circle"
                                                        : "package-variant" 
                                                    }  
                                                    size={20} 
                                                    color={"black"}
                                                />
                                                <Text className={`capitalize text-base font-semibold`}>
                                                    {data.statusDelivery}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="flex-row items-center gap-2">
                                            <View className="bg-green-50 px-3 py-1 rounded-full">
                                                <Text className="text-green-700 font-semibold text-base">
                                                    {data.orderId}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Customer Info */}
                                    <View className="bg-gray-50 rounded-xl p-3 mb-3">
                                        <View className="flex-row items-center gap-2 mb-2">
                                            <View className="bg-white p-1.5 rounded-full">
                                                <Ionicons name="person" size={16} color="#16a34a" />
                                            </View>
                                            <Text className="capitalize text-base font-semibold text-black">
                                                {`${data.firstname} ${data.lastname}`}
                                            </Text>
                                        </View>
                                        
                                        <View className="flex-row items-start gap-2 opacity-75">
                                            <View className="bg-white p-1.5 rounded-full mt-0.5">
                                                <Ionicons name="location" size={16} color="#16a34a"/>
                                            </View>
                                            <Text className="text-sm text-black flex-1" numberOfLines={2}>
                                                {data.address}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Action Button */}
                                    <TouchableOpacity 
                                        className="bg-black rounded-xl py-3 flex-row items-center justify-center gap-2"
                                        onPress={() => {
                                            if (!isSelectMode) {
                                                navigation.navigate("OrderView", { 
                                                    id: data.orderId,
                                                    orderId: data._id,
                                                    userId: data.userId,
                                                    firstname: data.firstname,
                                                    lastname: data.lastname,
                                                    email: data.email,
                                                    address: data.address,
                                                    contact: data.contact,
                                                    statusDelivery: data.statusDelivery,
                                                    statusHistory: data.statusHistory,
                                                    orderItems: data.orderItems,
                                                    totalPrice: data.totalPrice,
                                                    paymentStatus: data.paymentStatus
                                                });
                                            }
                                        }}
                                        activeOpacity={0.8}
                                        disabled={isSelectMode}
                                    >
                                        <Text className="capitalize text-white font-semibold">view details</Text>
                                        <Ionicons name="arrow-forward" size={18} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default OrderList;