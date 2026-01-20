import React, { useMemo, useEffect } from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "@env";
import { useAuth } from "../context/useAuth";





type  TrackOrderProp = NativeStackScreenProps<RootStackParamList, "TrackOrder">;

const TrackOrder: React.FC<TrackOrderProp> = ({ navigation, route }) => {
    const { orderId } = route.params;
    const { orders } = useAuth();


    const statusHistory = useMemo(()=>{
        return orders.find((order) => order._id === orderId)?.statusHistory;
    },[orderId, orders]);


    

    useEffect(()=>{
        navigation.setOptions({
            headerShown: true,
            title: "Track Order"
        })
    },[navigation]);




    

    
    return (
        <SafeAreaView className="flex-1" edges={["bottom", "left","right"]}>
            <ScrollView 
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-1 p-6">
                    {statusHistory?.map((data, i) => (
                        <View key={i} className="flex-row">
                            <View className="w-1/4 relative ">
                                <View>
                                    <Text className="capitalize text-sm ">{data.date}</Text>
                                    <Text className="capitalize text-sm">{data.timestamp}</Text>
                                </View>

                                <View className="absolute top-0 right-[-10px] p-1 rounded-full bg-green-600 "
                                style={{zIndex : 1}}>
                                    <Ionicons name="checkmark" color={"white"} size={12}/>
                                </View>
                            </View>
                            
                            <View className="flex-1 ps-6 border-l-[2px] border-gray-300  ">
                                <Text className="capitalize font-bold ">{data.status}</Text>
                                <View className="mt-2 mb-10 ">
                                    <Text className="capitalize text-sm">{data.description}</Text>
                                    <Text className="capitalize font-bold opacity-75  text-sm">{data.location}</Text>

                                    {data.imageFile && (
                                        <Image 
                                        source={{uri: `${data.imageFile}`}}
                                        className="rounded-lg mt-5"
                                        style={{ height: 120, width: 100}}
                                        resizeMode="cover"
                                        />
                                    )}
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    )

}
export default TrackOrder;
