import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@env";
import { io } from "socket.io-client";
import OrderList from "./orderList";
import { useAuth } from "../context/useAuth";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

  
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const { token, setOrders, setError, triggerUi, logOut, setLoading, loading, setOrdersLoading, ordersLoading }
   = useAuth();
  const navigation = useNavigation<NavProp>();
  const latestOrderRef = useRef<any>(null);
  
  // ← NEW: New delivery modal states
  const [showNewDeliveryModal, setShowNewDeliveryModal] = useState(false);
  const [isNewDeliveryModalVisible, setIsNewDeliveryModalVisible] = useState(false);

  type socketProps = {
    message: string;
    orderId?: string;
    customerName?: string;
    itemCount?: number;
  }
  
  const getAllDelivery = async() => {
    setOrdersLoading(true);

    
    try{
      const res = await fetch(`${API_URL}/api/getAllDelivery`,{ 
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        })
      const data =  await res.json();
      if(!res.ok) throw new Error(data.message);
      
      setOrders(data.reverse());
      setLoading(false);

      // Store latest order in ref for socket handler
      if (data && data.length > 0) {
        latestOrderRef.current = data[0];
      } 
      
    }catch(error: unknown){
      if( error instanceof Error){
        setError(error.message);
        setLoading(false);
        setOrdersLoading(false);


        if(error.message === "Token Expired!"){
          Alert.alert("Error: ", "Session Expired");
          logOut();

          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        }

        console.log("Error:", error.message);
      } else {
        setOrdersLoading(false);
        console.log("Unknown Error: ", error);
      }
    } finally {
      setOrdersLoading(false);
    }
  }

  // ← NEW: Close modal function
  const closeNewDeliveryModal = () => {
    setIsNewDeliveryModalVisible(false);
    setTimeout(() => setShowNewDeliveryModal(false), 300);
  };

  // ← NEW: View order function
  const handleViewOrder = () => {
    const data = latestOrderRef.current;

    if (data) {
      closeNewDeliveryModal();
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
    } else {
      Alert.alert("Info", "Please check your orders list");
    }
  };

  useEffect(() => {
    const socket = io(API_URL);

    getAllDelivery();
    socket.on("to rider", async (e: socketProps) => {
      
      // Refresh orders list first and WAIT for it to complete
      await getAllDelivery();

      // Small delay to ensure ref is updated
      setTimeout(() => {
        // ← NEW: Show custom modal instead of Alert
        setShowNewDeliveryModal(true);
        setIsNewDeliveryModalVisible(false);
        setTimeout(() => setIsNewDeliveryModalVisible(true), 10);
      }, 200);
    });
    

    return () => {
      socket.disconnect();
    }
  }, [triggerUi]); // Removed 'orders' dependency


  if(ordersLoading) {
      return (
          <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="green" />
              <Text className="mt-2">Loading Orders</Text>
          </View>
      )
  }

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
        {/* ← NEW: New Delivery Modal */}
        {showNewDeliveryModal && (
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999, justifyContent: 'center', alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}>
            <View style={{
              backgroundColor: 'white', borderRadius: 20, padding: 24,
              minWidth: 280,
              transform: [{ scale: isNewDeliveryModalVisible ? 0.9 : 0.9 }],
              opacity: isNewDeliveryModalVisible ? 1 : 0,
            }}
            className="flex flex-col gap-2"
            >
              {/* Title */}
              <Text className="text-2xl font-bold text-gray-800  text-center ">
                🔔 New Delivery!
              </Text>
              
              {/* Order Details */}
              <View className="bg-gray-50 rounded-xl p-4 ">
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                    Order ID
                  </Text>
                  <Text className="text-lg font-bold text-green-700">
                    {latestOrderRef.current?.orderId || 'N/A'}
                  </Text>
                </View>
                
                <View className="mb-3 pb-3 border-b border-gray-200">
                  <Text className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                    Customer
                  </Text>
                  <Text className="text-base font-semibold text-gray-800 capitalize">
                    {latestOrderRef.current ? `${latestOrderRef.current.firstname} ${latestOrderRef.current.lastname}` : 'N/A'}
                  </Text>
                </View>
                
                <View>
                  <Text className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                    Items
                  </Text>
                  <Text className="text-base font-semibold text-gray-800">
                    {latestOrderRef.current?.orderItems?.length || 0} item{latestOrderRef.current?.orderItems?.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>





              {/* Buttons */}
              <View className="flex-row gap-3 w-full">
                <TouchableOpacity
                  onPress={closeNewDeliveryModal}
                  className="flex-1 bg-gray-100 rounded-lg py-3"
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-800 font-semibold text-center">Later</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleViewOrder}
                  className="flex-1 bg-green-600 rounded-lg py-3 flex-row items-center justify-center gap-2"
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-forward" size={18} color="white" />
                  <Text className="text-white font-semibold">View Order</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}


        <OrderList onRefresh={getAllDelivery} />
    </SafeAreaView>
  )
}

export default HomeScreen;