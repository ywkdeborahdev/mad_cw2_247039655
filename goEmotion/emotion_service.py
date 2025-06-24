# emotion_service.py
from flask import Flask, request, jsonify
from transformers import pipeline
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Load GoEmotions model
try:
    emotion_classifier = pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
        return_all_scores=True
    )
    print("GoEmotions model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
    emotion_classifier = None

@app.route('/analyze-emotion', methods=['POST'])
def analyze_emotion():
    try:
        print('inside analyse_emotion')
        data = request.json
        caption = data.get('caption', '')
        
        if not caption:
            return jsonify({'error': 'No caption provided'}), 400
        
        if not emotion_classifier:
            return jsonify({'error': 'Model not loaded'}), 500
        
        # Analyze emotion
        results = emotion_classifier(caption)
        
        # Sort by score and get top emotions
        sorted_emotions = sorted(results[0], key=lambda x: x['score'], reverse=True)
        
        # Get top 3 emotions
        top_emotions = sorted_emotions[:3]
        dominant_emotion = sorted_emotions[0]
        
        response = {
            'caption': caption,
            'emotions': [
                {
                    'label': emotion['label'],
                    'score': round(emotion['score'], 3)
                } for emotion in top_emotions
            ],
            'dominant_emotion': dominant_emotion['label'],
            'confidence': round(dominant_emotion['score'], 3),
            'all_emotions': [
                {
                    'label': emotion['label'],
                    'score': round(emotion['score'], 3)
                } for emotion in sorted_emotions
            ]
        }
        
        return jsonify(response)
        
    except Exception as e:
        logging.error(f"Error analyzing emotion: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'model_loaded': emotion_classifier is not None})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
