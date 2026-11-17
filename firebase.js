/* Firebase browser service for the static GitHub Pages website.
   Uses Firebase compat SDK loaded by index.html. No server/build process required. */
(function () {
  "use strict";
  let app = null, auth = null, firestore = null, storage = null;
  const listeners = new Map();
  const PUBLIC_COLLECTIONS = new Set(["developers", "materials", "questions", "examples", "settings"]);

  function configured() {
    const c = window.FIREBASE_CONFIG || {};
    return !!(c.apiKey && c.projectId && c.appId &&
      !String(c.apiKey).startsWith("ISI_") &&
      !String(c.projectId).startsWith("ISI_") &&
      !String(c.appId).startsWith("ISI_"));
  }
  async function init() {
    if (!configured()) return false;
    if (app) return true;
    if (!window.firebase || !firebase.initializeApp) throw new Error("Firebase SDK gagal dimuat. Periksa koneksi dan CDN.");
    app = firebase.apps.length ? firebase.app() : firebase.initializeApp(window.FIREBASE_CONFIG);
    auth = firebase.auth();
    firestore = firebase.firestore();
    storage = firebase.storage();
    try { await firestore.enablePersistence({ synchronizeTabs: true }); }
    catch (err) { console.info("Firestore persistence tidak aktif:", err.code || err.message); }
    return true;
  }
  function requireReady() {
    if (!firestore) throw new Error("Firebase belum diinisialisasi atau konfigurasi belum diisi.");
  }
  function isTeacher() { return !!(auth && auth.currentUser); }
  async function isAuthorizedTeacher(uid) {
    requireReady();
    if (!uid) return false;
    const doc = await firestore.collection("teachers").doc(uid).get();
    return doc.exists && doc.data()?.active !== false;
  }
  async function signInTeacher(email, password) {
    requireReady();
    const credential = await auth.signInWithEmailAndPassword(email, password);
    if (!(await isAuthorizedTeacher(credential.user.uid))) {
      await auth.signOut();
      throw new Error("Akun belum terdaftar sebagai guru terotorisasi. Daftarkan UID pada koleksi teachers.");
    }
    return credential.user;
  }
  async function getAll(name) {
    requireReady();
    if (!PUBLIC_COLLECTIONS.has(name)) throw new Error("Koleksi tidak diizinkan.");
    const cached = listeners.get(name)?.cache;
    if (cached) return cached;
    const snap = await firestore.collection(name).get();
    const rows = snap.docs.map(d => d.data());
    listeners.set(name, { ...(listeners.get(name) || {}), cache: rows });
    return rows;
  }
  async function put(name, item) {
    requireReady();
    if (!PUBLIC_COLLECTIONS.has(name)) throw new Error("Koleksi tidak diizinkan.");
    if (!isTeacher()) throw new Error("Login guru diperlukan untuk menulis ke Firestore.");
    if (!item || item.id === undefined || item.id === null) throw new Error("Data harus memiliki id.");
    const payload = { ...item, updatedAt: item.updatedAt || new Date().toISOString() };
    await firestore.collection(name).doc(String(item.id)).set(payload);
    const rows = (await getAll(name).catch(() => [])).slice();
    const index = rows.findIndex(row => String(row.id) === String(item.id));
    if (index >= 0) rows[index] = payload; else rows.push(payload);
    listeners.set(name, { ...(listeners.get(name) || {}), cache: rows });
    return payload;
  }
  async function remove(name, id) {
    requireReady();
    if (!PUBLIC_COLLECTIONS.has(name) || !isTeacher()) throw new Error("Akses guru diperlukan.");
    await firestore.collection(name).doc(String(id)).delete();
    const rows = (await getAll(name).catch(() => [])).filter(row => String(row.id) !== String(id));
    listeners.set(name, { ...(listeners.get(name) || {}), cache: rows });
  }
  async function clear(name) {
    requireReady();
    if (!PUBLIC_COLLECTIONS.has(name) || !isTeacher()) throw new Error("Akses guru diperlukan.");
    const snap = await firestore.collection(name).get();
    let batch = firestore.batch(), count = 0;
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
      if (++count === 450) { await batch.commit(); batch = firestore.batch(); count = 0; }
    }
    if (count) await batch.commit();
    listeners.set(name, { ...(listeners.get(name) || {}), cache: [] });
  }
  function listen(name, callback) {
    requireReady();
    if (!PUBLIC_COLLECTIONS.has(name)) return () => {};
    const old = listeners.get(name);
    if (old?.unsubscribe) old.unsubscribe();
    const unsubscribe = firestore.collection(name).onSnapshot(snap => {
      const rows = snap.docs.map(d => d.data());
      listeners.set(name, { cache: rows, unsubscribe });
      callback(rows);
    }, err => console.error("Firestore realtime listener:", name, err));
    listeners.set(name, { ...(old || {}), unsubscribe });
    return unsubscribe;
  }
  async function uploadFile(file, path) {
    requireReady();
    if (!isTeacher()) throw new Error("Login guru diperlukan untuk mengunggah media.");
    const ref = storage.ref().child(path);
    const snap = await ref.put(file, { contentType: file.type || "application/octet-stream" });
    return snap.ref.getDownloadURL();
  }
  function onAuthStateChanged(callback) { requireReady(); return auth.onAuthStateChanged(callback); }
  async function signOut() { if (auth) await auth.signOut(); }
  window.firebaseService = { init, isConfigured: configured, isTeacher, isAuthorizedTeacher,
    signInTeacher, signOut, onAuthStateChanged, getAll, put, remove, clear, listen, uploadFile };
})();
