import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useLayoutEffect, useMemo, useState} from "react";
import { View, Text, TouchableOpacity, Image , ScrollView, Alert, Pressable, ActivityIndicator} from "react-native";
import { RootStackParamList} from "../types/navigation";
import { API_URL } from "@env";
import { useAuth  } from "../context/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

type updateStatusDeliveryProps = {
    id: string ;
    newStatus: string ;
    token: string;
}

type OrderViewProp = NativeStackScreenProps<RootStackParamList, "OrderView">;

const OrderView: React.FC<OrderViewProp> = ({ navigation, route }) =>{
    const { id, 
        orderId, userId, firstname, lastname, email, address, contact, statusDelivery, statusHistory,
        orderItems,totalPrice
     } = route.params;
    const { token, orders, setOrders } = useAuth();
    const [status, setStatus] = useState<string>(statusDelivery);
    const [paymentReceipt, setPaymentReceipt] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const imageProof = useMemo(()=>{
        const imageFile = orders.find((order) => order._id === orderId);
        return imageFile?.imageFile;
    },[orders, orderId])

    const paymentStatus = useMemo(() => {
        const current = orders.find((o) => o._id === orderId);
        return current?.paymentStatus;
    }, [orders, orderId]);

        
    useEffect(() => {
        if (showSuccessModal) {
            setTimeout(() => setIsModalVisible(true), 10);
            
            const timer = setTimeout(() => {
                setIsModalVisible(false);
                setTimeout(() => {
                    setShowSuccessModal(false);
                }, 300);
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [showSuccessModal]);


    useLayoutEffect(()=>{
        navigation.setOptions({
            headerShown: true,
            title: `${id}`,
        })
    },[navigation, orderId, id]);

    const pickReceipt = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.6, // Compressed to 60% quality
            });

            if (!result.canceled) {
                setPaymentReceipt(result.assets[0].uri);
            }
        } catch (error) {
            console.log("Error picking receipt:", error);
            Alert.alert("Error", "Failed to pick receipt");
        }
    };

    const removeReceipt = () => {
        Alert.alert(
            "Remove Receipt",
            "Are you sure you want to remove this receipt?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Remove", 
                    style: "destructive",
                    onPress: () => setPaymentReceipt(null)
                }
            ]
        );
    };

    const updateStatusDelivery = async({ id, newStatus, token } : updateStatusDeliveryProps) =>{
        setIsLoading(true);
        const formData = new FormData();

        formData.append("id", id);
        formData.append("newStatus", newStatus);

        if(status === "in transit" && imageProof){
            formData.append("image", {
                uri: imageProof,
                type: "image/jpeg",
                name: `proof${id}.jpeg`,
            } as any);
        }

        if(paymentReceipt) {
            formData.append("paymentReceipt", {
                uri: paymentReceipt,
                type: "image/jpeg",
                name: `receipt${id}.jpeg`,
            } as any);
        }

        try {
            const res = await fetch(`${API_URL}/api/updateRiderStatusDelivery`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            })
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            setStatus(newStatus);

            setOrders((orders) => orders.map((order) => 
                order._id === id 
                ? { ...order, 
                    paymentStatus: newStatus === "delivered" ? "paid" : order.paymentStatus,
                    statusDelivery: newStatus,
                    statusHistory: data.statusHistory
                } : order
            ));

            if(newStatus === "delivered") {
                setPaymentReceipt(null);
            }

            const message = newStatus === "in transit" 
                ? "Order is now in transit" 
                : "Order delivered successfully";
            setSuccessMessage(message);
            setShowSuccessModal(true);

        } catch (error: unknown) {
            if(error instanceof Error){
                Alert.alert("Error", error.message);
            } else {
                console.log("Unknown Error: ", error);
            }
        } finally {
            setIsLoading(false);
        }
    }

    const currStatus = useMemo(()=>{
        const currentOrder = orders.find((order) => order._id === orderId);
        return currentOrder?.statusHistory.find((item) => item.status === status);
    },[orders, orderId])




    
    return (
        <View className="flex-1 bg-gray-50">
            {/* Loading Overlay */}
            {isLoading && (
                <View 
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 10000,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    }}
                >
                    <View className="bg-white rounded-2xl p-6 items-center min-w-[200px]">
                        <ActivityIndicator size="large" color="#16a34a" />
                        <Text className="text-base font-semibold text-gray-800 mt-4">Processing...</Text>
                        <Text className="text-sm text-gray-600 mt-1 text-center">
                            {status === "in transit" && imageProof 
                                ? "Uploading proof & receipt" 
                                : "Updating order status"}
                        </Text>
                    </View>
                </View>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <View 
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                >
                    <View 
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 20,
                            padding: 24,
                            alignItems: 'center',
                            minWidth: 280,
                            transform: [{ scale: isModalVisible ? 1 : 0.9 }],
                            opacity: isModalVisible ? 1 : 0,
                        }}
                    >
                        <View className="bg-green-100 rounded-full p-4 mb-4">
                            <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
                        </View>
                        <Text className="text-xl font-bold text-gray-800 mb-2">Success!</Text>
                        <Text className="text-base text-gray-600 text-center">{successMessage}</Text>
                    </View>
                </View>
            )}

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{paddingBottom: 20}}
                scrollEnabled={!isLoading}
            >
                {/* Status Card */}
                <Pressable 
                    className={`mx-4 mt-4 px-4 py-3 rounded-xl bg-gray-200`}
                    onPress={()=> {
                        navigation.navigate("TrackOrder", {
                            orderId: orderId
                        })
                    }}
                    disabled={isLoading}
                >
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                                <MaterialCommunityIcons 
                                    name={
                                        status === "in transit" ? "truck-fast" : 
                                        status === "delivered" ? "check-circle" : "package-variant" 
                                    } 
                                    size={16} 
                                    color={"black"}
                                />
                                <Text className={`capitalize text-base font-semibold text-black`}>
                                    {currStatus?.status}
                                </Text>
                            </View>
                            <Text className={`capitalize text-sm mt-1`}>
                                {currStatus?.description}
                            </Text>
                        </View>
                        <Ionicons 
                            name="chevron-forward" 
                            size={16} 
                            color={"black"}
                        />
                    </View>
                </Pressable>
                
                                    
                {/* Customer Info Card */}
                <View className="rounded-2xl shadow-sm border border-gray-100 mx-4 mt-3 overflow-hidden">
                    <View className="bg-white p-3">
                        <View className="flex-row items-center justify-between gap-2 mb-1">
                            <View className="flex-row items-center gap-2">
                                <View className="bg-gray-100 p-1.5 rounded-full">
                                    <Ionicons name="person" size={16} color="#16a34a" />
                                </View>
                                <View className="flex-row gap-2">
                                    <Text className="capitalize text-base font-semibold text-gray-800">{firstname}</Text>
                                    <Text className="capitalize text-base font-semibold text-gray-800">{lastname}</Text>
                                </View>
                            </View>
                            
                            <TouchableOpacity 
                                className="flex-row items-center p-2 px-3 rounded-full gap-1 bg-blue-500"
                                disabled={isLoading}
                                onPress={async()=>{
                                    const senderData = {
                                        receiverId: userId,
                                        receiverRole: "user"
                                    }
                                    try {
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
                                            source: "user",
                                            chatId: data.chatId,
                                            senderId: data.senderId,
                                            credentials: {
                                                id: data.receiverId,
                                                name: `${firstname} ${lastname}`,
                                                email: email,
                                                role: "user"
                                            }
                                        })
                                    } catch (error: unknown) {
                                        if(error instanceof Error){
                                            console.log("Error: ", error.message);
                                        }
                                    }
                                }}
                            >
                                <Ionicons  name="chatbubble" color={"white"} size={15}/>
                                <Text className="text-sm font-bold text-white capitalize">chat</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View className="flex-row items-center gap-2 mb-1">
                            <View className="bg-gray-100 p-1.5 rounded-full">
                                <Ionicons name="call" size={16} color="#16a34a" />
                            </View>
                            <Text className="text-sm text-gray-600">{contact}</Text>
                        </View>

                        <View className="flex-row items-start gap-2">
                            <View className="bg-gray-100 p-1.5 rounded-full mt-0.5">
                                <Ionicons name="location" size={16} color="#16a34a"/>
                            </View>
                            <Text className="text-sm text-gray-600 flex-1 capitalize">{address}</Text>
                        </View>
                    </View>
                </View>

                {/* Order Items Section */}
                {orderItems.map((data, i) => (
                    <View key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 mx-4 mt-2 overflow-hidden">
                        <View className="flex-row gap-3 p-3">
                            <Image 
                                source={{ uri: `${data.imageFile}`}} 
                                resizeMode="cover"
                                className="rounded-lg"
                                style={{ width: 100, height: 80 }} 
                            />
                            <View className="flex-1 justify-between">
                                <View>
                                    <Text className="capitalize text-base font-semibold text-gray-800">{data.prodName}</Text>
                                    <Text className="capitalize text-sm text-gray-600">{data.prodDisc}</Text>
                                </View>
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-sm font-semibold text-gray-700">{`${data.quantity}x`}</Text>
                                    <Text className="font-bold text-base text-gray-800">{`₱${data.prodPrice.toLocaleString("en-PH")}.00`}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}

                {/* Payment Summary */}
                <View className="bg-white rounded-2xl shadow-sm border border-gray-100 mx-4 mt-4 overflow-hidden">
                    <View className="p-4">
                        <View className="flex-row items-center gap-2 mb-3">
                            <MaterialCommunityIcons name="cash-multiple" size={20} color="#16a34a" />
                            <Text className="text-base font-semibold text-gray-800">Payment Summary</Text>
                        </View>
                        
                        <View className="bg-gray-50 rounded-xl p-3">
                            {[
                                {label: "Payment Status", value: paymentStatus},
                                {label: "Total Payment",  value: `₱${totalPrice.toLocaleString('en-PH')}.00`},
                            ].map((data, i) => (
                                <View key={i} className="flex-row items-center justify-between ">
                                    <Text className={`capitalize text-gray-700 ${i === 1 ? "text-lg font-bold" : "text-sm"}`}>{data.label}</Text>
                                    <Text className={`${i === 1 ? "font-bold text-lg text-gray-800" : "text-sm text-gray-600 capitalize w-1/2 text-right "}`}>
                                        {data.value}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Payment Receipt Section */}
                        {status === "in transit" && paymentStatus !== "paid" && (
                            <View className="mt-4 p-3 bg-yellow-50 rounded-xl border border-gray-100">
                                <View className="flex-row items-center gap-2 mb-2">
                                    <MaterialCommunityIcons 
                                    name="receipt" 
                                    size={18}  
                                    />
                                    <Text className="font-semibold  ">GCash/Maya Receipt</Text>
                                </View>
                                
                                <Text className="text-sm mb-3">
                                    Required before marking as delivered. If cash on delivery, take a photo of the actual cash payment. If paid via GCash/Maya, attach the GCash/Maya receipt.
                                </Text>

                                {paymentReceipt ? (
                                    <View className="relative">
                                        <Image
                                            source={{ uri: paymentReceipt }}
                                            className="rounded-lg border-2 border-blue-300"
                                            style={{ width: '100%', height: 200 }}
                                            resizeMode="cover"
                                        />
                                        <TouchableOpacity
                                            onPress={removeReceipt}
                                            className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                                            style={{ elevation: 5 }}
                                            disabled={isLoading}
                                        >
                                            <Ionicons name="close" size={16} color="white" />
                                        </TouchableOpacity>
                                        <View className="absolute bottom-2 left-2 bg-green-500 px-3 py-1 rounded-full">
                                            <Text className="text-white text-xs font-semibold">Receipt Attached ✓</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        onPress={pickReceipt}
                                        className="bg-white border-2 border-dashed border-yellow-500 rounded-lg p-4 items-center"
                                        disabled={isLoading}
                                    >
                                        <MaterialCommunityIcons name="file-upload-outline" 
                                        size={32} 
                                        className="text-yellow-500"
                                        />
                                        <Text className="font-semibold mt-2">Attach Receipt</Text>
                                        <Text className="text-xs text-gray-500 mt-1">Tap to select from gallery</Text>
                                    </TouchableOpacity>
                                )}

                                <View className="mt-3 bg-white rounded-lg p-2 flex-row items-start gap-2">
                                    <Ionicons name="information-circle" size={16} color="#6b7280" />
                                    <Text className="text-xs text-gray-600 flex-1">
                                        Required: Photo of cash payment if COD, or GCash/Maya receipt.
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
            
            <SafeAreaView className="bg-white border-t border-gray-100 py-2" edges={['left','right','bottom']}>
                {imageProof && (
                    <View className="items-start px-4 pb-2">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">Delivery Proof:</Text>
                        <View className="relative">
                            <Image
                                source={{ uri: imageProof }}
                                className="rounded-xl border border-gray-200"
                                style={{ 
                                    width: 100, 
                                    height: 100, 
                                }}
                                resizeMode="cover"
                            />
                            <TouchableOpacity
                                onPress={() => {
                                    setOrders((orders) => 
                                        orders.map((order) =>
                                            order._id === orderId
                                            ? { ...order, imageFile: ""}
                                            : order 
                                        )
                                    )
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5"
                                style={{ zIndex: 1, elevation: 10 }}
                                disabled={isLoading}
                            >
                                <Ionicons name="close" size={14} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                

                <TouchableOpacity 
                    className={`p-3.5 mx-4 rounded-xl flex-row items-center justify-center gap-2 ${
                        status === "delivered" || isLoading 
                        || status === "in transit" && paymentStatus !== "paid" && !paymentReceipt ? "bg-gray-400" : "bg-black"
                    }`}
                    disabled={status === "delivered" || isLoading || (status === "in transit" && paymentStatus !== "paid" && !paymentReceipt)}
                    activeOpacity={0.8}
                    onPress={async()=>{
                        if(status === "in transit" && !imageProof){
                            navigation.navigate("Camera", {
                                orderId
                            });
                        } else {
                            if(imageProof){
                                setOrders((orders) => 
                                    orders.map((order) =>
                                        order._id === orderId
                                        ? {...order, imageFile: ""}
                                        : order 
                                    )
                                )
                            }
                            updateStatusDelivery({ 
                                id: orderId!, 
                                newStatus: status === "ready to deliver" ? "in transit" : "delivered", 
                                token: token!
                            })
                        }
                    }}
                >
                    {isLoading ? (
                        <>
                            <ActivityIndicator size="small" color="white" />
                            <Text className="capitalize text-white font-semibold ml-2">Processing...</Text>
                        </>
                    ) : (
                        <>
                            <Text className="capitalize text-white font-semibold">
                                {
                                    status === "in transit" ? 
                                    imageProof ? "submit now" : "mark as delivered" : 
                                    status === "delivered" ? "complete delivery" : "start delivery"
                                }
                            </Text>
                            <Ionicons name="arrow-forward" size={18} color="white" />
                        </>
                    )}
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    )
}

export default OrderView;