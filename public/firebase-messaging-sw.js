importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCyyMdToNzDlbz9zB3WeIQWvh7Y4F4Dphw",
    authDomain: "notification-system-7d353.firebaseapp.com",
    projectId: "notification-system-7d353",
    storageBucket: "notification-system-7d353.firebasestorage.app",
    messagingSenderId: "740430625978",
    appId: "1:740430625978:web:f589a57aec4430c86a9683"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Optional: Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);
});