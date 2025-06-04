
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDyaYjLSUQrM6RfecQKGBdgNm2xDmXRZDI",
    authDomain: "caumc-social.firebaseapp.com",
    projectId: "caumc-social",
    storageBucket: "caumc-social.firebasestorage.app",
    messagingSenderId: "436597266392",
    appId: "1:436597266392:web:f5596058cb1928a56444ad",
    measurementId: "G-JRJQ0JTG2W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);