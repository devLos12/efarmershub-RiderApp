import { useState, useLayoutEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    View,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/useAuth";
import { API_URL } from "@env";

// ── Password Input Field Component (Extracted) ──
interface PasswordInputFieldProps {
    label: string;
    fieldName: "currentPassword" | "newPassword" | "confirmPassword";
    value: string;
    showPassword: boolean;
    error?: string;
    onChangeText: (text: string) => void;
    onToggleShow: () => void;
    editable?: boolean;
}

const PasswordInputField: React.FC<PasswordInputFieldProps> = ({
    label,
    fieldName,
    value,
    showPassword,
    error,
    onChangeText,
    onToggleShow,
    editable = true,
}) => (
    <View className="mb-5">
        <Text className="text-xs font-semibold mb-2 text-gray-600 uppercase tracking-wide">
            {label}
        </Text>
        <View className={`bg-gray-50 border-2 rounded-2xl overflow-hidden flex-row items-center px-4 ${
            error ? "border-red-500" : "border-gray-100"
        }`}>
            <Ionicons
                name="lock-closed-outline"
                size={20}
                color={error ? "#ef4444" : "#6b7280"}
                style={{ marginRight: 10 }}
            />
            <TextInput
                className="flex-1 py-4 text-base text-gray-800"
                placeholder={`Enter ${label.toLowerCase()}`}
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={value}
                onChangeText={onChangeText}
                editable={editable}
            />
            <TouchableOpacity
                onPress={onToggleShow}
                disabled={!value || !editable}
                className="p-2"
            >
                <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={value ? "#3b82f6" : "#d1d5db"}
                />
            </TouchableOpacity>
        </View>
        {error && (
            <Text className="text-red-500 text-xs mt-2 ml-1">{error}</Text>
        )}
    </View>
);

// ── Main Component ──
const ChangePassword: React.FC = () => {
    const navigation = useNavigation();
    const { token } = useAuth();

    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isFormChanged, setIsFormChanged] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ""
            }));
        }
    };

    useLayoutEffect(() => {
        const hasAnyInput =
            formData.currentPassword !== "" ||
            formData.newPassword !== "" ||
            formData.confirmPassword !== "";
        setIsFormChanged(hasAnyInput);
    }, [formData]);

    const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.currentPassword) {
            newErrors.currentPassword = "Current password is required";
        }

        if (!formData.newPassword) {
            newErrors.newPassword = "New password is required";
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = "Password must be at least 6 characters";
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        if (formData.currentPassword && formData.newPassword && 
            formData.currentPassword === formData.newPassword) {
            newErrors.newPassword = "New password must be different from current password";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/change-password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                }),
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific backend errors - set error to currentPassword field
                const newErrors: Record<string, string> = {};
                
                // If current password doesn't match (from backend verification)
                if (data.code === 'bad-request') {
                    newErrors.currentPassword = data.message;
                    setErrors(newErrors);
                } else {
                    // Generic error with alert
                    Alert.alert("Error", data.message || "Failed to change password");
                }
                
                return;
            }

            if (data.success) {
                setShowSuccessModal(true);
                setTimeout(() => setIsModalVisible(true), 10);
                const timer = setTimeout(() => {
                    setIsModalVisible(false);
                    setTimeout(() => setShowSuccessModal(false), 300);
                }, 2000);

                // Reset form
                setFormData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                });
                setIsFormChanged(false);
                setErrors({});

                return () => clearTimeout(timer);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "An error occurred while changing password");
            console.log("Password change error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const isButtonDisabled = !isFormChanged || isLoading;

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* ── Success Modal ── */}
            {showSuccessModal && (
                <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 9999, justifyContent: 'center', alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                }}>
                    <View style={{
                        backgroundColor: 'white', borderRadius: 20, padding: 24,
                        alignItems: 'center', minWidth: 280,
                        transform: [{ scale: isModalVisible ? 1 : 0.9 }],
                        opacity: isModalVisible ? 1 : 0,
                    }}>
                        <View className="bg-green-100 rounded-full p-4 mb-4">
                            <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
                        </View>
                        <Text className="text-xl font-bold text-gray-800 mb-2">Success!</Text>
                        <Text className="text-base text-gray-600 text-center">Password changed successfully</Text>
                    </View>
                </View>
            )}

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 40 }}
                scrollEnabled={true}
            >
                <View className="px-4">

                    {/* ── Password Security Info ── */}
                    <View className="bg-yellow-50 rounded-2xl p-4 mb-6 flex-row items-start border-l-4 border-yellow-500">
                        <Ionicons name="information-circle" 
                        size={20} 
                        color={'#b45309'}
                        style={{ marginRight: 10, marginTop: 2 }} />
                        <Text className="text-yellow-700 text-sm flex-1">
                            Please enter your current password and choose a new secure password.
                        </Text>
                    </View>

                    {/* ── Password Fields Card ── */}
                    <View className="bg-white rounded-3xl shadow-lg p-6 mb-5">
                        <PasswordInputField
                            label="Current Password"
                            fieldName="currentPassword"
                            value={formData.currentPassword}
                            showPassword={showPasswords.current}
                            error={errors.currentPassword}
                            onChangeText={(text) => handleInputChange('currentPassword', text)}
                            onToggleShow={() => togglePasswordVisibility('current')}
                            editable={!isLoading}
                        />

                        <PasswordInputField
                            label="New Password"
                            fieldName="newPassword"
                            value={formData.newPassword}
                            showPassword={showPasswords.new}
                            error={errors.newPassword}
                            onChangeText={(text) => handleInputChange('newPassword', text)}
                            onToggleShow={() => togglePasswordVisibility('new')}
                            editable={!isLoading}
                        />

                        <PasswordInputField
                            label="Confirm New Password"
                            fieldName="confirmPassword"
                            value={formData.confirmPassword}
                            showPassword={showPasswords.confirm}
                            error={errors.confirmPassword}
                            onChangeText={(text) => handleInputChange('confirmPassword', text)}
                            onToggleShow={() => togglePasswordVisibility('confirm')}
                            editable={!isLoading}
                        />
                    </View>

                    {/* ── Unsaved Changes Notice ── */}
                    {isFormChanged && (
                        <View className="bg-yellow-50 rounded-2xl p-4 mb-5 flex-row items-start border-l-4 border-yellow-400">
                            <Ionicons name="alert-circle" size={20} color="#ca8a04" style={{ marginRight: 10, marginTop: 2 }} />
                            <Text className="text-yellow-800 text-sm flex-1 font-medium">
                                You have unsaved changes
                            </Text>
                        </View>
                    )}

                    {/* ── Action Buttons ── */}
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            className="flex-1 bg-gray-200 rounded-2xl overflow-hidden"
                            disabled={isLoading}
                            activeOpacity={0.7}
                            onPress={() => navigation.goBack()}
                        >
                            <View className="px-6 py-4 flex-row items-center justify-center">
                                <Text className="text-gray-800 text-base font-bold">Cancel</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`flex-1 ${isButtonDisabled ? 'bg-gray-300' : 'bg-black'} rounded-2xl overflow-hidden`}
                            onPress={handleSubmit}
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
                                        <Text className="text-white text-base font-bold ml-2">Change Password</Text>
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ChangePassword;