import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useState, useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Chat() {
  const { lobby_id, name, secret_word, role } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [word, setWord] = useState("");
  const [secretWord, setSecretWord] = useState("");
  const [isSecretWordModalVisible, setSecretWordModalVisible] = useState(false);
  const [debugMode, setDebugMode] = useState(true);
  const ws = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (role === "crewmate" && secret_word && typeof secret_word === "string" && secret_word !== "") {
      setSecretWord(secret_word);
      setSecretWordModalVisible(true);
    }
  }, [secret_word, role]);

  useEffect(() => {
    const getApiUrl = async () => {
      const apiUrl = await AsyncStorage.getItem("apiUrl");
      if (!apiUrl) {
        router.replace("/");
        return;
      }

      if (!lobby_id || !name) {
        console.log(
          "[ChatScreen] Missing lobby_id or name, redirecting to login."
        );
        router.replace("/");
        return;
      }

      const wsUrl = `ws://${apiUrl}/ws/${lobby_id}/${name}`;
      console.log(`[ChatScreen] Connecting to WebSocket at ${wsUrl}`);
      ws.current = new WebSocket(wsUrl);
      ws.current.onopen = () => {
        console.log("[ChatScreen] WebSocket connected successfully.");
        ws.current.send(JSON.stringify({ command: "start_game" }));
        console.log("[ChatScreen] Sent 'start_game' command.");
      };

      ws.current.onmessage = (e) => {
        console.log(`[ChatScreen] Received message: ${e.data}`);
        try {
          const message = JSON.parse(e.data);
          setMessages((prevMessages) => [...prevMessages, message]);
        } catch (error) {
          console.error("[ChatScreen] Error parsing message JSON:", error);
        }
      };

      ws.current.onerror = (e) => {
        console.error("[ChatScreen] WebSocket error:", e.message);
        Alert.alert("WebSocket Error", `Connection failed: ${e.message}`);
        router.replace("/");
      };

      ws.current.onclose = (e) => {
        console.log(
          `[ChatScreen] WebSocket disconnected. Code: ${e.code}, Reason: ${e.reason}`
        );
      };
    };

    getApiUrl();

    return () => {
      if (ws.current) {
        console.log("[ChatScreen] Closing WebSocket connection.");
        ws.current.close();
      }
    };
  }, [lobby_id, name]);

  const submitWord = () => {
    if (word.trim() && ws.current?.readyState === WebSocket.OPEN) {
      const command = { command: "submit_word", word: word };
      console.log(`[ChatScreen] Sending command: ${JSON.stringify(command)}`);
      ws.current.send(JSON.stringify(command));
      setWord("");
    } else {
      console.log(
        "[ChatScreen] Cannot send word. WebSocket not open or word is empty."
      );
      Alert.alert("Error", "Cannot send word. Connection may be closed.");
    }
  };

  const renderMessage = (msg, index) => {
    if (debugMode) {
      return (
        <View key={index} style={styles.messageBubble}>
          <Text style={styles.messageText}>
            {JSON.stringify(msg, null, 2)}
          </Text>
        </View>
      );
    }

    if (msg.event) {
      let systemText = null;
      switch (msg.event) {
        case "user_left":
          systemText = `${msg.user_name} has left the game.`;
          break;
        case "initializing_players":
          systemText = "Initializing players...";
          break;
        case "game_started":
          systemText = "The game has started!";
          break;
        case "human_turn_prompt":
          systemText =
            msg.player_name === name
              ? "It's your turn to say a word."
              : `It's ${msg.player_name}'s turn.`;
          break;
        case "ai_thinking":
          systemText = "AI is thinking...";
          break;
        case "turn_result":
          const { player_name, turn_data } = msg.data;
          const isUser = player_name === name;
          return (
            <View
              key={index}
              style={[
                styles.messageBubble,
                isUser ? styles.userMessage : styles.otherMessage,
              ]}
            >
              <Text style={styles.senderText}>{player_name}</Text>
              <Text style={styles.messageText}>{turn_data.word_said}</Text>
              {turn_data.response_text && (
                <Text style={styles.aiReasoningText}>
                  {turn_data.response_text}
                </Text>
              )}
            </View>
          );
        default:
          return null;
      }

      if (systemText) {
        return (
          <View key={index} style={styles.systemMessageContainer}>
            <Text style={styles.systemMessageText}>{systemText}</Text>
          </View>
        );
      }
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBar}>
        <Text style={styles.title}>Game Chat</Text>
        <TouchableOpacity onPress={() => setDebugMode(!debugMode)}>
          <Feather
            name={debugMode ? "eye-off" : "eye"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.chatContainer}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter your word"
          placeholderTextColor="#888"
          value={word}
          onChangeText={setWord}
        />
        <TouchableOpacity style={styles.sendButton} onPress={submitWord}>
          <Feather name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSecretWordModalVisible}
        onRequestClose={() => {
          setSecretWordModalVisible(!isSecretWordModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Your secret word is:</Text>
            <Text style={styles.secretWordText}>{secretWord}</Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => setSecretWordModalVisible(false)}
            >
              <Text style={styles.textStyle}>Hide Word</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  topBar: {
    height: 100,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  title: {
    color: "white",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messageBubble: {
    backgroundColor: "#2A2A2A",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#FF4500",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#2A2A2A",
  },
  senderText: {
    color: "#B0B0B0",
    fontSize: 12,
    marginBottom: 4,
    fontWeight: "bold",
  },
  messageText: {
    color: "white",
    fontSize: 16,
  },
  aiReasoningText: {
    color: "#D3D3D3",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 5,
  },
  systemMessageContainer: {
    alignSelf: "center",
    marginVertical: 10,
    padding: 8,
    borderRadius: 5,
    backgroundColor: "#1A1A1A",
  },
  systemMessageText: {
    color: "#A0A0A0",
    fontSize: 12,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  input: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    color: "white",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#FF4500",
    borderRadius: 10,
    padding: 15,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "#2A2A2A",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#FF4500",
  },
  button: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: "#FF4500",
    marginTop: 15,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    color: "white",
    fontSize: 18,
  },
  secretWordText: {
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 22,
    color: "#FF4500",
  },
});