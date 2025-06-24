// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");
import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Define an interface for the Firebase configuration to ensure type safety
interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string; // measurementId is optional
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseConfig = {
    apiKey: process.env.FIREBASE_CONFIG_APIKEY!,
    authDomain: process.env.FIREBASE_CONFIG_AUTHDOMAIN!,
    projectId: process.env.FIREBASE_CONFIG_PROJECTID!,
    storageBucket: process.env.FIREBASE_CONFIG_STORAGEBUCKET!,
    messagingSenderId: process.env.FIREBASE_CONFIG_MESSAGINGSENDERID!,
    appId: process.env.FIREBASE_CONFIG_APPID!,
    measurementId: process.env.FIREBASE_CONFIG_MEASUREMENTID!
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


const firebaseAdminConfig = {
    "type": "service_account",
    "project_id": "madcw2-wellness-app",
    "private_key_id": process.env.FIREBASE_ADMIN_CONFIG_PRIVATE_KEY_ID!,
    "private_key": process.env.FIREBASE_ADMIN_CONFIG_PRIVATE_KEY!,
    "client_email": process.env.FIREBASE_ADMIN_CONFIG_CLIENT_EMAIL!,
    "client_id": process.env.FIREBASE_ADMIN_CONFIG_CLIENT_ID!,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40madcw2-wellness-app.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
}



const serviceAccount: admin.ServiceAccount = {
    projectId: firebaseAdminConfig.project_id,
    privateKey: firebaseAdminConfig.private_key?.replace(/\\n/g, '\n'),
    clientEmail: firebaseAdminConfig.client_email
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}


module.exports = { db, admin };