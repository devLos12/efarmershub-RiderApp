import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types/navigation';
import LoginScreen from './screens/loginScreen';
import TabScreen from './screens/TabScreen';
import { AuthContextProvider } from './context/authContext';
import { useAuth  } from './context/useAuth';
import OrderView from './screens/orderView';
import "./styles/global.css";
import TrackLocation from './screens/trackLocation';
import CameraCapture from './screens/cameraCapture';
import TrackOrder from './screens/trackOrder';
import UpdateProfile from './screens/updateProfile';
import Messages from './screens/messages';
import { Text } from "react-native";
import { API_URL } from '@env';
import { useEffect } from 'react';
import ForgotPassword from './screens/forgotpassword';
import QrPayment from './screens/qrpayment';




const Stack = createNativeStackNavigator<RootStackParamList>();




const RootNavigator: React.FC = () =>{
  const { token, loading } = useAuth();


  if(loading) return

  return (
    <Stack.Navigator initialRouteName={token ? "TabScreen" : "Login"}
    screenOptions={{
      animation: "slide_from_right"
    }}>
        <Stack.Screen 
        name='TabScreen' 
        component={TabScreen}  
        options={{ 
          headerShown: false,
        }} />
        
        <Stack.Screen name='Login'     
        component={LoginScreen}    
        options={{ 
          headerShown: false,
          animation: "slide_from_left"
        }} />
        <Stack.Screen name='OrderView'      component={OrderView} /> 
        <Stack.Screen name='TrackLocation'  component={TrackLocation} /> 
        <Stack.Screen name='TrackOrder'     component={TrackOrder}  />
        <Stack.Screen name='Camera'         component={CameraCapture}
        options={{headerShown: false}}/>
        <Stack.Screen name= 'EditProfile'   component={UpdateProfile}
        options={{title: "Edit Profile"}} />
        <Stack.Screen name='Messages'       component={Messages} 
        options={{title: "Help & Support"}} />
        <Stack.Screen name='ForgotPassword' component={ForgotPassword}/>
        <Stack.Screen name='QrPayment'      component={QrPayment}/>

    </Stack.Navigator>
  )
}





const App = () => {

  return (
    
    <AuthContextProvider>
      <NavigationContainer>
        <RootNavigator/>
      </NavigationContainer>
    </AuthContextProvider>

  );
}


export default App;