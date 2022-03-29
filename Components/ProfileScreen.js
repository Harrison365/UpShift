import React, { useState, useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
  Button,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ScrollView,
} from "react-native";
import { ProfileCard } from "./ProfileCard";
import { useAuth } from "../contexts/AuthContext";
import { fetchCurrLocation } from "./api";

import {
  getProfile,
  getRoutes,
  getProfilePicture,
} from "../utils/firebaseFuncs";

import getAge from "./ageCalculator";

export default function ProfileScreen({ navigation: { navigate } }) {
  const { logout, currentUser } = useAuth();
  const [error, setError] = useState("");

  const [userLocation, setUserLocation] = useState({});

  const isFocused = useIsFocused();
  const [profile, setProfile] = useState({});
  const [age, setAge] = useState();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrLocation().then((data) => {
      setUserLocation(data);
    });
  }, []);

  useEffect(() => {
    if (currentUser !== null) {
      getRoutes(currentUser.uid).then((data) => {
        setRoutes(data);
      });
      getProfile(currentUser.uid).then((data) => {
        const dobString = new Date(data.DOB.seconds * 1000);
        const calcAge = getAge(dobString);
        setAge(calcAge);
        setProfile(data);
      });
      setLoading(false);
    }
  }, [isFocused]);

  const handleLogout = () => {
    setError("");
    logout()
      .then(() => {
        navigate("Login");
      })
      .catch(() => {
        setError("Failed to log out");
      });
  };

  if (loading)
    return (
      <View>
        <Text>loading</Text>
      </View>
    );

  return (
    <ScrollView>
      <Text>{error && error}</Text>
      <TouchableOpacity style={styles.buttonContainer}>
        <Button title="Logout" color="black" onPress={handleLogout} />
      </TouchableOpacity>

      <ProfileCard
        age={age}
        profile={profile}
      />
      <View>
        <TouchableOpacity style={styles.buttonContainer}>
          <Button
            title="Find Rider"
            color="black"
            onPress={() => {
              navigate("Rider Finder");
            }}
          />
        </TouchableOpacity>
      </View>

      <View>
        <TouchableOpacity style={styles.buttonContainer}>
          <Button
            title="Plan Route"
            color="black"
            onPress={() =>
              navigate("RoutePlanner", {
                location: userLocation,
              })
            }
          />
        </TouchableOpacity>

        <Text style={styles.title}>Saved Routes</Text>
        <View>
          {routes.map((route, i) => {
            return (
              <Button
                key={i}
                title={`${route.id}`}
                color="black"
                onPress={() =>
                  navigate("SavedRoutes", { location: route.myRoute })
                }
              />
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#0984E3", flex: 1 },
  buttonContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 10,
    paddingHorizontal: 10,
    margin: 20,
  },
  profileCard: {
    backgroundColor: "#0984E3",
  },
  text: {
    fontSize: 20,
    color: "#fff",
    padding: 10,
  },
  title: {
    fontSize: 25,
    alignSelf: "center",
    fontWeight: "bold",
    color: "#fff",
  },
});
