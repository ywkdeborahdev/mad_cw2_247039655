import app from './app'; // Import the app instance
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

const port = process.env.PORT || 3001;

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}