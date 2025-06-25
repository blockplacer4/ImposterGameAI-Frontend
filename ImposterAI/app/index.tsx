import { SafeAreaView, Text, View, StyleSheet, StatusBar, TouchableOpacity } from "react-native";
import { Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';

export default function Index() {
  const [difficulty, setDifficulty] = useState('Easy');
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(true);

  if (!permission) {
    // Kamera-Berechtigungen werden geladen
    return <View />;
  }

  if (!permission.granted) {
    // Keine Berechtigung erteilt
    requestPermission();
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.topBar}>
          <Image source={require('../assets/images/react-logo.png')} style={styles.logo} />
          <Text style={styles.title}>ImposterAI</Text>
          <Feather name="settings" size={24} color="white"/>
        </View>
        <View style={styles.cameraContainer}>
          <Text style={styles.permissionText}>Kamera-Berechtigung wird angefordert...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBar}>
        <Image source={require('../assets/images/react-logo.png')} style={styles.logo} />
        <Text style={styles.title}>ImposterAI</Text>
        <Feather name="settings" size={24} color="white"/>
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>AI Difficulty</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.button} onPress={() => setDifficulty("Easy") }>
              <Text style={styles.buttonText}>Easy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setDifficulty("Medium")}>
              <Text style={styles.buttonText}>Medium</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setDifficulty("Hard")}>
              <Text style={styles.buttonText}>Hard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showCamera && (
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} facing="front" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  topBar: {
    height: 170,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  logo: {
    width: 40,
    height: 40,
  },
  title: {
    color: 'white',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 20,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  permissionText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  },
  contentWrapper: {
    paddingHorizontal: 20,
  },
  settingsCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20, // 20
    padding: 20, // 20
    minHeight: 100, // 100+
    
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 15, // 10
    textAlign: 'center',
  },
  buttonGroup: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    //height: 50,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    //borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});