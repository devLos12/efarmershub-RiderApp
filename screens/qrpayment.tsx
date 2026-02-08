import { View, Text, Image, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Modal, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList} from "../types/navigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useLayoutEffect, useState} from "react";
import { useAuth } from "../context/useAuth";
import { API_URL } from "@env";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');




type QrPaymentProp = NativeStackScreenProps<RootStackParamList, "QrPayment">;

interface QrPaymentData {
    paymentMethod: string;
    imageUrl: string | null;
}


interface ApiResponse {
    success: boolean;
    data: {
        gcashQr: string | null;
        mayaQr: string | null;
    };
}




const QrPayment: React.FC<QrPaymentProp> = ({ navigation, route }) => {
    const { token } = useAuth();
    const [qrPayments, setQrPayments] = useState<QrPaymentData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [fullscreenQr, setFullscreenQr] = useState<{ imageUrl: string; paymentMethod: string } | null>(null);

    
    useLayoutEffect(()=>{
        navigation.setOptions({
            headerShown: true,
            title: "QR Payment"
        })
    },[navigation]);






    const getQrPayment = async () => {
        try {
            const res = await fetch(`${API_URL}/api/getRiderQrPayment`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            const response: ApiResponse = await res.json();
            
            if(!res.ok) throw new Error("Failed to fetch QR codes");

            // Convert API response to array format
            const qrArray: QrPaymentData[] = [];
            
            if (response.data.gcashQr) {
                qrArray.push({
                    paymentMethod: 'gcash',
                    imageUrl: response.data.gcashQr
                });
            }
            
            if (response.data.mayaQr) {
                qrArray.push({
                    paymentMethod: 'maya',
                    imageUrl: response.data.mayaQr
                });
            }

            setQrPayments(qrArray);
            
        } catch (error: unknown) {
            if(error instanceof Error){
                console.log("Error fetching QR payments:", error.message);
                Alert.alert("Error", error.message);
            }
            setQrPayments([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        getQrPayment();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        getQrPayment();
    };

    const getPaymentIcon = (method: string) => {
        switch(method.toLowerCase()) {
            case 'gcash':
                return { name: 'wallet', color: '#007DFF' };
            case 'maya':
                return { name: 'card', color: '#00D632' };
            default:
                return { name: 'qr-code', color: '#6366f1' };
        }
    };

    const getPaymentColor = (method: string) => {
        switch(method.toLowerCase()) {
            case 'gcash':
                return 'bg-blue-50';
            case 'maya':
                return 'bg-green-50';
            default:
                return 'bg-indigo-50';
        }
    };


    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text className="text-gray-500 mt-4">Loading QR codes...</Text>
                </View>
            </SafeAreaView>
        );
    }


    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
            <ScrollView 
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header Info */}
                <View className="bg-white mx-4 mt-4 p-4 rounded-2xl">
                    <View className="flex-row items-center gap-3">
                        <View className="w-12 h-12 bg-indigo-100 rounded-full items-center justify-center">
                            <Ionicons name="information-circle" size={24} color="#6366f1" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-900 font-semibold text-base">Quick Payment</Text>
                            <Text className="text-gray-500 text-xs mt-0.5">
                                Show these QR codes to customers for instant payment
                            </Text>
                        </View>
                    </View>
                </View>

                {/* QR Code List */}
                {qrPayments.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                            <Ionicons name="qr-code-outline" size={40} color="#9ca3af" />
                        </View>
                        <Text className="text-gray-500 text-base text-center">No QR codes available</Text>
                        <Text className="text-gray-400 text-sm text-center mt-2 px-8">
                            Contact admin to set up your payment QR codes
                        </Text>
                    </View>
                ) : (
                    <View className="px-4 py-3">
                        {qrPayments.map((payment, index) => {
                            const icon = getPaymentIcon(payment.paymentMethod);
                            const bgColor = getPaymentColor(payment.paymentMethod);
                            
                            return (
                                <View 
                                    key={`${payment.paymentMethod}-${index}`} 
                                    className="bg-white rounded-2xl mb-4 overflow-hidden"
                                >
                                    {/* Payment Method Header */}
                                    <View className={`${bgColor} px-4 py-3 flex-row items-center justify-between`}>
                                        <View className="flex-row items-center gap-2">
                                            <View className="w-8 h-8 bg-white rounded-full items-center justify-center">
                                                <Ionicons name={icon.name as any} size={18} color={icon.color} />
                                            </View>
                                            <Text className="text-gray-900 font-bold text-lg uppercase">
                                                {payment.paymentMethod}
                                            </Text>
                                        </View>
                                        <View className="bg-white px-3 py-1 rounded-full">
                                            <Text className="text-gray-600 text-xs font-medium">Active</Text>
                                        </View>
                                    </View>

                                    {/* QR Code Image */}
                                    <TouchableOpacity 
                                        activeOpacity={0.8}
                                        onPress={() => setFullscreenQr({ imageUrl: `${payment.imageUrl}`, paymentMethod: payment.paymentMethod })}
                                    >
                                        <View className="items-center py-6 px-4">
                                            <View className="bg-white p-4 rounded-2xl border-2 border-gray-200">
                                                <Image 
                                                    source={{ uri: `${payment.imageUrl}` }}
                                                    style={{ width: 250, height: 250 }}
                                                    resizeMode="contain"
                                                />
                                            </View>
                                            
                                            {/* Tap to enlarge hint */}
                                            <View className="mt-2 flex-row items-center gap-1">
                                                <Ionicons name="expand-outline" size={14} color="#9ca3af" />
                                                <Text className="text-gray-400 text-xs">Tap to enlarge</Text>
                                            </View>
                                            
                                            {/* Instructions */}
                                            <View className="mt-3 bg-gray-50 px-4 py-3 rounded-xl w-full">
                                                <View className="flex-row items-start gap-2">
                                                    <Ionicons name="scan-outline" size={20} color="#6b7280" />
                                                    <View className="flex-1">
                                                        <Text className="text-gray-700 text-sm font-medium">
                                                            How to use:
                                                        </Text>
                                                        <Text className="text-gray-600 text-xs mt-1">
                                                            Let the customer scan this QR code with their {payment.paymentMethod.toUpperCase()} app to send payment directly to you.
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Bottom Spacing */}
                <View className="h-6" />
            </ScrollView>



            {/* Fullscreen QR Modal */}
            <Modal
                visible={!!fullscreenQr}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setFullscreenQr(null)}
            >
                <View className="flex-1 bg-black">
                    {/* Header */}
                    <SafeAreaView className="absolute top-0 left-0 right-0 z-10">
                        <View className="flex-row items-center justify-between px-4 py-3">
                            <Text className="text-white font-bold text-lg uppercase">
                                {fullscreenQr?.paymentMethod}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => setFullscreenQr(null)}
                                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                            >
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>





                    {/* QR Code */}
                    <View className="flex-1 items-center justify-center">
                        <View className="bg-white p-6 rounded-3xl">
                            <Image 
                                source={{ uri: `${fullscreenQr?.imageUrl}` }}
                                style={{ 
                                    width: SCREEN_WIDTH * 0.85, 
                                    height: SCREEN_WIDTH * 0.85,
                                    maxWidth: 400,
                                    maxHeight: 400
                                }}
                                resizeMode="contain"
                            />
                        </View>
                        <Text className="text-white/70 text-sm mt-6 text-center px-8">
                            Customer can scan this QR code for payment
                        </Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

export default QrPayment;