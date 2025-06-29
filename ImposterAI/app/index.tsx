import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const [username, setUsername] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [role, setRole] = useState("random");
  const [difficulty, setDifficulty] = useState("easy");
  const [numAgents, setNumAgents] = useState(2);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const storedUsername = await AsyncStorage.getItem("username");
      if (storedUsername) setUsername(storedUsername);
      const storedApiUrl = await AsyncStorage.getItem("apiUrl");
      if (storedApiUrl) setApiUrl(storedApiUrl);
    };
    loadData();
  }, []);

  const handleJoinGame = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Please enter your name.");
      return;
    }
    if (!apiUrl.trim()) {
      Alert.alert("Error", "Please enter the API URL.");
      return;
    }

    await AsyncStorage.setItem("username", username);
    await AsyncStorage.setItem("apiUrl", apiUrl);

    const finalRole =
      role === "random"
        ? Math.random() < 0.5
          ? "crewmate"
          : "imposter"
        : role;

    console.log(
      `[IndexScreen] Creating lobby for user: ${username} with role: ${finalRole}, difficulty: ${difficulty}, num_agents: ${numAgents}`
    );
    try {
      const response = await fetch(`http://${apiUrl}/lobby`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player_name: username,
          player_role: finalRole,
          num_agents: numAgents,
          difficulty: difficulty,
          secret_word: finalRole === "crewmate" ? "apple" : "", // Example secret word
        }),
      });

      console.log(
        `[IndexScreen] Lobby creation response status: ${response.status}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[IndexScreen] Failed to create lobby: ${errorText}`);
        throw new Error("Failed to create lobby.");
      }

      const { lobby_id, secret_word } = await response.json();
      console.log(`[IndexScreen] Lobby created with ID: ${lobby_id}`);

      router.push({
        pathname: "/chat",
        params: { lobby_id, name: username, secret_word, role: finalRole },
      });
    } catch (error) {
      console.error("[IndexScreen] Lobby creation error:", error);
      Alert.alert("Error", "Could not create lobby.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.contentWrapper}>
        <View style={styles.settingsCard}>
          <Text style={styles.title}>ImposterAI</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter API URL (e.g., janoschpc:8080)"
            placeholderTextColor="#888"
            value={apiUrl}
            onChangeText={setApiUrl}
          />
          <Text style={styles.sectionTitle}>Your Role</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.button,
                role === "crewmate" && styles.activeButton,
              ]}
              onPress={() => setRole("crewmate")}
            >
              <Text style={styles.buttonText}>Crewmate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, role === "random" && styles.activeButton]}
              onPress={() => setRole("random")}
            >
              <Text style={styles.buttonText}>Random</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                role === "imposter" && styles.activeButton,
              ]}
              onPress={() => setRole("imposter")}
            >
              <Text style={styles.buttonText}>Imposter</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>AI Difficulty</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.button,
                difficulty === "easy" && styles.activeButton,
              ]}
              onPress={() => setDifficulty("easy")}
            >
              <Text style={styles.buttonText}>Easy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                difficulty === "medium" && styles.activeButton,
              ]}
              onPress={() => setDifficulty("medium")}
            >
              <Text style={styles.buttonText}>Medium</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                difficulty === "hard" && styles.activeButton,
              ]}
              onPress={() => setDifficulty("hard")}
            >
              <Text style={styles.buttonText}>Hard</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>
            Number of Agents: {numAgents}
          </Text>
          <Slider
            style={{ width: "100%", height: 40, marginBottom: 15 }}
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={numAgents}
            onValueChange={setNumAgents}
            minimumTrackTintColor="#FF4500"
            maximumTrackTintColor="#FFFFFF"
            thumbTintColor="#FF4500"
          />

          <TouchableOpacity style={styles.startButton} onPress={handleJoinGame}>
            <Text style={styles.startButtonText}>Join Game</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  title: {
    color: "white",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  contentWrapper: {
    padding: 20,
    justifyContent: "center",
    flex: 1,
  },
  settingsCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 20,
    padding: 20,
  },
  input: {
    backgroundColor: "#1E1E1E",
    color: "white",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 15,
    textAlign: "center",
  },
  buttonGroup: {
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeButton: {
    backgroundColor: "#FF4500",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  startButton: {
    backgroundColor: "#FF4500",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});