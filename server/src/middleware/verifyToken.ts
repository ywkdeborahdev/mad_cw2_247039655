import { UnauthorizedResponse } from '../utils/HttpResponse';
import admin from 'firebase-admin';
// middleware/verifyToken.js
import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from '../models'; // Adjust the import path as necessary

interface AuthenticatedRequest extends Request {
    user?: DecodedIdToken;
}

const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {


    try {
        console.log('in verify token');
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const unauthorizedResponse = new UnauthorizedResponse('No token provided');
            res.status(unauthorizedResponse.statusCode).json(unauthorizedResponse.toJSON());
            return;

        }
        const idToken = authHeader.split('Bearer ')[1];
        // Verify the ID token using Firebase Admin SDK
        const decodedToken: DecodedIdToken = await admin
            .auth()
            .verifyIdToken(idToken);

        // Extract user information from decoded token
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            email_verified: decodedToken.email_verified,
            name: decodedToken.name,
            picture: decodedToken.picture,
            iss: decodedToken.iss,
            aud: decodedToken.aud,
            auth_time: decodedToken.auth_time,
            user_id: decodedToken.user_id,
            sub: decodedToken.sub,
            iat: decodedToken.iat,
            exp: decodedToken.exp,
            firebase: decodedToken.firebase,
        };

        next(); // Continue to the next middleware/route handler
    } catch (error: any) {
        console.log('unauthorised');
        const unauthorizedResponse = new UnauthorizedResponse(`Token verification error: ${error.message}`);
        res.status(unauthorizedResponse.statusCode).json(unauthorizedResponse.toJSON());
        return;
    }

};

export default verifyToken;

