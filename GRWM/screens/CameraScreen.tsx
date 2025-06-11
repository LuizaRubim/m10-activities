import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import {
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import type { ComponentProps } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../src/types/navigation';
import { Button } from '@ui-kitten/components';
import { Ionicons } from '@expo/vector-icons';

type CameraScreenNavigationProp = NavigationProp<RootStackParamList, 'Camera'>;

const CameraScreen: React.FC = () => {
const [permission, requestPermission] = useCameraPermissions();
const [type, setType] = useState<CameraType>('back');
const cameraRef = useRef<CameraView>(null);
const navigation = useNavigation<CameraScreenNavigationProp>();
const [uri, setUri] = useState<string | null>(null);


useEffect(() => {
    if (!permission) {
        requestPermission();
    }
}, [permission]);

const hasPermission = permission && permission.granted;
const toggleFacing = () => {
    setType((prev) => (prev === "back" ? "front" : "back"));
  };

const handleSavePicture = () => {
    if (uri) {
      console.log('Foto salva:', uri);
      navigation.navigate('Camera');
    }
};

const renderPicture = () => {
    return (
      <View style={styles.previewContainer}>
        {uri && (
          <Image
            source={{ uri }}
            resizeMode="contain"
            style={styles.previewImage}
          />
        )}
        <View style={styles.previewButtons}>
          <Button 
            appearance="ghost" 
            status="basic" 
            onPress={() => setUri(null)}
            style={styles.previewButton}
          >
            Tirar outra foto
          </Button>
          <Button 
            onPress={handleSavePicture}
            style={styles.previewButton}
          >
            Salvar foto
          </Button>
        </View>
      </View>
    );
  };

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setUri(photo?.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        facing={type}
        mute={false}
        responsiveOrientationWhenOrientationLocked
      >
        <View style={styles.shutterContainer}>
          <View style={styles.emptySpace} />
          {uri ? (
            renderPicture()
          ) : (
            <Pressable onPress={handleTakePicture} style={styles.shutterBtn}>
              <View style={styles.shutterBtnInner} />
            </Pressable>
          )}
          <Pressable onPress={toggleFacing} style={styles.flipButton}>
            <Ionicons name="camera-reverse" size={32} color="white" />
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
    width: '100%'
  },
  shutterContainer: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  emptySpace: {
    width: 32,
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: 'white',
  },
  flipButton: {
    width: 32,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: 300,
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  previewButton: {
    minWidth: 120,
  }
});

export default CameraScreen;
