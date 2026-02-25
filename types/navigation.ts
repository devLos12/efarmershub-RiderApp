
export type RootStackParamList = {
    QrPayment: undefined;
    ForgotPassword: undefined;
    Login: undefined;
    TabScreen: undefined;
    OrderView: {
        id: string;
        orderId: string;
        userId: string;
        firstname: string;
        lastname: string;
        email: string;
        address: string;
        contact: string;
        statusDelivery: string;
        statusHistory: {
            _id: string;
            status: string;
            description: string;
            location: string;
            date: string;
            timestamp: string;
            imageFile: string;
        }[];
        orderItems:{
            imageFile: string;
            prodName: string;
            prodPrice: number;
            prodDisc: string;
            quantity: number;
        }[];
        totalPrice: number;
        paymentStatus: string;
    };
    TrackLocation: undefined;
    Camera: {
        orderId?: string
    };
    TrackOrder: {
        orderId: string;
    };
    EditProfile: undefined;
    
    Messages: {
        source: string;
        chatId: string;
        senderId: string;
        credentials: {
            id: string;
            name: string;
            email: string;
            role: string;
        }
    };

};



export type RootTabParamList = {
    Home: undefined;
    Dashboard: undefined;
    Profile: undefined;
    Inbox: undefined;
    Payouts: undefined;
}


