import React from "react";
import { SafeAreaView} from "react-native-safe-area-context";
import { Text, View, TouchableOpacity} from "react-native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { RootTabParamList } from "../types/navigation";


type DashBoardScreenProps = BottomTabScreenProps<RootTabParamList, "Dashboard">;

const DashBoardScreen: React.FC<DashBoardScreenProps> = ({ navigation, route }) => {
    return (
        <Text>Dashboard screen</Text>
    )
}



export  default DashBoardScreen;



