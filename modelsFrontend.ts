export interface DecodedIdToken {
    uid: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    iss: string;
    aud: string;
    auth_time: number;
    user_id?: string;
    sub: string;
    iat: number;
    exp: number;
    firebase: {
        identities: {
            [key: string]: any;
        };
        sign_in_provider: string;
    };
}

export interface UserCredential {
    uid: string;
    email: string;
    displayName: string;
    createdAt?: string;
    photoURL?: string;
}


export interface User {
    uid: string;
    email: string;
    displayName: string;
    createdAt?: string;
    photoURL?: string;
    waterTarget: string;
    stepsTarget: string;
}