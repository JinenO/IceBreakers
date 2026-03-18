/* frontend/js/data.js */

export const MAIN_MENU_DATA = [
    { id: 'c-needs', icon: 'needs.png', label: 'NEEDS', sub: 'Water / Food' },
    { id: 'c-chat', icon: 'chat-ai.png', label: 'CHAT', sub: 'Yes / No' },
    { id: 'c-body', icon: 'body.png', label: 'BODY', sub: 'Comfort' },
    { id: 'c-media', icon: 'media.png', label: 'MEDIA', sub: 'Fun' },
    { id: 'c-kb', icon: 'keyboard.png', label: 'KEYBOARD', sub: 'Type' }
];

export const SUB_MENU_DATA = {
    'c-needs': {
        title: 'NEEDS',
        items: [
            { id: 'water', label: 'WATER', sub: 'Thirsty', icon: 'water.png' },
            { id: 'food', label: 'FOOD', sub: 'Hungry', icon: 'food.png' },
            { id: 'toilet', label: 'TOILET', sub: 'Bathroom', icon: 'toilet.png' },
            { id: 'meds', label: 'MEDS', sub: 'Pain / Pills', icon: 'medicine.png' },
            { id: 'suction', label: 'SUCTION', sub: 'Clear throat', icon: 'suction.png' },
            { id: 'back', label: 'BACK', sub: 'Main Menu', icon: 'back.png' }
        ]
    },
    'c-body': {
        title: 'BODY',
        items: [
            { id: 'roll', label: 'ROLL OVER', sub: 'Turn body', icon: 'roll.png' },
            { id: 'head', label: 'HEAD UP', sub: 'Adjust Pillow', icon: 'head.png' },
            { id: 'legs', label: 'LEGS', sub: 'Move legs', icon: 'leg.png' },
            { id: 'temp', label: 'TEMP', sub: 'Hot / Cold', icon: 'temp.png' },
            { id: 'itch', label: 'ITCHY', sub: 'Scratch me', icon: 'itch.png' },
            { id: 'back', label: 'BACK', sub: 'Main Menu', icon: 'back.png' }
        ]
    },
    'c-media': {
        title: 'MEDIA ENTERTAINMENT',
        items: [
            { id: 'local', label: 'LOCAL', sub: 'Local Movies', icon: 'tv.png' },
            { id: 'youtube', label: 'YOUTUBE', sub: 'Online', icon: 'youtube.png' },
            { id: 'music', label: 'MUSIC', sub: 'Local Playlist', icon: 'music.png' },
            { id: 'audiobook', label: 'BOOK', sub: 'Audiobook', icon: 'book.png' },
            { id: 'photos', label: 'PHOTOS', sub: 'Family Album', icon: 'photos.png' },
            { id: 'back', label: 'BACK', sub: 'Main Menu', icon: 'back.png' }
        ]
    },
    'c-chat': {
        title: 'QUICK CHAT',
        items: [
            { id: 'yes', label: 'YES', sub: 'Confirm', icon: 'chat-ai.png' },
            { id: 'no', label: 'NO', sub: 'Decline', icon: 'chat-ai.png' },
            { id: 'thanks', label: 'THANKS', sub: 'Thank you', icon: 'chat-ai.png' },
            { id: 'hello', label: 'HELLO', sub: 'Greeting', icon: 'chat-ai.png' },
            { id: 'love', label: 'LOVE YOU', sub: 'Express', icon: 'chat-ai.png' },
            { id: 'back', label: 'BACK', sub: 'Main Menu', icon: 'chat-ai.png' }
        ]
    },
    'c-kb': {
        title: 'KEYBOARD',
        items: [
            { id: 'predict', label: 'PREDICT', sub: 'Smart word', icon: 'keyboard.png' },
            { id: 'clear', label: 'CLEAR', sub: 'Delete', icon: 'keyboard.png' },
            { id: 'speak', label: 'SPEAK', sub: 'TTS', icon: 'keyboard.png' },
            { id: 'back', label: 'BACK', sub: 'Main Menu', icon: 'keyboard.png' }
        ]
    }
};

export const KEYBOARD_DATA = {
    groups: [
        { id: 'group-1', label: 'A B C D E', letters: ['A', 'B', 'C', 'D', 'E'] },
        { id: 'group-2', label: 'F G H I J', letters: ['F', 'G', 'H', 'I', 'J'] },
        { id: 'group-3', label: 'K L M N O', letters: ['K', 'L', 'M', 'N', 'O'] },
        { id: 'group-4', label: 'P Q R S T', letters: ['P', 'Q', 'R', 'S', 'T'] },
        { id: 'group-5', label: 'U - Z', letters: ['U', 'V', 'W', 'X', 'Y', 'Z'] }
    ]
};

// Secondary submenu (hidden by default, activated by backend signal)
export const BODY_DETAILS_DATA = {
    'temp': {
        title: 'TEMPERATURE',
        items: [
            { id: 'too-hot', label: 'TOO HOT', sub: 'Cool down', icon: 'hot.png' },
            { id: 'too-cold', label: 'TOO COLD', sub: 'Warm up', icon: 'cold.png' },
            { id: 'just-right', label: 'BETTER', sub: 'Thank you', icon: 'yes.png' },
            { id: 'back', label: 'BACK', sub: 'Body Menu', icon: 'back.png' }
        ]
    },
    'itch': {
        title: 'WHERE ITCHES?',
        items: [
            { id: 'head', label: 'HEAD', sub: 'Face / Scalp', icon: 'headbody.png' },
            { id: 'back', label: 'BACK', sub: 'Upper / Lower', icon: 'backbody.png' },
            { id: 'arm', label: 'ARM', sub: 'L / R Arm', icon: 'arm.png' },
            { id: 'leg', label: 'LEG', sub: 'L / R Leg', icon: 'leg.png' },
            { id: 'back', label: 'BACK', sub: 'Body Menu', icon: 'back.png' }
        ]
    }
};
