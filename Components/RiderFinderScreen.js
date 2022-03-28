import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";

import SelectDropdown from "react-native-select-dropdown";
import Slider from "@react-native-community/slider";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import {
  collection,
  getDocs,
  query,
  limit,
  getDoc,
  doc,
  where,
} from "firebase/firestore";
import firebase from "../config/firebase.js";
import RiderCard from "./RiderCard";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.js";
const regions = [
  "Scotland",
  "North East",
  "North West",
  "Yorkshire & Humberside",
  "East Midlands",
  "West Midlands",
  "East of England",
  "London",
  "South East",
  "South West",
  "Wales",
  "Northern Ireland",
  "Isle of Man",
];
const genders = ["Male", "Female", "Other", "All"];
const db = firebase.firestore();
const { height, width } = Dimensions.get("window");
export default function RiderFinder({ navigation: { navigate } }) {
  const [riders, setRiders] = useState([]);
  const { currentUser } = useAuth();
  const [gender, setGender] = useState("All");
  const [region, setRegion] = useState("North East");
  const [loading, setLoading] = useState(true);
  const [ageL, setAgeL] = useState(18);
  const [ageH, setAgeH] = useState(100);
  const [lAge, setLAge] = useState(18);
  const [hAge, setHAge] = useState(100);

  function getRiders(minDOB, maxDOB) {
    let q;
    if (gender === "All") {
      q = query(
        collection(db, "profiles"),
        where("region", "==", `${region}`),
        where("DOB", "<", minDOB),
        where("DOB", ">", maxDOB)
      );
    } else {
      q = query(
        collection(db, "profiles"),
        where("selectedGender", "==", `${gender}`),
        where("region", "==", `${region}`),
        where("DOB", "<", minDOB),
        where("DOB", ">", maxDOB)
      );
    }
    const Proms = [getDocs(q), getDoc(doc(db, `profiles/${currentUser.uid}`))];
    return Promise.all(Proms).then(([snapshot, docSnap]) => {
      let profiles = [];
      snapshot.docs.forEach((doc) => {
        if (doc.data.uid !== currentUser.uid) profiles.push(doc.data());
      });
      const { connected } = docSnap.data();
      if (connected !== undefined) {
        profiles = profiles.filter(
          (profile) => !connected.includes(profile.uid)
        );
      }
      for (let i = profiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = profiles[i];
        profiles[i] = profiles[j];
        profiles[j] = temp;
      }

      return profiles;
    });
  }

  useEffect(() => {
    const d = new Date();
    const d2 = new Date();
    d.setFullYear(d.getFullYear() - lAge);
    d.setHours(0, 0, 0, 0);
    d2.setFullYear(d2.getFullYear() - hAge);
    d2.setHours(23, 59, 59, 99);
    getRiders(d, d2).then((profiles) => {
      setRiders(profiles);
      setLoading(false);
    });
  }, [region, gender, lAge, hAge]);

  if (loading)
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          textAlign: "center",
          justifyContent: "center",
          backgroundColor: "#0984E3",
          flex: 1,
        }}
      >
        <Image
          style={styles.loading}
          source={require("../images/GREY-GEAR-LOADING.gif")}
        />
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.filterContainer}>
        <SelectDropdown
          data={regions}
          onSelect={(selectedItem, index) => {
            setRegion(selectedItem);
          }}
          buttonTextAfterSelection={(selectedItem, index) => {
            return selectedItem;
          }}
          defaultButtonText={"Region"}
          buttonStyle={styles.dropdown2BtnStyle}
          buttonTextStyle={styles.dropdown2BtnTxtStyle}
          renderDropdownIcon={(isOpened) => {
            return (
              <FontAwesome
                name={isOpened ? "chevron-up" : "chevron-down"}
                color={"#444"}
                size={18}
              />
            );
          }}
          dropdownIconPosition={"right"}
          dropdownStyle={styles.dropdown2DropdownStyle}
          rowStyle={styles.dropdown2RowStyle}
          rowTextStyle={styles.dropdown2RowTxtStyle}
        />
        <SelectDropdown
          data={genders}
          onSelect={(selectedItem, index) => {
            setGender(selectedItem);
          }}
          buttonTextAfterSelection={(selectedItem, index) => {
            return selectedItem;
          }}
          defaultButtonText={"Gender"}
          buttonStyle={styles.dropdown2BtnStyle}
          buttonTextStyle={styles.dropdown2BtnTxtStyle}
          renderDropdownIcon={(isOpened) => {
            return (
              <FontAwesome
                name={isOpened ? "chevron-up" : "chevron-down"}
                color={"#444"}
                size={18}
              />
            );
          }}
          dropdownIconPosition={"right"}
          dropdownStyle={styles.dropdown2DropdownStyle}
          rowStyle={styles.dropdown2RowStyle}
          rowTextStyle={styles.dropdown2RowTxtStyle}
        />
      </View>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>{ageL}</Text>
      {/* <Text style={{ fontSize: 20, fontWeight: "bold" }}>{slidingL}</Text> */}
      <Slider
        style={{ width: width * 0.9, height: 40 }}
        minimumValue={18}
        maximumValue={100}
        value={ageL}
        onValueChange={(value) => {
          if (value > ageH) {
            setAgeH(parseInt(value));
            setAgeL(parseInt(value));
          } else {
            setAgeL(parseInt(value));
          }
        }}
        // onSlidingStart={() => setSlidingL("Sliding")}
        onSlidingComplete={() => setLAge(ageL)}
      />
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>{ageH}</Text>
      {/* <Text style={{ fontSize: 20, fontWeight: "bold" }}>{slidingH}</Text> */}
      <Slider
        style={{ width: width * 0.9, height: 40 }}
        minimumValue={18}
        maximumValue={100}
        value={ageH}
        onValueChange={(value) => {
          if (value < ageL) {
            setAgeH(parseInt(value));
            setAgeL(parseInt(value));
          } else {
            setAgeH(parseInt(value));
          }
        }}
        onSlidingComplete={() => setHAge(ageH)}
      />
      {riders.map((rider, index) => {
        return (
          <RiderCard
            rider={rider}
            navigate={navigate}
            setLoading={setLoading}
            key={index}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0984E3",
    flex: 1,
  },
  filterContainer: {
    flexDirection: "row",
  },
  loading: {
    width: 100,
    height: 100,
  },
});
