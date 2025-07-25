# WellnessApp

A cross-platform wellness tracking app built with React Native (Expo), TypeScript, and a Node.js/Express backend, with a leverage of pre-trained model loaded using python transformer library.. The app helps users track water intake, steps, emotions, and daily photos, with analytics and profile management features.

## Features

- User registration and authentication (with Firebase)
- Track daily water intake and step count
- Upload and analyze daily photos for emotion detection
- View analytics (charts) for habits and emotions
- Profile management (update photo, targets, biometric lock)
- Responsive UI with React Native Paper
- Backend API with Express and Firebase Firestore

## Project Structure

```
.
WellnessApp/
├── App.tsx
├── app.json
├── assets/
├── components/
├── goEmotion/
│   ├── emotion_service.py
├── modelsFrontend.ts
├── screens/
├── server/
│   ├── node_modules/
│   ├── package.json
│   ├── src/
│   │   ├── app.ts
│   │   ├── routes/
│   │   └── ...
│   └── tsconfig.json
├── theme/
├── utils/
├── .env
├── .gitignore
├── babel.config.js
├── index.ts
├── package.json
├── tsconfig.json
└── ios/
```

## Getting Started

### Prerequisites

- Node.js & npm
- Expo CLI (`npm install -g expo-cli`)
- Firebase project (for Auth & Firestore)
- (Optional) Xcode/Android Studio for native builds

### Setup

1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd WellnessApp
   ```

2. **Install dependencies:**
   ```sh
   npm install
   cd server
   npm install
   cd ..
   ```

3. **Configure environment variables:**
   - Create a `.env` file in the root for backend url
   - Create a `.env` file in the server/ and add your Firebase and backend settings, or use the default

4. **Start the backend server:**
   ```sh
   cd server
   npm run dev
   ```

5. **Start the python AI model server:**
    ```sh
    python3 goEmotion/emotion_service.py
    ```

6. **Start the Expo app:**
   ```sh
   npx expo start -c
   ```
- once started, update the IP for the BACKEND_URL value in the .env file at root 

## Scripts

- `npx expo start` — Start Expo development server
- press `a` for android or press `i` for iOS


## Backend API

The backend is an Express server with routes for user and habit management. See [server/src/routes/userRoutes.ts](server/src/routes/userRoutes.ts) and [server/src/routes/habitRoutes.ts](server/src/routes/habitRoutes.ts).

## License

MIT

---