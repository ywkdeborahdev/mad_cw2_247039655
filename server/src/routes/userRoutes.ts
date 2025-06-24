import { Router, Request, Response } from 'express';

// Extend Express Request interface to include 'user'
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

import {
    BadRequestResponse,
    InternalServerErrorResponse,
    SuccessResponse,
    UnauthorizedResponse
} from '../utils/HttpResponse';
const { db } = require('../../firebaseBackend');
import { collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import multer from 'multer';
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } = require("firebase/auth");
import admin from 'firebase-admin';
import verifyToken from '../middleware/verifyToken'; // Assuming you have a middleware for token verification


const router = Router();
const auth = getAuth();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/checkToken', verifyToken, async (req: Request, res: Response): Promise<void> => {
    console.log('Check token request received:', req.body);
    console.log('User from token:', req.user);
});
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
        const badRequestResponse = new BadRequestResponse('email and password required');
        res.status(badRequestResponse.statusCode).json(badRequestResponse.toJSON());
        return;
    }
    // Basic validation

    try {
        // const usersCollection = collection(db, 'users');
        // const usersSnapshot = await getDocs(usersCollection);
        // const user: User | undefined = usersSnapshot.docs
        //     .map((doc) => {
        //         const data = doc.data();
        //         return {
        //             id: doc.id,
        //             name: data.name,
        //             email: data.email,
        //             password: data.password ?? ''
        //         } as User;
        //     })
        //     .find((user) => user.email === email);

        // if (!user) {
        //     const newUser = { email, password, createdAt: new Date().toISOString() };
        //     await addDoc(usersCollection, newUser);
        //     const createdResponse = new SuccessResponse(newUser, 'Account created and login successful');
        //     res.status(createdResponse.statusCode).json(createdResponse.toJSON());
        //     return;
        // }

        // if (user.password !== password) {
        //     const unauthorizedResponse = new UnauthorizedResponse('Invalid email or password.');
        //     res.status(unauthorizedResponse.statusCode).json(unauthorizedResponse.toJSON());
        //     return;
        // }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        const uid = userCredential.user.uid;
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            throw new Error('User document not found');
        }

        const userData = userDoc.data();
        const data = {
            user: userData,
            token
        }

        const successResponse = new SuccessResponse(data, 'Login successful');
        res.status(successResponse.statusCode).json(successResponse.toJSON());
        return;

    } catch (error) {
        const internalServerErrorResponse = new InternalServerErrorResponse(error);
        res.status(internalServerErrorResponse.statusCode).json(internalServerErrorResponse.toJSON());
        return;
    }
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
    console.log('Register user request received:', req.body);
    const { username, email, password } = req.body;
    // Basic validation
    // if (!username || !email || !password) {
    //     const badRequestResponse = new BadRequestResponse('username, email and password required');
    //     res.status(badRequestResponse.statusCode).json(badRequestResponse.toJSON());
    //     return;
    // }
    console.log('Registering user with Email:', email, 'Name:', username);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
            displayName: username
        });
        const token = await userCredential.user.getIdToken(true);
        const uid = userCredential.user.uid;
        // const usersCollection = collection(db, 'users');
        // const q1 = query(usersCollection, where("email", "==", email));
        // const querySnapshot1 = await getDocs(q1);
        // if (!querySnapshot1.empty) {
        //     const existingUser = querySnapshot1.docs[0].data();
        //     const conflictResponse = new BadRequestResponse(`Email ${existingUser.email} already exists`);
        //     res.status(conflictResponse.statusCode).json(conflictResponse.toJSON());
        //     return;
        // }

        const newUser = {
            uid,
            email,
            displayName: username,
            waterTarget: '8',
            stepsTarget: '10000',
            createdAt: new Date().toISOString(),
            photoURL: ''
        };
        const userDocRef = doc(db, 'users', uid); // uid from Firebase Auth
        await setDoc(userDocRef, newUser);

        const data = {
            newUser: userCredential.user,
            token
        }
        console.log('User registered successfully:', newUser);
        const createdResponse = new SuccessResponse(data, 'Account created and login successful');
        res.status(createdResponse.statusCode).json(createdResponse.toJSON());
        return;

    } catch (error) {
        const internalServerErrorResponse = new InternalServerErrorResponse(error);
        res.status(internalServerErrorResponse.statusCode).json(internalServerErrorResponse.toJSON());
        return;
    }
});

router.post('/upload-profile-image', verifyToken, upload.single('profileImage'),
    async (req: Request, res: Response): Promise<void> => {
        console.log('Upload profile image request received:', req.body);
        try {
            if (!req.file) {
                const badRequestResponse = new BadRequestResponse('No image file provided');
                res.status(badRequestResponse.statusCode).json(badRequestResponse.toJSON());
                return;
            }

            const uid = req.user?.uid;
            if (!uid) {
                const unauthorizedResponse = new UnauthorizedResponse('User not authenticated');
                res.status(unauthorizedResponse.statusCode).json(unauthorizedResponse.toJSON());
                return;
            }

            // Upload image to Firebase Storage
            const storage = getStorage();
            const imageRef = ref(storage, `profile-images/${uid}`);
            const metadata = {
                contentType: 'image/jpeg',
            };

            await uploadBytes(imageRef, req.file.buffer, metadata);
            const photoURL = await getDownloadURL(imageRef);

            // Update user profile using Firebase Admin SDK
            const updatedUser = await admin.auth().updateUser(uid, {
                photoURL: photoURL
            });
            const data = {
                uid: updatedUser.uid,
                photoURL: updatedUser.photoURL,
                displayName: updatedUser.displayName,
                email: updatedUser.email
            }

            const userDocRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                throw new Error('User document not found');
            }

            // Update the waterTarget field
            await updateDoc(userDocRef, {
                photoURL: photoURL
            });
            const successResponse = new SuccessResponse(data, 'Profile photo updated successfully');
            res.status(successResponse.statusCode).json(successResponse.toJSON());
            return;

        } catch (error) {
            const internalServerErrorResponse = new InternalServerErrorResponse(error);
            res.status(internalServerErrorResponse.statusCode).json(internalServerErrorResponse.toJSON());
            return;
        }
    }
);

router.post('/logout', verifyToken,
    async (req: Request, res: Response): Promise<void> => {
        console.log('Logout request received:');
        try {
            const uid = req.user?.uid;

            if (uid) {
                // Revoke refresh tokens (logs out from ALL devices)
                await admin.auth().revokeRefreshTokens(uid);
            }
            const successResponse = new SuccessResponse('User logged out successfully');
            res.status(successResponse.statusCode).json(successResponse.toJSON());
            console.log('User logged out successfully:', uid);
            return;
        } catch (error) {
            console.error('Logout error:', error);
            const internalServerErrorResponse = new InternalServerErrorResponse(error);
            res.status(internalServerErrorResponse.statusCode).json(internalServerErrorResponse.toJSON());
            return;
        }
    }
);

export default router;