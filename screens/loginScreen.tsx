import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Keyboard, 
  TouchableWithoutFeedback,
  Modal,
  ActivityIndicator,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { z } from "zod";
import { RootStackParamList } from "../types/navigation";
import { API_URL } from "@env";
import { ApiError } from "../utils/apiError";
import { useAuth } from "../context/useAuth";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(50, "Password is too long")
});

type ErrorProps = {
  email?: string;
  password?: string;
};

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, "Login", "ForgotPassword">;





const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<ErrorProps>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { login } = useAuth();

  // Modal states
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorType, setErrorType] = useState<string>("");

  const handleSubmit = async () => {
    try {
      if (!email.trim()) return setErrors({ email: "Email is required" });
      if (!password.trim()) return setErrors({ password: "Password is required" });

      setErrors({});
      setIsLoading(true);

      const validatedData = loginSchema.parse({ email, password });

      const res = await fetch(`${API_URL}/api/loginRider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific error types from backend
        if (data.from === "email") {
          setErrors({ email: data.message });
        } else if (data.from === "password") {
          setErrors({ password: data.message });
        } else if (data.from === "verification") {
          // Show verification error modal
          setErrorMessage(data.message);
          setErrorType(data.verificationStatus || "verification");
          setShowErrorModal(true);
        } else {
          // General error modal
          setErrorMessage(data.message || "Unknown error occurred");
          setErrorType("general");
          setShowErrorModal(true);
        }
        return;
      }

    // Direct navigate on success
    if (data.accessToken) {
      await login(data.accessToken);
      navigation.navigate("TabScreen");
    }

    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const formattedErrors: any = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0]] = err.message;
          }
        });
        setErrors(formattedErrors);
      } else {
        console.log("Unexpected Error: ", error);
        setErrorMessage("Something went wrong. Please try again.");
        setErrorType("general");
        setShowErrorModal(true);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const getErrorIcon = () => {
    if (errorType === "pending") {
      return <Ionicons name="time-outline" size={70} color="#f59e0b" />;
    } else if (errorType === "rejected") {
      return <Ionicons name="close-circle" size={70} color="#ef4444" />;
    }
    return <Ionicons name="alert-circle" size={70} color="#ef4444" />;
  };

  const getErrorIconBg = () => {
    if (errorType === "pending") {
      return "bg-amber-100";
    } else if (errorType === "rejected") {
      return "bg-red-100";
    }
    return "bg-red-100";
  };

  

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1}}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentInsetAdjustmentBehavior="automatic"
          >
            <View className="flex-1 px-6 justify-center">
              {/* Header Section */}
              <View className="flex-column items-center gap-1 mb-8 rounded-3xl ">
                <Image 
                source={require("../assets/efarmerslogo.png")}
                className="w-20 h-20 bg-red"/>

                <Text className="font-bold text-2xl text-primary text-center ">
                  E-Farmers Hub
                </Text>
                <Text className="text-lg font-bold text-gray-600 capitalize w-full text-center ">
                  rider login
                </Text>
                {/* <Text>
                  {API_URL}
                </Text> */}
              </View>
             

              {/* Login Form */}
              <View className="bg-white rounded-3xl p-6 shadow-sm">
                {/* Email Input */}
                <View className="mb-4">
                  <Text className="text-gray-700 font-medium mb-2 ml-1">
                    Email Address
                  </Text>
                  <View
                    className={`flex-row items-center bg-gray-50 rounded-xl px-4 border ${
                      errors.email ? "border-red-500" : "border-gray-200"
                    }`}
                  >
                    <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor="#9ca3af"
                      className="flex-1 py-4 px-3 text-gray-900"
                      value={email}
                      autoCapitalize="none"
                      autoComplete="off"
                      keyboardType="email-address"
                      returnKeyType="next"
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email)
                          setErrors({ ...errors, email: undefined });
                      }}
                    />
                  </View>
                  {errors.email && (
                    <View className="flex-row items-center mt-2 ml-1">
                      <Ionicons name="alert-circle" size={16} color="#ef4444" />
                      <Text className="text-red-500 ml-1 text-sm">
                        {errors.email}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Password Input */}
                <View className="mb-6">
                  <Text className="text-gray-700 font-medium mb-2 ml-1">
                    Password
                  </Text>
                  <View
                    className={`flex-row items-center bg-gray-50 rounded-xl px-4 border ${
                      errors.password ? "border-red-500" : "border-gray-200"
                    }`}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#9ca3af"
                    />
                    <TextInput
                      placeholder="Enter your password"
                      placeholderTextColor="#9ca3af"
                      className="flex-1 py-4 px-3 text-gray-900"
                      secureTextEntry={!showPassword}
                      value={password}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password)
                          setErrors({ ...errors, password: undefined });
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={
                          showPassword ? "eye-outline" : "eye-off-outline"
                        }
                        size={20}
                        color="#9ca3af"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <View className="flex-row items-center mt-2 ml-1">
                      <Ionicons name="alert-circle" size={16} color="#ef4444" />
                      <Text className="text-red-500 ml-1 text-sm">
                        {errors.password}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Forgot Password */}
                <TouchableOpacity 
                  className="mb-6"
                  onPress={() => { navigation.navigate("ForgotPassword")}}
                >
                  <Text className="text-green-600 font-medium text-left">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                className={`rounded-xl py-4 flex-row items-center justify-center ${
                  isLoading ? "bg-gray-400" : "bg-black"
                }`}
                onPress={handleSubmit}
                disabled={isLoading}
                >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-bold text-base ml-2">
                      Logging in...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="white" />
                    <Text className="text-white font-bold text-base ml-2">
                      Login
                    </Text>
                  </>
                )}
                </TouchableOpacity>

              </View>

              {/* Footer */}
              <View className="mt-8 items-center">
                <View className="flex-row items-center">
                  <Ionicons name="shield-checkmark" size={16} color="#9ca3af" />
                  <Text className="text-gray-500 ml-2">Secure Login</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      


      {/* Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showErrorModal}
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-3xl p-10 w-full items-center shadow-lg">
            <View className={`w-28 h-28 ${getErrorIconBg()} rounded-full items-center justify-center mb-6`}>
              {getErrorIcon()}
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-3">
              {errorType === "pending" ? "Pending Verification" : 
               errorType === "rejected" ? "Verification Rejected" : "Oops!"}
            </Text>
            <Text className="text-gray-600 text-center text-lg mb-8 px-2">
              {errorMessage}
            </Text>
            <TouchableOpacity
              className="bg-black rounded-xl py-4 px-12 w-full"
              onPress={() => setShowErrorModal(false)}
            >
              <Text className="text-white font-bold text-center text-lg">
                {errorType === "pending" || errorType === "rejected" ? "Got It" : "Try Again"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};




export default LoginScreen;