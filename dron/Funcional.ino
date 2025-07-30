#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

// 🛜 Configuración WiFi
const char* ssid = "ALEXIS";
const char* password = "58036136";

// 🌐 WebSocket server en puerto 81
WebSocketsServer webSocket = WebSocketsServer(81);

// 🎮 Pines de los motores (2 pines por motor)
#define A1_IN1 13
#define A1_IN2 12
#define A2_IN1 14
#define A2_IN2 27
#define B1_IN1 26
#define B1_IN2 25
#define B2_IN1 33
#define B2_IN2 32

// 🔧 Función para controlar un motor
void setMotor(int in1, int in2, int velocidad) {
  velocidad = constrain(velocidad, -255, 255);
  if (velocidad > 0) {
    analogWrite(in1, velocidad);
    digitalWrite(in2, LOW);
  } else if (velocidad < 0) {
    analogWrite(in2, -velocidad);
    digitalWrite(in1, LOW);
  } else {
    digitalWrite(in1, LOW);
    digitalWrite(in2, LOW);
  }
}

// 📥 Procesar comandos JSON
void handleCommand(String jsonStr) {
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, jsonStr);
  if (error) {
    Serial.println("❌ Error en el JSON");
    return;
  }

  // 🛑 Comando de parada
  if (doc.containsKey("stop")) {
    setMotor(A1_IN1, A1_IN2, 0);
    setMotor(A2_IN1, A2_IN2, 0);
    setMotor(B1_IN1, B1_IN2, 0);
    setMotor(B2_IN1, B2_IN2, 0);
    Serial.println("🛑 Motores apagados");
    return;
  }

  // 🚀 Comandos de vuelo/rotación (ej: {"A1": 200, "B2": -100})
  for (JsonPair kv : doc.as<JsonObject>()) {
    const char* motor = kv.key().c_str();
    int velocidad = kv.value().as<int>();

    if (strcmp(motor, "A1") == 0) setMotor(A1_IN1, A1_IN2, velocidad);
    else if (strcmp(motor, "A2") == 0) setMotor(A2_IN1, A2_IN2, velocidad);
    else if (strcmp(motor, "B1") == 0) setMotor(B1_IN1, B1_IN2, velocidad);
    else if (strcmp(motor, "B2") == 0) setMotor(B2_IN1, B2_IN2, velocidad);

    Serial.printf("⚙️ %s => %d\n", motor, velocidad);
  }
}

// 🔌 Eventos WebSocket
void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      Serial.printf("✅ Cliente conectado: %u\n", num);
      break;
    case WStype_DISCONNECTED:
      Serial.printf("❌ Cliente desconectado: %u\n", num);
      break;
    case WStype_TEXT:
      handleCommand(String((char*)payload));
      break;
  }
}

// Lista de 10 IPs fijas posibles (debe coincidir con la app)
const int ipRangeCount = 10;
IPAddress fixedIPs[ipRangeCount] = {
  IPAddress(192,168,1,200),
  IPAddress(192,168,1,201),
  IPAddress(192,168,1,202),
  IPAddress(192,168,1,203),
  IPAddress(192,168,1,204),
  IPAddress(192,168,1,205),
  IPAddress(192,168,1,206),
  IPAddress(192,168,1,207),
  IPAddress(192,168,1,208),
  IPAddress(192,168,1,209)
};
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);

void setup() {
  Serial.begin(115200);

  // Configurar pines motores
  pinMode(A1_IN1, OUTPUT); pinMode(A1_IN2, OUTPUT);
  pinMode(A2_IN1, OUTPUT); pinMode(A2_IN2, OUTPUT);
  pinMode(B1_IN1, OUTPUT); pinMode(B1_IN2, OUTPUT);
  pinMode(B2_IN1, OUTPUT); pinMode(B2_IN2, OUTPUT);

  Serial.println("Intentando conectar con IP fija en rango...");

  bool connected = false;

  // Intenta conectarse a una de las 10 IPs fijas
  for (int i = 0; i < ipRangeCount; i++) {
    IPAddress tryIP = fixedIPs[i];
    Serial.print("Probando IP fija: ");
    Serial.println(tryIP);
    if (!WiFi.config(tryIP, gateway, subnet)) {
      Serial.println("Fallo configuración IP fija.");
      continue;
    }
    WiFi.begin(ssid, password);
    unsigned long startTime = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startTime < 7000) {
      delay(250);
      Serial.print(".");
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n✅ Conectado a WiFi!");
      Serial.print("IP asignada: ");
      Serial.println(WiFi.localIP());
      connected = true;
      break; // QUEDARSE en esta IP y no probar más
    } else {
      Serial.println("\n❌ No se pudo conectar con esta IP.");
    }
  }

  if (!connected) {
    Serial.println("No se pudo conectar a WiFi con ninguna IP fija del rango.");
    // Fallback a DHCP si ninguna IP fija funciona
    WiFi.config(INADDR_NONE, INADDR_NONE, INADDR_NONE); // resetea configuración fija
    WiFi.begin(ssid, password);
    unsigned long startTime = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startTime < 10000) {
      delay(250);
      Serial.print(".");
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n✅ Conectado con DHCP");
      Serial.print("IP asignada: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.println("\n❌ No se pudo conectar a WiFi");
    }
  }

  // Iniciar WebSocket si conectado
  if (WiFi.status() == WL_CONNECTED) {
    webSocket.begin();
    webSocket.onEvent(onWebSocketEvent);
  }
}

void loop() {
  webSocket.loop();
}
