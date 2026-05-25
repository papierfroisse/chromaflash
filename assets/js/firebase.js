// ─── CONFIGURATION FIREBASE ─────────────────────────────────────────
// TODO: Remplacer ces valeurs par celles de votre projet Firebase
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJET.firebaseapp.com",
  projectId: "VOTRE_PROJET",
  storageBucket: "VOTRE_PROJET.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

// ─── IMPORTS DYNAMIQUES (CDN) ────────────────────────────────────────
// On utilise des imports dynamiques pour ne pas bloquer le chargement du jeu
let app, auth, db;
let GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged;
let collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp;

export let currentUser = null;

export async function initFirebase() {
  if (firebaseConfig.apiKey === "VOTRE_API_KEY") {
    console.warn("⚠️ Firebase n'est pas encore configuré. Le classement est désactivé.");
    return false;
  }

  try {
    const firebaseApp = await import('https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js');
    const firebaseAuth = await import('https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js');
    const firebaseFirestore = await import('https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js');

    app = firebaseApp.initializeApp(firebaseConfig);
    auth = firebaseAuth.getAuth(app);
    db = firebaseFirestore.getFirestore(app);

    GoogleAuthProvider = firebaseAuth.GoogleAuthProvider;
    signInWithPopup = firebaseAuth.signInWithPopup;
    signOut = firebaseAuth.signOut;
    onAuthStateChanged = firebaseAuth.onAuthStateChanged;

    collection = firebaseFirestore.collection;
    addDoc = firebaseFirestore.addDoc;
    getDocs = firebaseFirestore.getDocs;
    query = firebaseFirestore.query;
    orderBy = firebaseFirestore.orderBy;
    limit = firebaseFirestore.limit;
    serverTimestamp = firebaseFirestore.serverTimestamp;

    return true;
  } catch (err) {
    console.error("Erreur d'initialisation Firebase:", err);
    return false;
  }
}

// ─── AUTHENTIFICATION ───────────────────────────────────────────────

export async function signIn() {
  if (!auth) return;
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Erreur de connexion:", error);
  }
}

export async function logOut() {
  if (!auth) return;
  await signOut(auth);
}

export function onUserChange(callback) {
  if (!auth) return;
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    callback(user);
  });
}

// ─── BASE DE DONNÉES ────────────────────────────────────────────────

export async function saveScore(mode, score) {
  if (!db || !currentUser) return false;
  try {
    await addDoc(collection(db, `scores_${mode}`), {
      uid: currentUser.uid,
      name: currentUser.displayName || 'Anonyme',
      score: Number(score),
      date: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.error("Erreur lors de la sauvegarde du score:", e);
    return false;
  }
}

export async function getLeaderboard(mode, maxResults = 10) {
  if (!db) {
    // Return dummy data if Firebase is not configured
    return [
      { name: 'Wario', score: 9999 },
      { name: 'Mario', score: 8500 },
      { name: 'Toad', score: 7200 },
      { name: 'Joueur Anonyme', score: 6000 },
      { name: 'Toi', score: 4500 },
    ];
  }
  
  try {
    const q = query(
      collection(db, `scores_${mode}`),
      orderBy("score", "desc"),
      limit(maxResults)
    );
    const querySnapshot = await getDocs(q);
    const results = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data());
    });
    return results;
  } catch (e) {
    console.error("Erreur lors de la récupération du classement:", e);
    return [];
  }
}
