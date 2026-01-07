importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "process.env.API_KEY",
    authDomain: "process.env.AUTH_DOMAIN",
    projectId: "process.env.PROJECT_ID",
    storageBucket: "process.env.STORAGE_BUCKET",
    messagingSenderId: "process.env.MESSAGING_SENDER_ID",
    appId: "process.env.APP_ID"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Optional: Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);
});