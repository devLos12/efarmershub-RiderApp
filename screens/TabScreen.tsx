import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { RootTabParamList } from "../types/navigation";
import { BottomTabBarProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "./homeScreen";
import ProfileScreen from "./profileScreen";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Inbox from "./inbox";
import KeyboardAvoidingComponent from "./messages2";
import Payouts from "./payouts";
import { useAuth } from "../context/useAuth";



const Tab = createBottomTabNavigator<RootTabParamList>();

const MyCustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
    const { inboxBadge, setInboxBadge } = useAuth();



    
    // Hide badge when navigating to Inbox tab
    useEffect(() => {
        const currentRoute = state.routes[state.index].name;
        
        if (currentRoute === "Inbox" && inboxBadge.show) {
            // Hide badge when viewing Inbox
            setInboxBadge((prev) => ({
                ...prev,
                show: false
            }));
        }
    }, [state.index]);

    
    
    return (
        <SafeAreaView edges={["bottom","left", "right"]} 
        className="bg-white"
        >
            <View className="flex-row px-2">
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;
                    const isInbox = route.name === "Inbox";
                    
                    return (
                    <TouchableOpacity 
                        key={index}  
                        className="flex-1 items-center py-3"
                        onPress={() => navigation.navigate(route.name)}
                        activeOpacity={0.7}
                    >   
                        <View className="items-center justify-center px-6 rounded-xl relative">
                            <Ionicons 
                                name={
                                    route.name === "Home" ? "home" : 
                                    route.name === "Payouts" ? "card" :
                                    route.name === "Inbox" ? "mail" : "person-circle"
                                } 
                                size={23}
                                color={isFocused ? "black" : "#9ca3af"}
                            />
                            
                            {/* Badge for Inbox */}
                            {isInbox && inboxBadge.show && (
                                <View 
                                    className="absolute bg-red-500 rounded-full min-w-[18px] h-[18px] justify-center items-center px-1"
                                    style={{ top: -4, right: 8 }}
                                >
                                    <Text className="text-white text-[10px] font-bold">
                                        {inboxBadge.number > 9 ? "9+" : inboxBadge.number}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text className={`${isFocused ? "text-black " : "text-gray-400"} text-sm`}>
                            {route.name}
                        </Text>
                    </TouchableOpacity> 
                    );
                })}
            </View>
        </SafeAreaView>
    );
}

const TabScreen = () => {
    return (
        <Tab.Navigator 
            initialRouteName="Home"
            screenOptions={{ 
                headerShown: false,
                tabBarStyle: {}
            }}
            tabBar={(props) => <MyCustomTabBar {...props} />}
        >
            <Tab.Screen name="Home"    component={HomeScreen} />
            <Tab.Screen name="Inbox"   component={Inbox} />
            <Tab.Screen name="Payouts" component={Payouts} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    )
}

export default TabScreen;