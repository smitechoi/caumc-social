import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
const firebaseConfig = {
    apiKey: "AIzaSyDyaYjLSUQrM6RfecQKGBdgNm2xDmXRZDI",
    authDomain: "caumc-social.firebaseapp.com",
    projectId: "caumc-social",
    storageBucket: "caumc-social.firebasestorage.app",
    messagingSenderId: "436597266392",
    appId: "1:436597266392:web:f5596058cb1928a56444ad",
    measurementId: "G-JRJQ0JTG2W"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore();
export default app;
