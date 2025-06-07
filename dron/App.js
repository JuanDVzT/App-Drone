import { View, ActivityIndicator, Text, Button, StyleSheet } from "react-native";
import { useState, useRef } from "react";
import MotorController from "./components/MotorController";
import useDronDiscovery from "./hooks/useDronDiscovery";
import * as ScreenOrientation from 'expo-screen-orientation';

export default function App() {
  const { wsUrl, dronName, searching, rescan } = useDronDiscovery();
  const [connected, setConnected] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [flightMode, setFlightMode] = useState(false);
  const socketRef = useRef(null);

  const sendCommand = (command) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(command));
      console.log("Comando enviado:", command);
    } else {
      console.warn("WebSocket no conectado");
    }
  };

  const sendFlightCommand = (direction) => {
    const commands = {
      up: { A1: 200, A2: 200, B1: 200, B2: 200 },
      down: { A1: -200, A2: -200, B1: -200, B2: -200 },
      left: { A1: -200, A2: 200, B1: 200, B2: -200 },
      right: { A1: 200, A2: -200, B1: -200, B2: 200 },
      forward: { A1: 200, A2: 200, B1: 200, B2: 200 },
      backward: { A1: -200, A2: -200, B1: -200, B2: -200 },
      rotateLeft: { A1: 200, A2: -200, B1: 200, B2: -200 },
      rotateRight: { A1: -200, A2: 200, B1: -200, B2: 200 },
      stop: { stop: true }
    };
    sendCommand(commands[direction]);
  };

  if (searching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Buscando dron en la red...</Text>
      </View>
    );
  }

  if (!wsUrl) {
    return (
      <View style={styles.center}>
        <Text>No se pudo encontrar el dron.</Text>
        <Button title="Reintentar búsqueda" onPress={rescan} />
      </View>
    );
  }

  if (!connected) {
    return (
      <View style={styles.center}>
        <Button
          title={`Conectar a ${dronName}`}
          onPress={() => {
            const socket = new WebSocket(wsUrl);
            socket.onopen = () => {
              console.log("✅ Conectado al dron");
              setConnected(true);
            };
            socket.onerror = (err) => {
              console.error("❌ Error de conexión:", err.message);
            };
            socketRef.current = socket;
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {flightMode ? (
        <View style={styles.flightContainer}>
          <View style={styles.controlGroup}>
            <Text>Movimiento</Text>
            <View style={styles.row}>
              <Button title="↑" onPress={() => sendFlightCommand('forward')} />
            </View>
            <View style={styles.row}>
              <Button title="←" onPress={() => sendFlightCommand('left')} />
              <Button title="→" onPress={() => sendFlightCommand('right')} />
            </View>
            <View style={styles.row}>
              <Button title="↓" onPress={() => sendFlightCommand('backward')} />
            </View>
          </View>

          <View style={styles.controlGroup}>
            <Text>Rotación / Altura</Text>
            <View style={styles.row}>
              <Button title="↺" onPress={() => sendFlightCommand('rotateLeft')} />
              <Button title="↻" onPress={() => sendFlightCommand('rotateRight')} />
            </View>
            <View style={styles.row}>
              <Button title="Ascender" onPress={() => sendFlightCommand('up')} />
              <Button title="Descender" onPress={() => sendFlightCommand('down')} />
            </View>
          </View>

          <View style={styles.controlGroup}>
            <Button title="Apagar Motores" onPress={() => sendFlightCommand('stop')} color="red" />
            <Button title="Regresar" onPress={async () => {
              await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
              setFlightMode(false);
            }} />
          </View>
        </View>
      ) : testMode ? (
        <MotorController 
          wsUrl={wsUrl} 
          socketRef={socketRef} 
          onBack={() => setTestMode(false)}
        />
      ) : (
        <View style={styles.center}>
          <Button
            title="Modo Vuelo Normal"
            onPress={async () => {
              await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
              setFlightMode(true);
            }}
            style={styles.menuButton}
          />
          <Button
            title="Prueba de Motores"
            onPress={() => setTestMode(true)}
            style={styles.menuButton}
          />
          <Button
            title="Desconectar"
            onPress={() => setConnected(false)}
            color="gray"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  flightContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 50,
    backgroundColor: '#eaeaea'
  },
  controlGroup: {
    alignItems: 'center',
    margin: 10,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 3
  },
  row: {
    flexDirection: 'row',
    marginVertical: 5,
    gap: 10
  },
  menuButton: {
    marginVertical: 10,
    width: 200
  }
});
