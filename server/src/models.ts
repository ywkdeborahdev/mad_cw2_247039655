export interface User {
    id: string;
    name: string;
    email: string;
    password?: string; // Optional property
}

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