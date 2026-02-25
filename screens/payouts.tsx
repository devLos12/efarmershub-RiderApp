import { API_URL } from "@env";
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Image, Alert, Modal, Dimensions, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/useAuth";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";








type Payout = {
    _id: string;
    riderName: string;
    riderEmail: string;
    totalDelivery: number;
    totalAmount: number;
    netAmount: number;
    taxAmount: number;
    e_WalletAcc: {
        type: string;
        number: string;
    };
    status: "pending" | "paid";
    date: string;
    imageFile?: string;
};



const Payouts: React.FC = () => {
    const { token, logOut } = useAuth();
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [viewingImage, setViewingImage] = useState<string | null>(null);








    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }



    const getPayout = async () => {
        try {
            const res = await fetch(`${API_URL}/api/getPayouts`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setPayouts(data.reverse());
            
            setError("");
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.log("Error:", error.message);
                setError(error.message);
                
                if (error.message === "Token Expired!") {
                    Alert.alert("Session Expired", "Please login again");
                    logOut();
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await getPayout();
        setRefreshing(false);
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
        if (selectedIds.size === payouts.length) {
            setSelectedIds(new Set());
        } else {
            const allIds = new Set(payouts.map((p) => p._id));
            setSelectedIds(allIds);
        }
    };

    const handleDelete = async () => {
        if (selectedIds.size === 0) {
            Alert.alert("No Selection", "Please select at least one payout to delete");
            return;
        }

        Alert.alert(
            "Confirm Delete",
            `Are you sure you want to delete ${selectedIds.size} payout${selectedIds.size > 1 ? 's' : ''}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const items = Array.from(selectedIds);
                            const res = await fetch(`${API_URL}/api/riderDeletePayout`, {
                                method: "PATCH",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token}`
                                },
                                body: JSON.stringify({ items })
                            });

                            const data = await res.json();
                            if (!res.ok) throw new Error(data.message);

                            setPayouts((prev) => prev.filter((item) => !selectedIds.has(item._id)));
                            setSelectedIds(new Set());
                            setIsSelectMode(false);
                        } catch (error: unknown) {
                            if (error instanceof Error) {
                                Alert.alert("Error", error.message);
                            }
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        getPayout();
    }, []);

    const viewReceipt = (imageFile: string) => {
        setViewingImage(imageFile);
    };

    const closeImageViewer = () => {
        setViewingImage(null);
    };



    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="green" />
                    <Text className="mt-2">Loading Payout</Text>
                </View>
            </SafeAreaView>
        );
    }
    

    if (error && payouts.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
                    <Text className="text-red-500 text-center mt-4 text-lg">{error}</Text>
                    <TouchableOpacity
                        onPress={getPayout}
                        className="mt-6 bg-green-600 px-6 py-3 rounded-xl"
                    >
                        <Text className="text-white font-semibold">Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (payouts.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#16a34a"]}
                            tintColor="#16a34a"
                        />
                    }
                    contentContainerStyle={{ flex: 1 }}
                >
                    <View className="flex-1 items-center justify-center">
                        <MaterialCommunityIcons name="cash-remove" size={64} color="#d1d5db" />
                        <Text className="text-gray-400 text-center mt-4 text-lg px-8">
                            No payout records found
                        </Text>
                        <Text className="text-gray-400 text-center mt-2 text-sm px-8">
                            Pull down to refresh
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    const { width, height } = Dimensions.get('window');

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#16a34a"]}
                        tintColor="#16a34a"
                    />
                }
            >
                <View className="px-4 py-4">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center gap-3">
                            <View className="bg-green-100 p-2 rounded-full">
                                <MaterialCommunityIcons name="wallet" size={24} color="#16a34a" />
                            </View>
                            <View>
                                <Text className="text-2xl font-bold text-gray-800">Payouts</Text>
                                <Text className="text-sm text-gray-500">
                                    {selectedIds.size > 0
                                        ? `${selectedIds.size} selected`
                                        : `${payouts.length} total records`}
                                </Text>
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

                    {/* Select All Button */}
                    {isSelectMode && (
                        <TouchableOpacity
                            onPress={toggleSelectAll}
                            className="bg-white rounded-xl p-3 mb-3 flex-row items-center justify-between border border-gray-200"
                            activeOpacity={0.7}
                        >
                            <View className="flex-row items-center gap-2">
                                <Ionicons
                                    name={
                                        selectedIds.size === payouts.length
                                            ? "checkbox"
                                            : "square-outline"
                                    }
                                    size={24}
                                    color={selectedIds.size === payouts.length ? "#16a34a" : "#9ca3af"}
                                />
                                <Text className="font-semibold text-gray-800">Select All</Text>
                            </View>
                            <Text className="text-sm text-gray-500">
                                {selectedIds.size}/{payouts.length}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Payout Cards */}
                    {payouts.map((payout, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => {
                                if (isSelectMode) {
                                    toggleSelect(payout._id);
                                }
                            }}
                            activeOpacity={isSelectMode ? 0.7 : 1}
                            disabled={!isSelectMode}
                        >
                            <View
                                className={`bg-white rounded-2xl shadow-sm border mb-3 overflow-hidden ${
                                    selectedIds.has(payout._id)
                                        ? "border-green-500 border-2"
                                        : "border-gray-100"
                                }`}
                            >
                                {/* Selection Indicator */}
                                {isSelectMode && (
                                    <View className="absolute top-3 right-3 z-10">
                                        <View
                                            className={`w-6 h-6 rounded-full items-center justify-center ${
                                                selectedIds.has(payout._id)
                                                    ? "bg-green-600"
                                                    : "bg-gray-200"
                                            }`}
                                        >
                                            {selectedIds.has(payout._id) && (
                                                <Ionicons name="checkmark" size={16} color="white" />
                                            )}
                                        </View>
                                    </View>
                                )}

                                {/* Status Badge */}
                                <View className="px-4 pt-4">
                                    <View className="flex-row items-center justify-between mb-3">
                                        <View
                                            className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${
                                                payout.status === "paid"
                                                    ? "bg-green-100"
                                                    : "bg-amber-100"
                                            }`}
                                        >
                                            <MaterialCommunityIcons
                                                name={
                                                    payout.status === "paid"
                                                        ? "check-circle"
                                                        : "clock-outline"
                                                }
                                                size={16}
                                                color={payout.status === "paid" ? "#16a34a" : "#f59e0b"}
                                            />
                                            <Text
                                                className={`capitalize font-semibold text-sm ${
                                                    payout.status === "paid"
                                                        ? "text-green-700"
                                                        : "text-amber-700"
                                                }`}
                                            >
                                                {payout.status}
                                            </Text>
                                        </View>
                                        <Text className="text-sm text-gray-500">{formatDate(payout.date)}</Text>
                                    </View>
                                </View>

                                <View className="px-4 pb-4">
                                    {/* Rider Info */}
                                    <View className="bg-gray-50 rounded-xl p-3 mb-3">
                                        <View className="flex-row items-center gap-2">
                                            <View className="bg-white p-1.5 rounded-full">
                                                <Ionicons name="person" size={16} color="#16a34a" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="font-semibold text-gray-900">
                                                    {payout.riderName}
                                                </Text>
                                                <Text className="text-xs text-gray-500">
                                                    {payout.riderEmail}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
 
                                    {/* E-Wallet Info */}
                                    <View className="bg-purple-50 rounded-xl p-3 mb-3 border border-purple-100">
                                        <View className="flex-row items-center gap-2 mb-1.5">
                                            <MaterialCommunityIcons
                                                name="wallet"
                                                size={18}
                                                color="#9333ea"
                                            />
                                            <Text className="text-sm text-purple-600 font-bold uppercase tracking-wide">
                                                {payout.e_WalletAcc.type}
                                            </Text>
                                        </View>
                                        <Text className="text-sm font-semibold text-purple-700 ">
                                            {payout.e_WalletAcc.number}
                                        </Text>
                                    </View>


                                    {/* Deliveries */}
                                    <View className="bg-blue-50 rounded-xl p-3 mb-3">
                                        <View className="flex-row items-center gap-2 mb-1">
                                            <MaterialCommunityIcons
                                                name="truck-delivery"
                                                size={18}
                                                color="#2563eb"
                                            />
                                            <Text className="text-sm text-blue-600 font-medium  tracking-wide">
                                                Total Deliveries
                                            </Text>
                                        </View>
                                        <Text className="text-base font-bold text-blue-700 ">
                                            {payout.totalDelivery}
                                        </Text>
                                    </View>

                                    {/* Amount Breakdown */}
                                    <View className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-3 border border-green-100">
                                        {/* Gross Amount */}
                                        <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-green-200/50">
                                            <View className="flex-row items-center gap-2">
                                                <MaterialCommunityIcons
                                                    name="cash-multiple"
                                                    size={18}
                                                    color="#16a34a"
                                                />
                                                <Text className="text-sm text-green-700 font-medium">
                                                    Gross Amount
                                                </Text>
                                            </View>
                                            <Text className="text-lg font-bold text-green-700">
                                                ₱{payout.totalAmount.toFixed(2)}
                                            </Text>
                                        </View>

                                        {/* Tax Amount */}
                                        <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-green-200/50">
                                            <View className="flex-row items-center gap-2">
                                                <MaterialCommunityIcons
                                                    name="calculator"
                                                    size={18}
                                                    color="#059669"
                                                />
                                                <Text className="text-sm text-green-600 font-medium">
                                                    Tax Amount
                                                </Text>
                                            </View>
                                            <Text className="text-lg font-semibold text-green-600">
                                                - ₱{payout.taxAmount.toFixed(2)}
                                            </Text>
                                        </View>

                                        {/* Net Amount */}
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-row items-center gap-2">
                                                <MaterialCommunityIcons
                                                    name="cash-check"
                                                    size={20}
                                                    color="#15803d"
                                                />
                                                <Text className="text-base text-green-800 font-bold">
                                                    Net Amount
                                                </Text>
                                            </View>
                                            <Text className="text-xl font-bold text-green-800">
                                                ₱{payout.netAmount.toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>

                                

                                    {/* Receipt Section */}
                                    {payout.imageFile ? (
                                        <TouchableOpacity
                                            onPress={() => viewReceipt(payout.imageFile!)}
                                            className="bg-gray-50 rounded-xl p-3 flex-row items-center gap-3 border border-gray-200"
                                            activeOpacity={0.7}
                                            disabled={isSelectMode}
                                        >
                                            <View className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                <Image
                                                    source={{
                                                        uri: `${payout.imageFile}`
                                                    }}
                                                    className="w-12 h-12"
                                                    resizeMode="cover"
                                                />

                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-xs text-gray-500 mb-0.5">
                                                    Receipt attached
                                                </Text>
                                                <Text
                                                    className="text-sm font-semibold text-gray-900"
                                                    numberOfLines={1}
                                                >
                                                    {payout.imageFile}
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                                        </TouchableOpacity>
                                    ) : (
                                        <View className="bg-gray-50 rounded-xl p-3 items-center border border-gray-200">
                                            <MaterialCommunityIcons
                                                name="file-document-outline"
                                                size={24}
                                                color="#d1d5db"
                                            />
                                            <Text className="text-xs text-gray-400 mt-1">
                                                No receipt attached
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Image Viewer Modal */}
            <Modal
                visible={viewingImage !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={closeImageViewer}
            >
                <View className="flex-1 bg-black">
                    {/* Header */}
                    <SafeAreaView className="absolute top-0 left-0 right-0 z-10" edges={["top"]}>
                        <View className="flex-row items-center justify-between px-4 py-3">
                            <View className="flex-1">
                                <Text className="text-white font-semibold text-base">Receipt</Text>
                                <Text className="text-gray-400 text-xs" numberOfLines={1}>
                                    {viewingImage}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={closeImageViewer}
                                className="bg-white/10 p-2 rounded-full ml-3"
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>

                    {/* Image */}
                    <View className="flex-1 items-center justify-center">
                        {viewingImage && (
                            <Image
                                source={{
                                    uri: `${viewingImage}`
                                }}
                                style={{ width, height }}
                                resizeMode="contain"
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default Payouts;