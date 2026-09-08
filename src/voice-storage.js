import { getFileNamespace } from "./files";

// Capture the account at mount so an in-flight microphone request cannot save
// into another account after sign-out.
export function voiceStore() {
  const account = getFileNamespace();
  const run = (key, value, write) =>
    new Promise((resolve, reject) => {
      if (!account) return reject(new Error("Sign in to save audio."));
      const request = indexedDB.open("echostudy-voice:" + account, 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("recordings");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(
          "recordings",
          write ? "readwrite" : "readonly",
        );
        const operation = write
          ? tx.objectStore("recordings").put(value, key)
          : tx.objectStore("recordings").get(key);
        tx.oncomplete = () => {
          db.close();
          resolve(write ? undefined : operation.result || []);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error || new Error("Audio save interrupted."));
        };
      };
    });
  return {
    read: (key) => run(key, null, false),
    write: (key, value) => run(key, value, true),
  };
}
