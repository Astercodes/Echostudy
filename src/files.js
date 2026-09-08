let namespace = null;
export function setFileNamespace(id) {
  namespace = id;
}
export function getFileNamespace() {
  return namespace;
}
function open() {
  return new Promise((resolve, reject) => {
    if (!namespace) {
      reject(new Error("Sign in to access resource files."));
      return;
    }
    const r = indexedDB.open("echostudy-files:" + namespace, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function putFile(id, file) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(file, id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export async function getFile(id) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const r = db.transaction("files").objectStore("files").get(id);
    r.onsuccess = () => {
      db.close();
      resolve(r.result);
    };
    r.onerror = () => {
      db.close();
      reject(r.error);
    };
  });
}
