import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore/lite";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "double-jump-game.firebaseapp.com",
  projectId: "double-jump-game",
  storageBucket: "double-jump-game.appspot.com",
  messagingSenderId: "580939476105",
  appId: "1:580939476105:web:f4053a8ebfca132c55aa58",
  measurementId: "G-BM2XXQDY35"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Requests

export type Leader = {
  id: string;
  player: string;
  spots: number;
  date: string;
};

export async function getLeaderboard(): Promise<Leader[]> {
  try {
    const colRef = collection(db, "leaderboard");
    const q = query(colRef, orderBy("spots", "desc"), limit(10));
    const docsRef = await getDocs(q);

    return (
      docsRef.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Leader)) || []
    );
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function addPayerToLeaderboard(player: string, spots: number) {
  try {
    if (!player || !spots) throw new Error("Invalid request body");
    const docRef = await addDoc(collection(db, "leaderboard"), {
      player,
      spots,
      date: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.log(error);
  }
}

// Analytics

export function trackTetrisGameFinish(spots: number) {
  logEvent(analytics, "double_jump_game_finish", {
    spots,
  });
}

export function trackTetrisSignGameFinish(spots: number, player: string) {
  logEvent(analytics, "double_jump_sign_game_finish", {
    spots,
    player,
  });
}

export function trackTetrisGameRestart() {
  logEvent(analytics, "double_jump_game_restart");
}
