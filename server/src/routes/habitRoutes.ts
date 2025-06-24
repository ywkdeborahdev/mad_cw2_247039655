import express, { Request, Response } from 'express';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
const { db } = require('../../firebaseBackend');
import verifyToken from '../middleware/verifyToken'; // Your auth middleware
import { SuccessResponse, InternalServerErrorResponse, BadRequestResponse } from '../utils/HttpResponse';
import admin from 'firebase-admin';
import multer from 'multer';
import sharp from 'sharp';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

const router = express.Router();
const adminAuth = admin.auth();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for processing
    }
});

// interface WaterRecord {
//     date: string;
//     count: number;
// }

interface WaterDocument {
    uid: string;
    records: { [date: string]: number };
}

interface StepsDocument {
    uid: string;
    records: { [date: string]: number };
}

interface EmotionAnalysis {
    emotions: Array<{ label: string; score: number }>;
    dominant_emotion: string;
    confidence: number;
    caption: string;
}

interface PhotoDetail {
    photoURL: string;
    photoLocation: string;
    photoCaption: string;
    emotionAnalysis?: string;
}

interface DailyPhotoDocument {
    uid: string;
    photos: { [date: string]: PhotoDetail };
}

// Add emotion analysis function
const analyzeEmotion = async (caption: string): Promise<EmotionAnalysis | null> => {
    try {
        if (!caption || caption.trim().length === 0) {
            return null;
        }


        console.log('Calling emotion service at:', 'http://127.0.0.1:5001/analyze-emotion');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`http://${process.env.PYTHON_BACKEND}/analyze-emotion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ caption: caption.trim() })
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Emotion analysis service error:', response.status, errorText);
            return null;
        }

        const emotionData = await response.json();
        console.log('Emotion analysis successful:', emotionData);
        return emotionData;

    } catch (error) {
        console.error('Error calling emotion analysis service:', error);
        return null;
    }
};

// POST /habit/water/add - Add water intake
router.post('/water/add', verifyToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const userRecord = await adminAuth.getUser(uid);
        console.log(userRecord);

        const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const waterDocRef = doc(db, 'water', uid);

        // Get current document
        const waterDoc = await getDoc(waterDocRef);

        if (waterDoc.exists()) {
            // Document exists, check if today's record exists
            const data = waterDoc.data() as WaterDocument;
            const records = data.records || {};

            if (records[todayDate]) {
                // Today's record exists, increment count
                const newCount = records[todayDate] + 1;

                await updateDoc(waterDocRef, {
                    [`records.${todayDate}`]: newCount
                });


                const data = {
                    uid: uid,
                    records: {
                        [todayDate]: newCount
                    }
                }
                const successResponse = new SuccessResponse(data, 'Water count updated successfully');
                res.status(successResponse.statusCode).json(successResponse.toJSON());
                return;
            } else {
                // Today's record doesn't exist, create it
                await updateDoc(waterDocRef, {
                    [`records.${todayDate}`]: 1
                });

                const data = {
                    uid: uid,
                    records: {
                        [todayDate]: 1
                    }
                }

                const successResponse = new SuccessResponse(data, 'New daily water record created');
                res.status(successResponse.statusCode).json(successResponse.toJSON());
                return;
            }
        } else {
            // Document doesn't exist, create it with today's record
            const newWaterDoc: WaterDocument = {
                uid: uid,
                records: {
                    [todayDate]: 1
                }
            };

            await setDoc(waterDocRef, newWaterDoc);

            const successResponse = new SuccessResponse(newWaterDoc, 'Water tracking initialized');
            res.status(successResponse.statusCode).json(successResponse.toJSON());
            return;
        }

    } catch (error) {
        console.error('Error adding water intake:', error);
        const internalServerErrorResponse = new InternalServerErrorResponse(error);
        res.status(internalServerErrorResponse.statusCode).json(internalServerErrorResponse.toJSON());
        return;
    }
});

// GET /habit/water/today - Get today's water intake
router.get('/water/today', verifyToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

        const waterDocRef = doc(db, 'water', uid);
        const waterDoc = await getDoc(waterDocRef);

        if (waterDoc.exists()) {
            const docData = waterDoc.data() as WaterDocument;
            const todayCount = docData.records?.[todayDate];

            const successResponse = new SuccessResponse(todayCount);
            res.status(successResponse.statusCode).json(successResponse.toJSON());
            return;
        } else {
            const successResponse = new SuccessResponse(0);
            res.status(successResponse.statusCode).json(successResponse.toJSON());
            return;
        }

    } catch (error) {
        console.error('Error adding water intake:', error);
        const internalServerErrorResponse = new InternalServerErrorResponse(error);
        res.status(internalServerErrorResponse.statusCode).json(internalServerErrorResponse.toJSON());
        return;
    }
});

// // GET /water/history - Get water intake history
// router.get('/history', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const uid = req.user?.uid;
//         const days = parseInt(req.query.days as string) || 7; // Default to last 7 days

//         if (!uid) {
//             return res.status(401).json({
//                 success: false,
//                 error: 'User not authenticated'
//             });
//         }

//         const waterDocRef = doc(db, 'water', uid);
//         const waterDoc = await getDoc(waterDocRef);

//         if (waterDoc.exists()) {
//             const data = waterDoc.data() as WaterDocument;
//             const records = data.records || {};

//             // Get last N days
//             const history = Object.values(records)
//                 .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
//                 .slice(0, days);

//             return res.json({
//                 success: true,
//                 data: {
//                     uid: uid,
//                     history: history,
//                     totalDays: history.length
//                 }
//             });
//         } else {
//             return res.json({
//                 success: true,
//                 data: {
//                     uid: uid,
//                     history: [],
//                     totalDays: 0
//                 }
//             });
//         }

//     } catch (error) {
//         console.error('Error fetching water history:', error);
//         return res.status(500).json({
//             success: false,
//             error: 'Internal server error'
//         });
//     }
// });

// // DELETE /water/reset-today - Reset today's water count
// router.delete('/reset-today', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const uid = req.user?.uid;

//         if (!uid) {
//             return res.status(401).json({
//                 success: false,
//                 error: 'User not authenticated'
//             });
//         }

//         const todayDate = new Date().toISOString().split('T')[0];
//         const waterDocRef = doc(db, 'water', uid);

//         await updateDoc(waterDocRef, {
//             [`records.${todayDate}.count`]: 0
//         });

//         return res.json({
//             success: true,
//             message: 'Today\'s water count reset successfully',
//             data: {
//                 date: todayDate,
//                 count: 0,
//                 uid: uid
//             }
//         });

//     } catch (error) {
//         console.error('Error resetting water count:', error);
//         return res.status(500).json({
//             success: false,
//             error: 'Internal server error'
//         });
//     }
// });

router.put('/water/settings', verifyToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { waterTarget } = req.body;
        console.log(`received request for water settings from uid: ${uid}, waterTarget: ${waterTarget}`)
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            throw new Error('User document not found');
        }

        // Update the waterTarget field
        await updateDoc(userDocRef, {
            waterTarget: waterTarget
        });

        console.log('Water target updated successfully');
        const successResponse = new SuccessResponse(updateDoc);
        res.status(successResponse.statusCode).json(successResponse.toJSON());
        return;
    } catch (error) {
        console.error('Error updating water settings:', error);
        const internalServerErrorResponse = new InternalServerErrorResponse(error);
        res.status(internalServerErrorResponse.statusCode).json(internalServerErrorResponse.toJSON());
        return;
    }
});


// POST /api/habit/steps/add - Add water intake
router.post('/steps/add', verifyToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const stepCount = req.body.stepCount; // Assuming step count is sent in the request body
        console.log(`received request for steps settings from uid: ${uid}, stepCount: ${stepCount}`)
        const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const stepsDocRef = doc(db, 'steps', uid);

        // Get current document
        const stepsDoc = await getDoc(stepsDocRef);

        if (stepsDoc.exists()) {
            // Document exists, check if today's record exists
            const data = stepsDoc.data() as StepsDocument;
            const records = data.records || {};

            if (records[todayDate]) {
                await updateDoc(stepsDocRef, {
                    [`records.${todayDate}`]: stepCount
                });
            } else {
                // Today's record doesn't exist, create it
                await updateDoc(stepsDocRef, {
                    [`records.${todayDate}`]: stepCount
                });
            }
            const responseData = {
                uid: uid,
                records: {
                    [todayDate]: stepCount
                }
            }
            const successResponse = new SuccessResponse(responseData, 'Step count updated successfully');
            res.status(successResponse.statusCode).json(successResponse.toJSON());
            return;
        } else {
            // Document doesn't exist, create it with today's record
            const newStepsDoc: StepsDocument = {
                uid: uid,
                records: {
                    [todayDate]: stepCount
                }
            };

            await setDoc(stepsDocRef, newStepsDoc);

            const successResponse = new SuccessResponse(newStepsDoc, 'Step count initialized');
            res.status(successResponse.statusCode).json(successResponse.toJSON());
            return;
        }

    } catch (error) {
        console.error('Error adding water intake:', error);
        const internalServerErrorResponse = new InternalServerErrorResponse(error);
        res.status(internalServerErrorResponse.statusCode).json(internalServerErrorResponse.toJSON());
        return;
    }
});

router.put('/steps/settings', verifyToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { stepsTarget } = req.body;
        console.log('in steps setting');
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            throw new Error('User document not found');
        }

        // Update the steps target field
        await updateDoc(userDocRef, {
            stepsTarget: stepsTarget
        });

        console.log('Steps target updated successfully');

        const successResponse = new SuccessResponse(updateDoc);
        res.status(successResponse.statusCode).json(successResponse.toJSON());
        return;
    } catch (error) {
        console.error('Error updating steps settings:', error);
        const internalServerErrorResponse = new InternalServerErrorResponse(error);
        res.status(internalServerErrorResponse.statusCode).json(internalServerErrorResponse.toJSON());
        return;
    }
});

router.get('/settings', verifyToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            throw new Error('User document not found');
        }

        const userData = userDoc.data();


        const data = {
            waterTarget: userData.waterTarget,
            stepsTarget: userData.stepsTarget
        }

        console.log('Successfully getting user settings', data);

        const successResponse = new SuccessResponse(data);
        res.status(successResponse.statusCode).json(successResponse.toJSON());
        return;
    } catch (error) {
        console.error('Error getting user settings:', error);
        const internalServerErrorResponse = new InternalServerErrorResponse(error);
        res.status(internalServerErrorResponse.statusCode).json(internalServerErrorResponse.toJSON());
        return;
    }
});



router.post('/photo-of-the-day',
    verifyToken,
    upload.single('photoOfTheDay'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.file) {
                const badRequestResponse = new BadRequestResponse('No photo file provided');
                res.status(badRequestResponse.statusCode).json(badRequestResponse.toJSON());
                return;
            }

            const uid = req.user?.uid;
            const { caption, location } = req.body;

            // Get today's date in required formats
            const today = new Date();
            const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            // const dateKey = '2025-06-06'
            const dateFileName = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD format

            // Process image: resize to square, compress to <1MB, convert to JPEG
            const processedImageBuffer = await sharp(req.file.buffer)
                .resize(800, 800, {
                    fit: 'cover', // Crop to square
                    position: 'center'
                })
                .jpeg({
                    quality: 85, // Start with good quality
                    progressive: true
                })
                .toBuffer();

            // Check if image is under 1MB, if not, reduce quality
            let finalImageBuffer = processedImageBuffer;
            let quality = 85;

            while (finalImageBuffer.length > 1024 * 1024 && quality > 20) {
                quality -= 10;
                finalImageBuffer = await sharp(req.file.buffer)
                    .resize(800, 800, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .jpeg({
                        quality: quality,
                        progressive: true
                    })
                    .toBuffer();
            }

            console.log(`Final image size: ${(finalImageBuffer.length / 1024).toFixed(2)}KB at quality ${quality}`);

            // Upload to Firebase Storage
            const storage = getStorage();
            const fileName = `${uid}${dateFileName}.jpeg`;
            const imageRef = ref(storage, `daily-photos/${fileName}`);

            const metadata = {
                contentType: 'image/jpeg',
                customMetadata: {
                    uploadedBy: uid || '',
                    uploadedAt: new Date().toISOString(),
                    originalName: req.file.originalname
                }
            };

            await uploadBytes(imageRef, finalImageBuffer, metadata);
            const photoURL = await getDownloadURL(imageRef);
            // const photoURL = "https://firebasestorage.googleapis.com/v0/b/madcw2-wellness-app.firebasestorage.app/o/daily-photos%2FvBRkMg3kJ3S94buwrHvx2lJfBx1320250620.jpeg?alt=media&token=f52e91ea-f229-4bf3-9571-89310cf149ab"


            // Analyze emotion from caption
            let emotionAnalysis: EmotionAnalysis | null = null;
            if (caption && caption.trim().length > 0) {
                console.log('Analyzing emotion for caption:', caption);
                emotionAnalysis = await analyzeEmotion(caption);
                console.log('Emotion analysis result:', emotionAnalysis);
            }

            // Update Firestore dailyPhoto collection
            const dailyPhotoDocRef = doc(db, 'dailyPhoto', uid!);
            const dailyPhotoDoc = await getDoc(dailyPhotoDocRef);

            const photoDetail: PhotoDetail = {
                photoURL: photoURL,
                photoLocation: location || '',
                photoCaption: caption || '',
                emotionAnalysis: emotionAnalysis?.dominant_emotion || undefined
            };

            if (dailyPhotoDoc.exists()) {
                // Document exists, update the photos field
                const existingData = dailyPhotoDoc.data() as DailyPhotoDocument;
                const updatedPhotos = {
                    ...existingData.photos,
                    [dateKey]: photoDetail // This will overwrite if same date
                };

                await updateDoc(dailyPhotoDocRef, {
                    photos: updatedPhotos
                });
            } else {
                // Document doesn't exist, create new one
                const newDailyPhotoDoc: DailyPhotoDocument = {
                    uid: uid!,
                    photos: {
                        [dateKey]: photoDetail
                    }
                };

                await setDoc(dailyPhotoDocRef, newDailyPhotoDoc);
            }

            const data = {
                photoURL: photoURL,
                photoLocation: location,
                photoCaption: caption,
                date: dateKey,
                fileName: fileName,
                emotionAnalysis: emotionAnalysis?.dominant_emotion || undefined
            };

            const successResponse = new SuccessResponse(data);
            res.status(successResponse.statusCode).json(successResponse.toJSON());
            return;

        } catch (error) {
            console.error(`Error  updating photo of the day for user:${req.user?.uid || ''}, error: ${error}`);
            const internalServerErrorResponse = new InternalServerErrorResponse(error);
            res.status(internalServerErrorResponse.statusCode).json(internalServerErrorResponse.toJSON());
            return;
        }
    }
);

// GET /habit/photo-of-the-day/today - Get today's photo
router.get('/photo-of-the-day/today',
    verifyToken,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const uid = req.user?.uid;

            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const dailyPhotoDocRef = doc(db, 'dailyPhoto', uid!);
            const dailyPhotoDoc = await getDoc(dailyPhotoDocRef);

            if (dailyPhotoDoc.exists()) {
                const data = dailyPhotoDoc.data() as DailyPhotoDocument;
                const todayPhoto = data.photos?.[today];
                const responseData = {
                    ...todayPhoto,
                    date: today
                }

                if (todayPhoto) {
                    const successResponse = new SuccessResponse(responseData);
                    res.status(successResponse.statusCode).json(successResponse.toJSON());
                    return;
                } else {
                    const successResponse = new SuccessResponse();
                    res.status(successResponse.statusCode).json(successResponse.toJSON());
                    return;
                }
            } else {
                const successResponse = new SuccessResponse();
                res.status(successResponse.statusCode).json(successResponse.toJSON());
                return;
            }

        } catch (error) {
            console.error(`Error  updating photo of the day for user:${req.user?.uid || ''}, error: ${error}`);
            const internalServerErrorResponse = new InternalServerErrorResponse(error);
            res.status(internalServerErrorResponse.statusCode).json(internalServerErrorResponse.toJSON());
            return;
        }
    }
);

// // GET /habit/photo-of-the-day/history - Get photo history
router.get('/photo-of-the-day/history',
    verifyToken,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const uid = req.user?.uid;
            const limit = parseInt(req.query.limit as string) || 10;
            const startAfter = req.query.startAfter as string;

            console.log(`Fetching photo history for user: ${uid}, limit: ${limit}, startAfter: ${startAfter}`);

            const dailyPhotoDocRef = doc(db, 'dailyPhoto', uid);
            const dailyPhotoDoc = await getDoc(dailyPhotoDocRef);

            if (!dailyPhotoDoc.exists()) {
                const successResponse = new SuccessResponse({ photos: [] });
                res.status(successResponse.statusCode).json(successResponse.toJSON());
                return;
            }

            const data = dailyPhotoDoc.data() as DailyPhotoDocument;
            const photos = data.photos || {};

            // Convert to array and add date field
            let photoArray = Object.entries(photos)
                .map(([date, photoDetail]) => ({
                    date,
                    ...photoDetail
                }))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // Apply pagination
            if (startAfter) {
                const startIndex = photoArray.findIndex(photo => photo.date === startAfter);
                if (startIndex !== -1) {
                    photoArray = photoArray.slice(startIndex + 1);
                } else {
                    photoArray = [];
                }
            }

            // Limit results
            const paginatedPhotos = photoArray.slice(0, limit);

            console.log(`Returning ${paginatedPhotos.length} photos`);
            const responseData = {
                photos: paginatedPhotos,
                total: paginatedPhotos.length,
                hasMore: photoArray.length > limit,
                nextStartAfter: paginatedPhotos.length > 0 ? paginatedPhotos[paginatedPhotos.length - 1].date : null
            }
            const successResponse = new SuccessResponse(responseData);
            res.status(successResponse.statusCode).json(successResponse.toJSON());
            return;

        } catch (error) {
            console.error(`Error getting photo history:${req.user?.uid || ''}, error: ${error}`);
            const internalServerErrorResponse = new InternalServerErrorResponse(error);
            res.status(internalServerErrorResponse.statusCode).json(internalServerErrorResponse.toJSON());
            return;
        }
    }
);

router.get('/analytics/:range', verifyToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const range = req.params.range; // 'weekly' or 'monthly'
        const offset = parseInt(req.query.offset as string) || 0;

        const now = new Date();
        let startDate, endDate;
        let displayRange = '';
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        if (range === 'weekly') {
            const currentDay = now.getDay(); // 0=Sun, 6=Sat
            // To make Monday the start of the week
            const dayOffset = currentDay === 0 ? -6 : 1 - currentDay;

            startDate = new Date(now.setDate(now.getDate() + dayOffset + (offset * 7)));
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);

            if (offset === 0) {
                displayRange = 'This Week';
            } else if (offset === -1) {
                displayRange = 'Last Week';
            } else {
                displayRange = `${monthNames[startDate.getMonth()]} ${startDate.getDate()} - ${monthNames[endDate.getMonth()]} ${endDate.getDate()}`;
            }
        } else { // monthly
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();

            startDate = new Date(currentYear, currentMonth + offset, 1);
            endDate = new Date(currentYear, currentMonth + 1 + offset, 0);

            if (offset === 0) {
                displayRange = 'This Month';
            } else if (offset === -1) {
                displayRange = 'Last Month';
            } else {
                displayRange = `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;
            }
        }

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // Generate all dates and labels for the range
        const dateArray: string[] = [];
        const labels: string[] = [];
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateString = d.toISOString().split('T')[0];
            dateArray.push(dateString);

            if (range === 'weekly') {
                labels.push(weekdays[d.getDay()]);
            } else {
                // For monthly view, show labels for days divisible by 5 (1, 6, 11...)
                labels.push((d.getDate() - 1) % 5 === 0 ? d.getDate().toString() : '');
            }
        }

        // --- Data Fetching Logic (remains the same) ---
        const waterDocRef = doc(db, 'water', uid);
        const waterDoc = await getDoc(waterDocRef);
        const waterRecords = waterDoc.exists() ? (waterDoc.data() as any).records || {} : {};
        const waterDataPoints = dateArray.map(date => waterRecords[date] || 0);

        const stepsDocRef = doc(db, 'steps', uid);
        const stepsDoc = await getDoc(stepsDocRef);
        const stepsRecords = stepsDoc.exists() ? (stepsDoc.data() as any).records || {} : {};
        const stepDataPoints = dateArray.map(date => stepsRecords[date] || 0);

        const dailyPhotoDocRef = doc(db, 'dailyPhoto', uid);
        const dailyPhotoDoc = await getDoc(dailyPhotoDocRef);
        const photoRecords = dailyPhotoDoc.exists() ? (dailyPhotoDoc.data() as any).photos || {} : {};

        const emotionCounts: { [emotion: string]: number } = {};
        dateArray.forEach(date => {
            const photoDetail = photoRecords[date];
            if (photoDetail?.emotionAnalysis) {
                const emotion = photoDetail.emotionAnalysis;
                emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
            }
        });

        const emotionData = Object.entries(emotionCounts).map(([emotion, count]) => ({
            name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
            count
        }));

        const analyticsData = {
            displayRange, // Add the display string to the response
            waterData: { labels, datasets: [{ data: waterDataPoints }] },
            stepData: { labels, datasets: [{ data: stepDataPoints }] },
            emotionData,
        };

        const successResponse = new SuccessResponse(analyticsData);
        res.status(successResponse.statusCode).json(successResponse.toJSON());

    } catch (error) {
        console.error(`Error fetching analytics data for user: ${req.user?.uid || ''}, error: ${error}`);
        const internalServerErrorResponse = new InternalServerErrorResponse(error);
        res.status(internalServerErrorResponse.statusCode).json(internalServerErrorResponse.toJSON());
    }
});





export default router;
