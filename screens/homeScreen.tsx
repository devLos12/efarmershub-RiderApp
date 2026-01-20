import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@env";
import { io } from "socket.io-client";
import OrderList from "./orderList";
import { useAuth } from "../context/useAuth";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const { token, setOrders, setError, triggerUi, logOut } = useAuth();
  const navigation = useNavigation<NavProp>();
  const latestOrderRef = useRef<any>(null);

  type socketProps = {
    message: string;
    orderId?: string;
    customerName?: string;
    itemCount?: number;
  }
  
  const getAllDelivery = async() => {
    
    
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
      
      // Store latest order in ref for socket handler
      if (data && data.length > 0) {
        latestOrderRef.current = data[0];
      }

    }catch(error: unknown){
      if( error instanceof Error){
        setError(error.message);

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
        console.log("Unknown Error: ", error);
      }
    }
  }



  useEffect(() => {
    const socket = io(API_URL);
    

    

    getAllDelivery();
    socket.on("to rider", async (e: socketProps) => {
      
      // Refresh orders list first and WAIT for it to complete
      await getAllDelivery();

      // Small delay to ensure ref is updated
      setTimeout(() => {
        Alert.alert(
          "🔔 New Delivery Available!",
          `You have a new delivery request.`,
          [
            {
              text: "Later",
              style: "cancel"
            },
            {
              text: "View Order",
              onPress: () => {
                // Use the latest order from ref
                const data = latestOrderRef.current;
                
                if (data) {
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
              }
            }
          ]
        );
      }, 200);
    });

    return () => {
      socket.disconnect();
    }
  }, [triggerUi]); // Removed 'orders' dependency

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
        <OrderList onRefresh={getAllDelivery} />
    </SafeAreaView>
  )
}

export default HomeScreen;