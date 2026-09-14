import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { firebaseConfig } from "./config";

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("getFirebaseAuth() called on server");
  }
  if (_auth) return _auth;
  _auth = getAuth(getFirebaseApp());
  // best-effort; ignore failures (e.g. third-party storage blocked in iframe)
  void setPersistence(_auth, browserLocalPersistence).catch(() => {});
  return _auth;
}
