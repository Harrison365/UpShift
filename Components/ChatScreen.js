import React, { useState, useEffect, useRef } from "react";
import {
  TextInput,
  StyleSheet,
  View,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Image,
  StatusBar,
} from "react-native";
import { Button } from "@rneui/base";
import Message from "./Message";
import io from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  query,
  orderBy,
  limit,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import firebase from "../config/firebase";

const socket = io("https://upshift-hr.herokuapp.com/"); //change for each.

const db = firebase.firestore();

export default function ChatScreen({ route }) {
  const roomId = route.params.roomId;
  const [currentMessage, setCurrentMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [userProfile, setUserProfile] = useState({});
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  function getMessages() {
    const q = query(
      collection(db, "rooms", `${roomId}`, "messages"),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    return getDocs(q)
      .then((snapshot) => {
        const messages = snapshot.docs
          .slice(0)
          .reverse()
          .map((doc) => {
            const message = { ...doc.data() };
            const d = new Date(
              Number(
                "" +
                  message.timestamp.seconds +
                  message.timestamp.nanoseconds / 1000000
              )
            );
            const msg = {
              message: message.message,
              firstName: message.firstName,
              lastName: message.lastName,
              uid: message.uid,
              timestamp: `${("0" + d.getHours()).slice(-2)}:${(
                "0" + d.getMinutes()
              ).slice(-2)}`,
            };
            return msg;
          });
        return messages;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function postMessage(content) {
    return addDoc(collection(db, `rooms/${roomId}/messages`), content).catch(
      (err) => {
        console.log(err);
      }
    );
  }
  function postRecentMessage(content) {
    return setDoc(doc(db, "rooms", `${roomId}`), content).catch((err) => {
      console.log(err);
    });
  }

  function getProfile() {
    const docRef = doc(db, "profiles", `${currentUser.uid}`);

    return getDoc(docRef)
      .then((docSnap) => {
        const { firstName, lastName } = docSnap.data();
        return { firstName, lastName };
      })
      .catch((err) => {
        console.log(err);
      });
  }

  useEffect(() => {
    socket.emit("join room", roomId);
    getProfile().then((profile) => {
      setUserProfile(profile);
    });
    getMessages().then((msgs) => {
      setChat(msgs);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    function messageListener(message) {
      const d = new Date(message.timestamp);
      message.timestamp = `${("0" + d.getHours()).slice(-2)}:${(
        "0" + d.getMinutes()
      ).slice(-2)}`;
      setChat((currChat) => [...currChat, message]);
    }
    socket.on("chat message", messageListener);
    return () => {
      socket.off("chat message", messageListener);
    };
  }, [socket]);

  function handleSubmit() {
    if (currentMessage !== "") {
      const content = {
        message: currentMessage,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        uid: currentUser.uid,
        roomId: roomId,
        timestamp: new Date(),
      };
      socket.emit("chat message", content);
      const Proms = [
        postMessage(content),
        postRecentMessage({
          uid: content.uid,
          timestamp: content.timestamp,
          message: currentMessage,
        }),
      ];
      Promise.all(Proms).then(() => {});
      setCurrentMessage("");
    }
  }
  const scrollViewRef = useRef();

  if (loading)
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          textAlign: "center",
          justifyContent: "center",
          flex: 1,
        }}
      >
        <StatusBar barStyle="dark-content" />
        <Image
          style={styles.loading}
          source={require("../images/GREY-GEAR-LOADING.gif")}
        />
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd()}
      >
        {chat.map((message, index) => {
          return (
            <Message key={index} message={message} uid={currentUser.uid} />
          );
        })}
      </ScrollView>

      <View style={styles.messageField}>
        <TextInput
          style={styles.input}
          placeholder="Enter Your Message Here..."
          placeholderTextColor={"black"}
          value={currentMessage}
          onChangeText={setCurrentMessage}
        ></TextInput>
        <Button
          buttonStyle={{ borderRadius: 30, marginLeft: 10, marginVertical: 2 }}
          iconContainerStyle={{ marginLeft: 10 }}
          icon={{ name: "send", color: "#fff", size: 25 }}
          onPress={handleSubmit}
        />
      </View>
    </SafeAreaView>
  );
}
const { height, width } = Dimensions.get("window");
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  messageField: {
    backgroundColor: "white",
    paddingHorizontal: 10,
    width: width,
    bottom: 0,
    flexDirection: "row",
  },
  input: {
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    flex: 1,
    marginVertical: 5,
  },
  loading: {
    width: 100,
    height: 100,
  },
});
