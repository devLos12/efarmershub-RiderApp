import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Keyboard, 
  TouchableWithoutFeedback 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../types/navigation";
import { API_URL } from "@env";


type ForgotPasswordScreenProps = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;



const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState({
    forgot: false,
    verify: false,
    changePass: false
  });
  const [message, setMessage] = useState({
    success: "",
    error: ""
  });
  const [verifyMessage, setVerifyMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [changepassSuccess, setChangePassSuccess] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (verified) return;

    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    } else if (cooldown === 0 && sent) {
      setSent(false);
      setVerifyCode("");
      setVerifyMessage("");
    }

    return () => clearTimeout(timer);
  }, [cooldown, sent, verified]);

  const handleRequestCode = async () => {
    if (!email) {
      setMessage({ success: "", error: "Please enter your email address" });
      return;
    }

    setIsLoading({ ...isLoading, forgot: true, verify: false });
    setMessage({ success: "", error: "" });
    setChangePassSuccess("");

    try {
      const response = await fetch(`${API_URL}/api/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setTimeout(() => {
        setMessage({
          success: data.message,
          error: ""
        });
        setIsLoading({ ...isLoading, forgot: false, verify: false });
        setSent(true);

        const now = Date.now();
        const remainingTime = Math.max(Math.floor((data.cooldown - now) / 1000), 0);
        setCooldown(remainingTime);
      }, 1500);

    } catch (error: any) {
      setTimeout(() => {
        setMessage({
          success: "",
          error: `Error: ${error.message}`
        });
        setChangePassSuccess("");
        setIsLoading({ ...isLoading, forgot: false, verify: false });
        setSent(false);
      }, 1500);
    }
  };

  const handleResetPassword = async () => {
    if (!email || !verifyCode) {
      setVerifyMessage("Please enter both email and verification code");
      return;
    }

    setIsLoading({ ...isLoading, verify: true, forgot: false });
    setVerifyMessage("");

    try {
      const res = await fetch(`${API_URL}/api/verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, verifyCode })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setTimeout(() => {
        setVerified(true);
        setMessage({ success: "", error: "" });
        setVerifyMessage(`${data.message} change your password now.`);
        setIsLoading({ ...isLoading, verify: false, forgot: false });
      }, 1500);

    } catch (error: any) {
      setTimeout(() => {
        setVerifyMessage(error.message);
        setIsLoading({ ...isLoading, verify: false, forgot: false });
      }, 1500);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError({ newPassword: '', confirmPassword: '' });

    if (!newPassword) {
      setPasswordError(prev => ({ ...prev, newPassword: 'New password is required' }));
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(prev => ({ ...prev, newPassword: 'Password must be at least 6 characters' }));
      return;
    }

    if (!confirmPassword) {
      setPasswordError(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    setIsLoading({ ...isLoading, changePass: true });

    try {
      const res = await fetch(`${API_URL}/api/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, newPassword, confirmPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setTimeout(() => {
        setVerified(false);
        setVerifyMessage("");
        setIsLoading({ ...isLoading, changePass: false });
        setCooldown(0);
        setMessage({ success: "", error: "" });
        setEmail("");
        setVerifyCode("");
        setNewPassword("");
        setConfirmPassword("");
        setChangePassSuccess(`${data.message} sign in your account.`);
      }, 1500);

    } catch (error: any) {
      setTimeout(() => {
        setVerifyMessage("");
        setIsLoading({ ...isLoading, changePass: false });
        setNewPassword("");
        setConfirmPassword("");
        setChangePassSuccess(`${error.message}. pls try again.`);
      }, 1500);
      console.log("Error: ", error.message);
    }
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
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="mb-4">
              <Text className="text-2xl font-bold text-green-600 capitalize">
                Forgot Password?
              </Text>
              <Text className="text-sm text-gray-600 capitalize mt-1">
                No worries, we'll send you reset instructions.
              </Text>
              <TouchableOpacity className="mt-2" onPress={() => navigation.goBack()}>
                <Text className="text-green-600 text-sm capitalize">
                  back to sign in
                </Text>
              </TouchableOpacity>
            </View>

            {/* Success Message with Cooldown */}
            {message.success && (
              <View className={`p-3 rounded-lg mb-3 ${cooldown > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {cooldown > 0 ? (
                  <>
                    <Text className="text-green-700 text-sm">{message.success}</Text>
                    <Text className="text-green-700 font-bold text-sm mt-1 capitalize">
                      Expiration left: {cooldown}
                    </Text>
                  </>
                ) : (
                  <Text className="text-red-600 font-bold text-sm capitalize">
                    Verification code expired! request again.
                  </Text>
                )}
              </View>
            )}

            {/* Error Message */}
            {message.error && (
              <View className="bg-red-100 p-3 rounded-lg mb-3">
                <Text className="text-red-600 font-bold text-sm capitalize">
                  {message.error}
                </Text>
              </View>
            )}

            {/* Verify Message */}
            {verifyMessage && (
              <View className={`p-3 rounded-lg mb-3 ${verifyMessage.includes("Verified") ? 'bg-green-100' : 'bg-red-100'}`}>
                <Text className={`font-bold text-sm capitalize ${verifyMessage.includes("Verified") ? 'text-green-700' : 'text-red-600'}`}>
                  {verifyMessage}
                </Text>
              </View>
            )}

            {/* Change Password Success */}
            {changepassSuccess && (
              <View className={`p-3 rounded-lg mb-3 ${changepassSuccess.includes("changed") ? 'bg-green-100' : 'bg-red-100'}`}>
                <Text className={`font-bold text-sm capitalize ${changepassSuccess.includes("changed") ? 'text-green-700' : 'text-red-600'}`}>
                  {changepassSuccess}
                </Text>
              </View>
            )}

            <View className="gap-y-4">
              {/* Email Input */}
              <View>
                <View className="flex-row items-center gap-x-2 mb-2">
                  <Ionicons name="mail-outline" size={16} color="#6b7280" />
                  <Text className="text-sm font-bold capitalize">email address:</Text>
                </View>
                <View className="flex-row gap-x-2">
                  <TextInput
                    className={`flex-1 px-3 py-3 rounded-lg border text-sm ${sent ? 'bg-gray-200' : 'bg-yellow-50'}`}
                    placeholder="Type Email"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    editable={!isLoading.forgot && !sent}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    className={`px-4 py-3 rounded-lg justify-center ${sent || isLoading.forgot ? 'bg-green-400' : 'bg-green-600'}`}
                    style={{ width: 100 }}
                    disabled={isLoading.forgot || sent}
                    onPress={handleRequestCode}
                  >
                    <Text className="text-white text-sm font-medium text-center capitalize">
                      {isLoading.forgot ? "Sending.." : sent ? "Sent" : "request"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-xs text-gray-500 capitalize mt-1">
                  *your gmail account.
                </Text>
              </View>

              {/* Verify Code */}
              {!verified && (
                <View>
                  <View className="flex-row items-center gap-x-2 mb-2">
                    <Ionicons name="shield-checkmark-outline" size={16} color="#6b7280" />
                    <Text className="text-sm font-bold capitalize">verify code:</Text>
                  </View>
                  <View className="gap-y-2">
                    <TextInput
                      className={`px-3 py-3 rounded-lg border text-sm ${!sent ? 'bg-gray-100' : 'bg-white'} ${verifyMessage.includes("Invalid") && 'border-red-500'}`}
                      placeholder="Type Verification Code"
                      placeholderTextColor="#9ca3af"
                      value={verifyCode}
                      onChangeText={setVerifyCode}
                      editable={!!email && sent}
                    />
                    {cooldown > 0 && verifyMessage && (
                      <Text className={`text-sm capitalize ${verifyMessage.includes("Verified") ? 'text-green-600' : 'text-red-600'}`}>
                        {verifyMessage}
                      </Text>
                    )}
                    <TouchableOpacity
                      className={`bg-gray-900 py-3 rounded-lg ${!email || !sent || isLoading.verify || verifyMessage.includes("Verified") ? 'opacity-50' : 'opacity-100'}`}
                      disabled={!email || !sent || isLoading.verify}
                      onPress={handleResetPassword}
                    >
                      <Text className="text-white text-sm text-center capitalize">
                        {isLoading.verify ? "sending.." : verifyMessage.includes("Verified") ? verifyMessage : "verify code"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Change Password Form */}
              {verified && (
                <>
                  {/* New Password */}
                  <View>
                    <View className="flex-row items-center gap-x-2 mb-2">
                      <Ionicons name="lock-closed-outline" size={16} color="#6b7280" />
                      <Text className="text-sm font-bold capitalize">new password:</Text>
                    </View>
                    <TextInput
                      className={`px-3 py-3 rounded-lg border text-sm bg-white ${passwordError.newPassword ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Type New Password"
                      placeholderTextColor="#9ca3af"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                    />
                    {passwordError.newPassword && (
                      <Text className="text-red-600 text-sm capitalize mt-1">
                        {passwordError.newPassword}
                      </Text>
                    )}
                  </View>

                  {/* Confirm Password */}
                  <View>
                    <View className="flex-row items-center gap-x-2 mb-2">
                      <Ionicons name="lock-closed-outline" size={16} color="#6b7280" />
                      <Text className="text-sm font-bold capitalize">confirm password:</Text>
                    </View>
                    <TextInput
                      className={`px-3 py-3 rounded-lg border text-sm bg-white ${passwordError.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Type Confirm Password"
                      placeholderTextColor="#9ca3af"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                    />
                    {passwordError.confirmPassword && (
                      <Text className="text-red-600 text-sm capitalize mt-1">
                        {passwordError.confirmPassword}
                      </Text>
                    )}
                    <TouchableOpacity
                      className={`bg-gray-900 py-3 rounded-lg mt-2 ${isLoading.changePass ? 'opacity-50' : 'opacity-100'}`}
                      disabled={isLoading.changePass}
                      onPress={handleChangePassword}
                    >
                      <Text className="text-white text-sm text-center capitalize">
                        {isLoading.changePass ? "sending.." : "change password"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;