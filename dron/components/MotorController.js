import { useState, useEffect } from "react";
import { View, Button, Text, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";

export default function MotorController({ wsUrl, socketRef, onBack }) {
  const [speedA1, setSpeedA1] = useState(0);
  const [speedA2, setSpeedA2] = useState(0);
  const [speedB1, setSpeedB1] = useState(0);
  const [speedB2, setSpeedB2] = useState(0);

  const sendCommand = (command) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(command));
    } else {
      console.warn("WebSocket no conectado");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Velocidad Motor A1: {Math.round(speedA1)}</Text>
      <Slider
        style={styles.slider}
        minimumValue={-255}
        maximumValue={255}
        step={1}
        value={speedA1}
        minimumTrackTintColor="#1fb28a"
        maximumTrackTintColor="#d3d3d3"
        thumbTintColor="#1a9274"
        onValueChange={(value) => {
          setSpeedA1(value);
          sendCommand({ motor: "A1", velocidad: Math.round(value) });
        }}
      />

      <Text style={styles.label}>Velocidad Motor A2: {Math.round(speedA2)}</Text>
      <Slider
        style={styles.slider}
        minimumValue={-255}
        maximumValue={255}
        step={1}
        value={speedA2}
        minimumTrackTintColor="#1fb28a"
        maximumTrackTintColor="#d3d3d3"
        thumbTintColor="#1a9274"
        onValueChange={(value) => {
          setSpeedA2(value);
          sendCommand({ motor: "A2", velocidad: Math.round(value) });
        }}
      />

      <Text style={styles.label}>Velocidad Motor B1: {Math.round(speedB1)}</Text>
      <Slider
        style={styles.slider}
        minimumValue={-255}
        maximumValue={255}
        step={1}
        value={speedB1}
        minimumTrackTintColor="#1fb28a"
        maximumTrackTintColor="#d3d3d3"
        thumbTintColor="#1a9274"
        onValueChange={(value) => {
          setSpeedB1(value);
          sendCommand({ motor: "B1", velocidad: Math.round(value) });
        }}
      />

      <Text style={styles.label}>Velocidad Motor B2: {Math.round(speedB2)}</Text>
      <Slider
        style={styles.slider}
        minimumValue={-255}
        maximumValue={255}
        step={1}
        value={speedB2}
        minimumTrackTintColor="#1fb28a"
        maximumTrackTintColor="#d3d3d3"
        thumbTintColor="#1a9274"
        onValueChange={(value) => {
          setSpeedB2(value);
          sendCommand({ motor: "B2", velocidad: Math.round(value) });
        }}
      />

      <View style={styles.buttonGroup}>
        <Button
          title="Apagar Motores"
          onPress={() => sendCommand({ stop: true })}
          color="red"
        />
        <Button
          title="Volver"
          onPress={onBack}
          color="gray"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  label: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 5
  },
  slider: {
    width: '100%',
    height: 40
  },
  buttonGroup: {
    marginTop: 30,
    gap: 10
  }
});