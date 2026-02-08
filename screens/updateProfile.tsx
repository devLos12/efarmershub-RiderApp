import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { RootStackParamList } from "../types/navigation";
import { useEffect, useState, useLayoutEffect } from "react";
import { useAuth } from "../context/useAuth";
import { API_URL } from "@env";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";



type FormData = {
    imageFile?: string,
    firstname: string,
    lastname: string,
    email: string,
    contact: string,
    wallet_number: string,
    wallet_type: string,
}

const UpdateProfile: React.FC = () => {
    const { user, setUser, token } = useAuth();
    const [formData, setFormData] = useState<FormData>({
        imageFile: '',
        firstname: '',
        lastname: '',
        email: '',
        contact: '',
        wallet_number: '',
        wallet_type: '',
    });
    const [originalData, setOriginalData] = useState<FormData>({
        imageFile: '',
        firstname: '',
        lastname: '',
        email: '',
        contact: '',
        wallet_number: '',
        wallet_type: '',
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isFormChanged, setIsFormChanged] = useState<boolean>(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imagePrev, setImagePrev] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    
    // Get initials for avatar
    const getInitials = () => {
        const first = formData.firstname?.charAt(0)?.toUpperCase() || '';
        const last = formData.lastname?.charAt(0)?.toUpperCase() || '';
        return `${first}${last}` || '?';
    };

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission required", "Please allow access to your gallery.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        }); 

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setImagePreview(uri);
            setFormData(prev => ({
                ...prev,
                imageFile: uri,
            }));
        }
    };

    const removeImage = () => {
        Alert.alert(
            "Remove Photo",
            "Are you sure you want to remove your profile picture?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                        setImagePreview(null);
                        setFormData(prev => ({
                            ...prev,
                            imageFile: imagePrev ?? "",
                        }));
                    },
                },
            ]
        );
    };

    useEffect(() => {
        if (user) {
            const userData = {
                imageFile: user.imageFile || '',
                firstname: user.firstname || '',
                lastname: user.lastname || '',
                email: user.email || '',
                contact: user.contact || '',
                wallet_number: user.e_WalletAcc.number || '',
                wallet_type: user.e_WalletAcc.type || '',
            };

            setFormData(userData);
            setOriginalData(userData);
            setImagePrev(userData?.imageFile);
        }
    }, [user]);

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

    useLayoutEffect(() => {
        const hasChanged = 
            formData.imageFile !== originalData.imageFile ||
            formData.firstname !== originalData.firstname ||
            formData.lastname !== originalData.lastname ||
            formData.email !== originalData.email ||
            formData.contact !== originalData.contact ||
            formData.wallet_number !== originalData.wallet_number ||
            formData.wallet_type !== originalData.wallet_type;
            
        setIsFormChanged(hasChanged);
    }, [formData, originalData]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleUpdateProfile = async () => {
        if (!user?._id) {
            Alert.alert('Error', 'User ID not found');
            return;
        }

        if (!formData.firstname || !formData.lastname || !formData.email) {
            Alert.alert('Validation Error', 'Please fill in all required fields');
            return;
        }

        setIsLoading(true);

        const sendData = new FormData();

        if (formData.imageFile && imagePreview) {
            sendData.append("image", {
                uri: formData.imageFile,
                name: "profile.jpg",
                type: "image/jpeg",
            } as any);
        }

        sendData.append("firstname", formData?.firstname);
        sendData.append("lastname", formData?.lastname);
        sendData.append("email", formData?.email);
        sendData.append("contact", formData?.contact);
        sendData.append("wallet_number", formData?.wallet_number);
        sendData.append("wallet_type", formData?.wallet_type);


        try {
            const response = await fetch(`${API_URL}/api/updateProfile`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: sendData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            setImagePreview(null);
            setImagePrev(null);
            setUser(data.rider);
            setOriginalData(formData);

            // Show success modal instead of Alert
            setShowSuccessModal(true);
        } catch (error) {
            if (error instanceof Error) {
                console.error('Update profile error:', error.message);
                Alert.alert('Error', error.message || 'Failed to update profile');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const isButtonDisabled = !isFormChanged || isLoading;

    return (
        <View className="flex-1">
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
                        <Text className="text-base text-gray-600 text-center">Profile updated successfully</Text>
                    </View>
                </View>
            )}




            <ScrollView 
                className="flex-1" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                <View className="px-3">
                    {/* Profile Card with Avatar */}
                    <View className="bg-white rounded-3xl shadow-lg p-5 my-3">
                        <View className="items-center">
                            {/* Avatar with Ring */}
                            <View className="mb-4 relative">
                                {imagePreview ? (
                                    <Image
                                        source={{ uri: imagePreview }}
                                        style={{ width: 120, height: 120, borderRadius: 60 }}
                                        className="border-4 border-white"
                                    />
                                ) : formData?.imageFile ? (
                                    <Image
                                        source={{ uri: `${formData?.imageFile}` }}
                                        style={{ width: 120, height: 120, borderRadius: 60 }}
                                        className="border-4 border-white"
                                    />
                                ) : (
                                    <View className="rounded-full justify-center items-center bg-black"
                                    style={{ width: 120, height: 120 }}
                                    >
                                        <Text className="text-white text-4xl font-bold">
                                            {getInitials()}
                                        </Text>
                                    </View>
                                )}
                                
                                {!imagePreview && (
                                    <TouchableOpacity 
                                        onPress={pickImage}
                                        className="absolute bottom-0 right-0 bg-black w-10 h-10 rounded-full justify-center items-center shadow-lg border-2 border-white"
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="camera" size={18} color="white" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Name Display */}
                            <Text className="text-xl font-bold text-gray-800 mb-1 capitalize w-full text-center">
                                {formData.firstname && formData.lastname 
                                    ? `${formData.firstname} ${formData.lastname}`
                                    : 'Your Name'}
                            </Text>
                            <Text className="text-gray-500 text-sm mb-4">{formData.email || 'your.email@example.com'}</Text>

                            {/* Remove Photo Button (if preview exists) */}
                            {imagePreview && (
                                <TouchableOpacity 
                                    onPress={removeImage}
                                    className="bg-red-50 px-5 py-2.5 rounded-full flex-row items-center"
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                    <Text className="text-red-500 font-semibold ml-2 text-sm">Remove Photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Personal Information Card */}
                    <View className="bg-white rounded-3xl shadow-lg p-6 mb-5">
                        <View className="flex-row items-center mb-6">
                            <View className="w-10 h-10 rounded-full bg-blue-50 justify-center items-center mr-3">
                                <Ionicons name="person-outline" size={20} color="#3b82f6" />
                            </View>
                            <Text className="text-lg font-bold text-gray-800">Personal Information</Text>
                        </View>

                        {/* First Name */}
                        <View className="mb-5">
                            <Text className="text-xs font-semibold mb-2 text-gray-600 uppercase tracking-wide">First Name *</Text>
                            <View className="bg-gray-50 border-2 border-gray-100 rounded-2xl overflow-hidden">
                                <TextInput
                                    className="px-4 py-4 text-base text-gray-800"
                                    value={formData.firstname}
                                    onChangeText={(value) => handleInputChange('firstname', value)}
                                    placeholder="Enter your first name"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </View>

                        {/* Last Name */}
                        <View className="mb-5">
                            <Text className="text-xs font-semibold mb-2 text-gray-600 uppercase tracking-wide">Last Name *</Text>
                            <View className="bg-gray-50 border-2 border-gray-100 rounded-2xl overflow-hidden">
                                <TextInput
                                    className="px-4 py-4 text-base text-gray-800"
                                    value={formData.lastname}
                                    onChangeText={(value) => handleInputChange('lastname', value)}
                                    placeholder="Enter your last name"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View className="mb-5">
                            <Text className="text-xs font-semibold mb-2 text-gray-600 uppercase tracking-wide">Email Address *</Text>
                            <View className="bg-gray-50 border-2 border-gray-100 rounded-2xl overflow-hidden">
                                <TextInput
                                    className="px-4 py-4 text-base text-gray-800"
                                    value={formData.email}
                                    onChangeText={(value) => handleInputChange('email', value)}
                                    placeholder="your.email@example.com"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* E-Wallet Number */}
                        <View className="mb-5">
                            <Text className="text-xs font-semibold mb-2 text-gray-600 uppercase tracking-wide">E-Wallet Number</Text>
                            <View className="bg-gray-50 border-2 border-gray-100 rounded-2xl overflow-hidden">
                                <TextInput
                                    className="px-4 py-4 text-base text-gray-800"
                                    value={formData.wallet_number}
                                    onChangeText={(value) => handleInputChange('wallet_number', value)}
                                    placeholder="Enter wallet number"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        {/* E-Wallet Type */}
                        <View className="mb-0">
                            <Text className="text-xs font-semibold mb-2 text-gray-600 uppercase tracking-wide">E-Wallet Type</Text>
                            <View className="bg-gray-50 border-2 border-gray-100 rounded-2xl overflow-hidden">
                                <TextInput
                                    className="px-4 py-4 text-base text-gray-800 capitalize"
                                    value={formData.wallet_type}
                                    onChangeText={(value) => handleInputChange('wallet_type', value)}
                                    placeholder="G-Cash or Maya"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                            <Text className="text-xs text-gray-500 mt-2 ml-1">Common options: G-Cash, Maya</Text>
                        </View>
                    </View>

                    {/* Save Changes Button */}
                    <TouchableOpacity 
                        className={`${isButtonDisabled ? 'bg-gray-300' : 'bg-black'}
                         rounded-2xl overflow-hidden`}
                        onPress={handleUpdateProfile}
                        disabled={isButtonDisabled}
                        activeOpacity={0.8}
                    >
                        <View className="px-6 py-4 flex-row items-center justify-center">
                            {isLoading ? (
                                <>
                                    <Text className="text-white text-base font-bold mr-2">Updating</Text>
                                    <Ionicons name="sync" size={20} color="white" />
                                </>
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="white" />
                                    <Text className="text-white text-base font-bold ml-2">Save Changes</Text>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* Info Text */}
                    {isFormChanged && (
                        <View className="mt-2 bg-blue-50 rounded-2xl p-4 flex-row items-start">
                            <Ionicons name="information-circle" size={20} color="#3b82f6" />
                            <Text className="text-blue-700 text-sm ml-2 flex-1">
                                You have unsaved changes. Don't forget to save your updates!
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

export default UpdateProfile;

