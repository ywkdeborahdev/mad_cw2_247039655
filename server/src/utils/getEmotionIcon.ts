export const getEmotionIcon = (emotion: string): string => {
    const emotionIcons: { [key: string]: string } = {
        // Positive emotions
        'joy': '😊',
        'happiness': '😄',
        'excitement': '🤩',
        'love': '❤️',
        'gratitude': '🙏',
        'admiration': '😍',
        'amusement': '😂',
        'approval': '👍',
        'caring': '🤗',
        'optimism': '🌟',
        'pride': '😌',
        'relief': '😌',

        // Negative emotions
        'anger': '😠',
        'sadness': '😢',
        'fear': '😨',
        'disgust': '🤢',
        'disappointment': '😞',
        'embarrassment': '😳',
        'grief': '😭',
        'nervousness': '😰',
        'annoyance': '😤',
        'disapproval': '👎',
        'remorse': '😔',

        // Neutral/Other emotions
        'surprise': '😲',
        'curiosity': '🤔',
        'confusion': '😕',
        'realization': '💡',
        'desire': '😍',
        'neutral': '😐'
    };

    return emotionIcons[emotion.toLowerCase()] || '😐';
};
