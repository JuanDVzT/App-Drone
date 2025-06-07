import { useEffect, useState } from "react";

export default function useDronDiscovery() {
  const [wsUrl, setWsUrl] = useState(null);
  const [searching, setSearching] = useState(true);
  const [dronName, setDronName] = useState(null);

  const scanAll = async () => {
    setSearching(true);
    setWsUrl(null);
    setDronName(null);

    const subnets = ["192.168.0", "192.168.1"];
    const port = 81;
    const ipRange = Array.from({ length: 101 }, (_, i) => 50 + i); // .50 a .150

    const tryConnect = (ip) => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://${ip}:${port}`);
        let resolved = false;

        ws.onopen = () => {
          if (!resolved) {
            resolved = true;
            ws.close();
            resolve({ url: `ws://${ip}:${port}`, name: "Dron" });
          }
        };

        ws.onerror = () => {
          if (!resolved) {
            resolved = true;
            ws.close();
            reject();
          }
        };

        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            ws.close();
            reject();
          }
        }, 800); // menor timeout
      });
    };

    const attempts = [];
    for (const subnet of subnets) {
      for (const i of ipRange) {
        const ip = `${subnet}.${i}`;
        attempts.push(tryConnect(ip));
      }
    }

    try {
      const result = await Promise.any(attempts);
      setWsUrl(result.url);
      setDronName(result.name);
    } catch {
      setWsUrl(null);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    scanAll();
  }, []);

  return { wsUrl, dronName, searching, rescan: scanAll };
}
