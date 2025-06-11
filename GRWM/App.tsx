import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import ProfileScreen from './screens/ProfileScreen';
import ClothesScreen from './screens/ClothesScreen';
import OutfitResultScreen from './screens/OutfitResultScreen';
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import * as eva from '@eva-design/eva';
import { ApplicationProvider,
     BottomNavigation, 
     BottomNavigationTab, 
     TopNavigation, 
     TopNavigationAction,
    Icon,
    IconElement } from '@ui-kitten/components';


const { Navigator, Screen } = createBottomTabNavigator();

const BackIcon = () => (
    <Ionicons name="arrow-back" size={24} color="#000" />
);

const TopBar = ({ navigation, route }: { navigation: any, route: any }) => {
    const navigateBack = () => {
        navigation.goBack();
    };

    const BackAction = () => (
        <TopNavigationAction icon={BackIcon} onPress={navigateBack} />
    );

    const isTabScreen = ['Início', 'Nova peça', 'Perfil'].includes(route.name);

    return (
        <SafeAreaView>
            <TopNavigation
                title={isTabScreen ? 'GRWM' : ''}
                accessoryLeft={!isTabScreen ? BackAction : undefined}
                style={styles.header}
            />
        </SafeAreaView>
    );
};

const BottomTabBar = ({ navigation, state }: { navigation: any, state: any }) => (
    <BottomNavigation
        selectedIndex={state.index}
        onSelect={index => navigation.navigate(state.routeNames[index])}>
        <BottomNavigationTab title='Início' />
        <BottomNavigationTab title='Nova peça' />
        <BottomNavigationTab title='Perfil' />
    </BottomNavigation>
);

const TabNavigator = () => (
    <Navigator
        screenOptions={{
            header: (props) => <TopBar {...props} />,
        }}
        tabBar={props => <BottomTabBar {...props} />}
    >
        <Screen name='Início' component={HomeScreen}/>
        <Screen name='Camera' component={CameraScreen}/>
        <Screen name='Perfil' component={ProfileScreen}/>
        <Screen 
            name='Clothes' 
            component={ClothesScreen} 
            options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}
        />
    </Navigator>
);

export default function App() {
    return (
        <SafeAreaProvider>
            <ApplicationProvider {...eva} theme={eva.light}>
                <NavigationContainer>
                    <TabNavigator />
                </NavigationContainer>
            </ApplicationProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#FFB6C1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        justifyContent: 'center'
    },
    icon: {
    width: 32,
    height: 32,
    },
});
