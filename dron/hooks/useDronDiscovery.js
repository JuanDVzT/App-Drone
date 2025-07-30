import { useEffect, useState, useRef, useCallback, useMemo } from "react";

export default function useDronDiscovery() {
  const [wsUrl, setWsUrl] = useState(null);
  const [searching, setSearching] = useState(true);
  const [dronName, setDronName] = useState(null);

  const abortRef = useRef(false);

  const timeoutMs = 800;
  const port = 81;
  // Lista de 10 IPs fijas posibles (debe coincidir con el ESP32)
  const ipRange = useMemo(
    () => [
      "192.168.1.200",
      "192.168.1.201",
      "192.168.1.202",
      "192.168.1.203",
      "192.168.1.204",
      "192.168.1.205",
      "192.168.1.206",
      "192.168.1.207",
      "192.168.1.208",
      "192.168.1.209",
    ],
    []
  );

  // Solo prueba si el WebSocket abre, pero no lo mantiene abierto
  const tryConnect = (ip) => {
    return new Promise((resolve, reject) => {
      if (abortRef.current) return reject();
      const ws = new WebSocket(`ws://${ip}:${port}`);
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          ws.close();
          reject();
        }
      }, timeoutMs);
      ws.onopen = () => {
        if (!settled && !abortRef.current) {
          clearTimeout(timer);
          settled = true;
          ws.close(); // Cierra inmediatamente, solo testea
          resolve({ url: `ws://${ip}:${port}`, name: "Dron" });
        } else {
          ws.close();
          reject();
        }
      };
      ws.onerror = () => {
        if (!settled) {
          clearTimeout(timer);
          settled = true;
          ws.close();
          reject();
        }
      };
      ws.onclose = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject();
        }
      };
    });
  };

  const limitConcurrency = async (tasks, limit = 5) => {
    const results = [];
    let running = 0;
    let index = 0;
    let stopped = false;
    return new Promise((resolve) => {
      const runNext = () => {
        if (abortRef.current || stopped) return resolve(results);
        if (index === tasks.length && running === 0) return resolve(results);
        while (running < limit && index < tasks.length) {
          const i = index++;
          running++;
          tasks[i]()
            .then((res) => {
              results[i] = { status: "fulfilled", value: res };
              if (res) {
                stopped = true;
                abortRef.current = true;
              }
            })
            .catch(() => {
              results[i] = { status: "rejected" };
            })
            .finally(() => {
              running--;
              runNext();
            });
        }
      };
      runNext();
    });
  };

  const scanAll = useCallback(async () => {
    setSearching(true);
    setWsUrl(null);
    setDronName(null);
    abortRef.current = false;
    const tasks = ipRange.map((ip) => () => tryConnect(ip));
    const results = await limitConcurrency(tasks, 5);
    if (abortRef.current) {
      setSearching(false);
      const success = results.find((r) => r?.status === "fulfilled" && r.value);
      if (success) {
        setWsUrl(success.value.url);
        setDronName(success.value.name);
      }
      return;
    }
    setWsUrl(null);
    setDronName(null);
    setSearching(false);
  }, [ipRange]);

  useEffect(() => {
    scanAll();
    return () => {
      abortRef.current = true;
    };
  }, [scanAll]);

  return { wsUrl, dronName, searching, rescan: scanAll };
}
