module.exports = {
    presets: ['babel-preset-expo'],
    plugins: [
        [
            'module:react-native-dotenv',
            {
                moduleName: '@env',
                path: '.env',
                allowUndefined: true,
            },
        ],
        'react-native-reanimated/plugin', // <-- Add this line here
    ],
};
