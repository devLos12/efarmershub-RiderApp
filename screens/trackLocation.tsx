import React, { useEffect, useState, useRef } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import * as Location from "expo-location";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { WebView } from "react-native-webview";
import MapView, { Marker } from "react-native-maps";



type TrackLocationProp = NativeStackScreenProps<RootStackParamList, "TrackLocation" >;




const TrackLocation: React.FC<TrackLocationProp> = ({ navigation }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  
  
  useEffect(() => {
    let subscriber: Location.LocationSubscription;

    const getPermission = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        return;
      }

      subscriber = await Location.watchPositionAsync({
          accuracy: Location.Accuracy.Highest,
          timeInterval: 1000,
          distanceInterval: 1
        },(loc) => {
          setLocation(loc);
        }
      );
    };

    getPermission();

    return () => {
      if (subscriber) subscriber.remove();
    };
  }, []);


  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: "Track Location",
    });
  }, [navigation]);
  

  return (
    <View className="flex-1">

      <View className="flex-2 items-start absolute top-0 right-0">
        <View className="p-5 bg-white m-5 rounded-lg shadow">
        <Text>Latitude: {location?.coords.latitude}</Text>
        <Text>Longitude: {location?.coords.longitude}</Text>
        <Text>Accuracy: {location?.coords.accuracy}</Text>
        </View>
      </View>
    </View>
  );
};

export default TrackLocation;
