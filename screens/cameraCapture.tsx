import { CameraView, CameraType, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { useActionState, useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/useAuth';



type CameraCaptureProp = NativeStackScreenProps<RootStackParamList, "Camera">;



const CameraCapture: React.FC<CameraCaptureProp> = ({ navigation, route }) => {
  const { orderId } = route.params;
  const { setOrders } = useAuth();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturePhoto, setCapturePhoto] = useState<string>("");
  const cameraRef = useRef<CameraView | null>(null);

  

  
  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }



  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <SafeAreaView className='flex-1 justify-center items-center'>
        <Text className='text-center text-lg mb-4'>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </SafeAreaView>

    );
  }

    

  const toggleCameraFacing = ()=> {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const takePicture = async() => {
    try {

      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        setCapturePhoto(photo.uri);
      } 
      
    } catch (error) {
      console.log(error);
    }

    }


  return (
    <SafeAreaView  className='flex-1 justify-center'>
        <View className='flex-1'>
          {capturePhoto ? (
             <Image 
              source={{uri : capturePhoto}}
              style={{
                flex:1,
                height: "100%",
                width: "100%",
                transform: facing === 'front' ? [{scaleX: -1}] : []
              }}
              resizeMode={"cover"} />
          ) : (
            <CameraView style={{flex: 1}} facing={facing} ref={cameraRef}/>
          )}

          <SafeAreaView className='bg-white flex-row items-center' 
          edges={["left", "right", "bottom", "top"]}>
           
              <View className='flex-1 items-center '>
                <TouchableOpacity className='p-4 bg-gray-100 rounded-full'  
                onPress={()=>{
                  navigation.goBack();
                }}>
                    <Ionicons name="arrow-back" size={32} color={"black"}/>
                </TouchableOpacity>
              </View>

              <View className='flex-1 items-center '>
                <TouchableOpacity className='p-5 bg-black rounded-full border-white border' 
                onPress={()=> {
                  capturePhoto ? setCapturePhoto("") 
                  : takePicture()
                  }}>
                  {capturePhoto ? (
                    <Ionicons name="close" size={32} color={"white"}/>
                  ) : (
                    <Ionicons name="camera" size={32} color={"white"}/>
                  )}
                </TouchableOpacity>
              </View>

              <View className='flex-1 items-center '>
                <TouchableOpacity className='p-4 bg-gray-100 rounded-full'  
                onPress={()=>{
                  if(capturePhoto) {
                    
                    setOrders((orders) => 
                      orders.filter((order) => order._id === orderId 
                      ? order.imageFile = capturePhoto
                      : order)
                    )

                    navigation.goBack();
                  } else {
                    toggleCameraFacing();
                  }
                }}>
                  {capturePhoto ? (
                    <Ionicons name="checkmark"  size={32} color={"black"} />
                  ): (
                    <Ionicons name="camera-reverse" size={32} color={"black"} />
                  )}
                </TouchableOpacity>
              </View>
          </SafeAreaView>
        </View>
    </SafeAreaView>
  );
}

export default CameraCapture;


