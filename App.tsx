import { NavigationContainer, useNavigation } from '@react-navigation/native';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';



const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { token, loading, user } = useAuth(); // make sure user has id or _id
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  


  const handleNotificationNavigation = async (orderId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/getAllDelivery`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const orders = await res.json();
      if (!res.ok) return;

      const order = orders.find((o: any) => o._id === orderId);
      if (!order) return;

      navigation.navigate('OrderView', {
        id: order.orderId,
        orderId: order._id,
        userId: order.userId,
        firstname: order.firstname,
        lastname: order.lastname,
        email: order.email,
        address: order.address,
        contact: order.contact,
        statusDelivery: order.statusDelivery,
        statusHistory: order.statusHistory,
        orderItems: order.orderItems,
        totalPrice: order.totalPrice,
        paymentStatus: order.paymentStatus,
      });
    } catch (error) {
      console.error('Failed to navigate from notification:', error);
    }
  };

  useEffect(() => {
    // ✅ Listeners — mount once agad
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data;
      if (!data?.orderId) return;
      await handleNotificationNavigation(data.orderId as string);
    });

    // ✅ Quit state
    Notifications.getLastNotificationResponseAsync().then(async (response) => {
      if (!response) return;
      const data = response.notification.request.content.data;
      if (!data?.orderId) return;
      await handleNotificationNavigation(data.orderId as string);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [token]); // token dependency para may value tayo pag nag-fetch



  // separate useEffect para sa token registration
  useEffect(() => {
    if (!token || !user) return;

    registerForPushNotificationsAsync()
      .then(async (pushToken) => {
        if (!pushToken) return;
        setExpoPushToken(pushToken);
        try {
          await fetch(`${API_URL}/api/save-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              riderId: user._id,
              token: pushToken,
            }),
          });
        } catch (error) {
          console.error('Failed to save push token:', error);
        }
      });
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
      <NavigationContainer >
        <RootNavigator />
      </NavigationContainer>
    </AuthContextProvider>
  );
};

export default App;