/* frontend/js/data.js */
export const MAIN_MENU_DATA = [
    { id: 'c-needs', icon: 'needs.png', label: 'NEEDS', sub: 'Water / Food' },
    { id: 'c-chat', icon: 'chat-ai.png', label: 'CHAT AI', sub: 'Smart Talk' },
    { id: 'c-body', icon: 'body.png', label: 'BODY', sub: 'Comfort' },
    { id: 'c-media', icon: 'media.png', label: 'MEDIA', sub: 'Watch TV' },
    { id: 'c-kb', icon: 'keyboard.png', label: 'KEYBOARD', sub: 'Type' }
];

export const SUB_MENU_DATA = {
    'c-needs': {
        title: 'NEEDS',
        items: [
            { id: 'water', label: 'WATER', sub: 'Thirsty', icon: 'needs.png' },
            { id: 'food', label: 'FOOD', sub: 'Hungry', icon: 'needs.png' },
            { id: 'toilet', label: 'TOILET', sub: 'Assistance', icon: 'needs.png' },
            { id: 'back', label: 'BACK', sub: 'Main Menu', icon: 'needs.png' }
        ]
    },
    'c-body': {
        title: 'BODY',
        items: [
            { id: 'roll', label: 'ROLL OVER', sub: 'Position', icon: 'body.png' },
            { id: 'head', label: 'HEAD UP', sub: 'Pillow', icon: 'body.png' },
            { id: 'itch', label: 'ITCHY', sub: 'Scratch', icon: 'body.png' },
            { id: 'back', label: 'BACK', sub: 'Main Menu', icon: 'body.png' }
        ]
    },
    'c-media': {
        title: 'MEDIA',
        items: [
            { id: 'tv', label: 'TV', sub: 'Watch', icon: 'media.png' },
            { id: 'music', label: 'MUSIC', sub: 'Listen', icon: 'media.png' },
            { id: 'back', label: 'BACK', sub: 'Main Menu', icon: 'media.png' }
        ]
    },
    'c-chat': {
        title: 'AI CHAT',
        items: [{ id: 'back', label: 'BACK', sub: 'Coming Soon' }]
    },
    'c-kb': {
        title: 'KEYBOARD',
        items: [{ id: 'back', label: 'BACK', sub: 'Coming Soon' }]
    }
};
