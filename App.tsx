import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types/navigation';
import LoginScreen from './screens/loginScreen';
import TabScreen from './screens/TabScreen';
import { AuthContextProvider } from './context/authContext';
import { useAuth } from './context/useAuth';
import OrderView from './screens/orderView';
import "./styles/global.css";
import TrackLocation from './screens/trackLocation';
import CameraCapture from './screens/cameraCapture';
import TrackOrder from './screens/trackOrder';
import UpdateProfile from './screens/updateProfile';
import Messages from './screens/messages';
import { API_URL } from '@env';
import { useEffect, useRef, useState } from 'react';
import ForgotPassword from './screens/forgotpassword';
import QrPayment from './screens/qrpayment';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from './utils/notifications';




const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { token, loading, user } = useAuth(); // make sure user has id or _id
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);


  useEffect(() => {
    // Only register when rider is logged in
    if (!token || !user) return;

    // Register and save token to backend
    registerForPushNotificationsAsync()
      .then(async (pushToken) => {
        if (!pushToken) return;
        setExpoPushToken(pushToken);
        
        try {
          const response = await fetch(`${API_URL}/api/save-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`, // idagdag ito
            },
            body: JSON.stringify({
              riderId: user._id, // change to user._id if needed
              token: pushToken,
            }),
          });
          const data = await response.json();
        } catch (error) {
          console.error('Failed to save push token:', error);
        }
      })
      .catch((error: any) => setExpoPushToken(`${error}`));

    // Fires when notification is received while app is open (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Fires when rider taps the notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
      // You can navigate here, e.g:
      // navigationRef.current?.navigate('OrderView', { orderId: data.orderId });
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [token, user?._id]);


  
  if (loading) return null;

  return (
    <Stack.Navigator
      initialRouteName={token ? 'TabScreen' : 'Login'}
      screenOptions={{ animation: 'slide_from_right' }}
    >
      <Stack.Screen name='TabScreen' component={TabScreen} options={{ headerShown: false }} />
      <Stack.Screen name='Login' component={LoginScreen} options={{ headerShown: false, animation: 'slide_from_left' }} />
      <Stack.Screen name='OrderView' component={OrderView} />
      <Stack.Screen name='TrackLocation' component={TrackLocation} />
      <Stack.Screen name='TrackOrder' component={TrackOrder} />
      <Stack.Screen name='Camera' component={CameraCapture} options={{ headerShown: false }} />
      <Stack.Screen name='EditProfile' component={UpdateProfile} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name='Messages' component={Messages} options={{ title: 'Help & Support' }} />
      <Stack.Screen name='ForgotPassword' component={ForgotPassword} />
      <Stack.Screen name='QrPayment' component={QrPayment} />
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <AuthContextProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthContextProvider>
  );
};

export default App;