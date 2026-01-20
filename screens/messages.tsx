import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState, useRef, useMemo, useLayoutEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    Platform,
    Alert,
    KeyboardAvoidingView,
    Keyboard,
    StyleSheet,
    TouchableWithoutFeedback,
} from "react-native";
import { RootStackParamList } from "../types/navigation";
import * as ImagePicker from 'expo-image-picker';
import { io, Socket } from 'socket.io-client';
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@env";
import { useAuth } from "../context/useAuth";
import { Ionicons } from "@expo/vector-icons";






type MessageProp = NativeStackScreenProps<RootStackParamList, "Messages">;



interface MessageType {
    senderId: string;
    text: string;
    imageFiles?: string[];
    createdAt: string;
    readBy?: string[];
}

interface ImagePreview {
    id: number;
    uri: string;
    file: any;
    name: string;
}


const Messages: React.FC<MessageProp> = ({ navigation, route }) => {
    const { source, chatId, senderId, credentials } = route.params;
    const { token } = useAuth();

    const [messageText, setMessageText] = useState("");
    const [chat, setChat] = useState<MessageType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<ImagePreview[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);
    const socketRef = useRef<Socket | null>(null);

    const [inputHeight, setInputHeight] = useState(40);


    useLayoutEffect(() => {
        navigation.setOptions({
            title: (source === "user") || (source === "User") ? "Buyer" : "Help & Support",
        });
    }, [navigation, source]);




    // Fetch messages
    const getMessages = async () => {
        try {
            const res = await fetch(`${API_URL}/api/getRiderMessages/${chatId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            
            if (res.status === 401) {
                navigation.replace("Login");
                return;
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setLoading(false);
            setChat(data);
            setError(null);
        } catch (err: any) {
            setLoading(false);
            setError(err.message);
            console.log("Error: ", err.message);
        }
    };




    
    // Mark as read
    useEffect(() => {
        if (chat.length === 0) return;

        const lastMsg = chat[chat.length - 1];

        if (lastMsg.senderId !== senderId) {
            fetch(`${API_URL}/api/updateMarkAsReadFromRider/${chatId}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
        }
    }, [chat]);

    // Socket connection
    useEffect(() => {
        if (!chatId) return;

        getMessages();

        socketRef.current = io(API_URL);

        socketRef.current.on("newMessageSent", () => {
            getMessages();
        });

        socketRef.current.on("markAsRead", () => {
            getMessages();
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.off("newMessageSent");
                socketRef.current.off("markAsRead");
                socketRef.current.disconnect();
            }
        };
    }, [chatId]);

    // Pick images
    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const newImages = result.assets.map((asset, index) => ({
                id: Date.now() + index,
                uri: asset.uri,
                file: asset,
                name: asset.fileName || `image_${Date.now()}`
            }));

            setImages(prev => [...prev, ...newImages]);
        }
    };

    // Remove single image
    const removeImage = (imageId: number) => {
        setImages(prev => prev.filter(img => img.id !== imageId));
    };

    // Remove all images
    const removeAllImages = () => {
        setImages([]);
    };

    // Send message
    const sendMessage = async () => {
        const hasText = messageText?.trim();
        const hasImages = images.length > 0;

        if (!hasText && !hasImages) return;

        const formData = new FormData();
        formData.append("receiverId", credentials.id);
        formData.append("receiverRole", credentials.role.toLowerCase());
        formData.append("textMessage", messageText || "");

        if (images.length > 0) {
            images.forEach((img) => {
                formData.append("images", {
                    uri: img.uri,
                    type: 'image/jpeg',
                    name: img.name
                } as any);
            });
        }

        try {
            const res = await fetch(`${API_URL}/api/riderSendMessage`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setChat(prev => [
                ...prev,
                {
                    senderId: data.senderId,
                    text: data.textMessage,
                    imageFiles: data.imageFiles,
                    createdAt: data.time
                }
            ]);

            setMessageText("");
            setImages([]);
        } catch (err: any) {
            console.log("Error", err.message);
        }
    };



    // Auto-scroll whenever chat updates
    useEffect(() => {
        if (scrollViewRef.current && chat.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 0);
        }
    }, [chat, messageText]);

    

    useEffect(() => {
        const showSub = Keyboard.addListener("keyboardDidShow", () => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        });

        const hideSub = Keyboard.addListener("keyboardDidHide", () => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        });
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);




    // Format date
    const formatDate = (date: Date) => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <>
         <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{flex: 1}}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 50}
        > 
           <TouchableWithoutFeedback onPress={Keyboard.dismiss} >
                    <View className="flex-1 justify-between ">

                        <View className="flex-row items-center p-4 bg-white border-b border-gray-200"> 
                            <View 
                                className="w-10 h-10 rounded-full justify-center items-center bg-black"
                            >
                                <Text className="text-white text-xl font-bold">
                                    {credentials?.name?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View className="ml-3 flex-1">
                                <View className="flex-row items-center">
                                    <Text className="text-lg font-bold capitalize">{credentials?.name}</Text>
                                    <Text className="ml-2 text-sm text-gray-600">({credentials?.role})</Text>
                                </View>
                                <Text className="text-sm text-gray-600">{credentials?.email}</Text>
                            </View>
                        </View>

                        <ScrollView
                            ref={scrollViewRef}
                            className="px-4"
                            showsVerticalScrollIndicator={true}
                        >
                            {chat.length === 0 ? (
                                <View className="flex-1 justify-center items-center mt-16">
                                    <Text className="text-2xl font-bold mb-2">
                                        {source === "admin" ? "Chat with us" : "Start chatting"}
                                    </Text>
                                    <Text className="text-sm text-gray-600">
                                        {error || "Send your first message"}
                                    </Text>
                                </View>
                            ) : (
                                chat.map((item, index) => {
                                    const isSender = item.senderId === senderId;
                                    const lastMessage = index === chat.length - 1;

                                    const currentDate = new Date(item.createdAt);
                                    const prevDate = index > 0 ? new Date(chat[index - 1].createdAt) : null;

                                    const isNewDate =
                                        !prevDate || currentDate.toDateString() !== prevDate.toDateString();

                                    const hasText = item.text && item.text.trim();
                                    const hasImages = item.imageFiles && item.imageFiles.length > 0;

                                    return (
                                        <View key={index}>
                                            {isNewDate && (
                                                <View className="items-center my-3">
                                                    <Text className="text-xs text-gray-600">{formatDate(currentDate)}</Text>
                                                </View>
                                            )}

                                            {hasImages && (
                                                <View className={`my-1 ${isSender ? 'items-end' : 'items-start'}`}>
                                                    <View className="flex-row flex-wrap max-w-[70%]">
                                                        {item.imageFiles?.map((filename, imgIndex) => (
                                                            <Image
                                                                key={imgIndex}
                                                                source={{ uri: `${API_URL}/api/uploads/${filename}` }}
                                                                className="w-[120px] h-[120px] rounded-lg m-0.5"
                                                            />
                                                        ))}
                                                    </View>
                                                </View>
                                            )}


                                            {hasText && (
                                                <View className={`my-1 ${isSender ? 'items-end' : 'items-start'}`}>
                                                    <View className={`max-w-[70%] px-3 py-2 rounded-xl ${
                                                        isSender ? 'bg-green-600' : 'bg-gray-200'
                                                    }`}>
                                                        <Text className={`text-base ${isSender ? 'text-white' : 'text-black'}`}>
                                                            {item.text}
                                                        </Text>
                                                        <Text className={`text-[10px] mt-1 ${isSender ? 'text-white/70' : 'text-gray-600'}`}>
                                                            {new Date(item.createdAt).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}

                                            {isSender && lastMessage && (
                                                <Text className="text-[10px] text-right mr-2 font-bold text-gray-600">
                                                    {item.readBy?.includes(credentials.id) ? "seen" : "sent"}
                                                </Text>
                                            )}
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView> 

                         {images.length > 0 && (
                                <ScrollView horizontal className="bg-white pt-5  " 
                                style={{height: 200}}
                                >
                                    {images.map((img) => (
                                        <View key={img.id} className="relative mr-2 p-1"
                                        >
                                            <TouchableOpacity
                                                className="absolute -top-2 -right-2 bg-white rounded-full w-6 h-6 justify-center items-center z-10 shadow-md"
                                                onPress={() => removeImage(img.id)}
                                            >
                                                <Text className="text-lg text-black">×</Text>
                                            </TouchableOpacity>
                                            <Image source={{ uri: img.uri }} className="w-20 h-20 rounded-lg" />
                                        </View>
                                    ))}
                                    {images.length > 1 && (
                                        <TouchableOpacity 
                                            className="w-20 h-20 justify-center items-center bg-white rounded-lg border border-gray-300 mr-2"
                                            onPress={removeAllImages}
                                        >
                                            <Text className="text-xs text-red-500">Clear All</Text>
                                        </TouchableOpacity>
                                    )}
                                </ScrollView>
                        )}

                        <SafeAreaView className="bg-white " edges={["bottom", "right", "left"]}
                        >
                            <View className="flex-row items-end p-3 bg-white border-t border-gray-200"
                            >
                                <TouchableOpacity 
                                    className="w-10 h-10 rounded-full bg-gray-200 justify-center items-center mr-2"
                                    onPress={pickImages}
                                >
                                    <Text className="text-2xl text-gray-600">+</Text>
                                </TouchableOpacity>

                                <TextInput
                                    className="flex-1 max-h-[100px] px-3 py-2 bg-gray-200 rounded-full mr-2"
                                    value={messageText}
                                    onChangeText={setMessageText}
                                    placeholder="Type a message..."
                                    multiline
                                    numberOfLines={2}
                                    onContentSizeChange={(e) => {
                                        const height = e.nativeEvent.contentSize.height;
                                        setInputHeight(Math.min(height, 80)); // max 80px for 2 rows
                                    }}
                                    style={{
                                        maxHeight: 80,
                                        minHeight: 40,
                                    }}

                                />

                                <TouchableOpacity 
                                    className="w-10 h-10 rounded-full bg-black justify-center items-center"
                                    onPress={sendMessage}
                                >
                                    <Ionicons name="chevron-forward" color={"white"} size={19}/>
                                </TouchableOpacity>
                            </View>
                        </SafeAreaView>
                    </View>                    
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>




        </>
         
            
    );
};




export default Messages;
