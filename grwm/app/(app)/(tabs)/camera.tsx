import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Image, Text } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [type, setType] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const toggleFacing = () => {
    setType(prev => (prev === 'back' ? 'front' : 'back'));
  };

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.5,
        });

        if (photo.base64) {
          const base64Image = `data:image/jpeg;base64,${photo.base64}`;
          setUri(base64Image);
        }
      } catch (error) {
        console.error('Erro ao tirar foto:', error);
      }
    }
  };

  const handleUsePicture = () => {
    if (uri) {
      router.push({
        pathname: '/new_clothes',
        params: { photoUri: uri },
      });
    }
  };

  if (permission?.granted === false) return <Text>Sem acesso à câmera</Text>;

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        facing={type}
        responsiveOrientationWhenOrientationLocked
      >
        <View style={styles.shutterContainer}>
          {uri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri }} style={styles.previewImage} />
              <View style={styles.previewButtons}>
                <Button mode="outlined" onPress={() => setUri(null)}>Tirar outra</Button>
                <Button mode="contained" onPress={handleUsePicture}>Usar foto</Button>
              </View>
            </View>
          ) : (
            <>
              <Pressable onPress={handleTakePicture} style={styles.shutterBtn}>
                <View style={styles.shutterBtnInner} />
              </Pressable>
              <Pressable onPress={toggleFacing} style={styles.flipButton}>
                <Ionicons name="camera-reverse" size={32} color="white" />
              </Pressable>
            </>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  shutterContainer: {
    position: 'absolute',
    bottom: 44,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  shutterBtn: {
    backgroundColor: 'transparent',
    borderWidth: 5,
    borderColor: 'white',
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 12,
  },
  previewImage: {
    width: 300,
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 12,
  },
});
