// 1. Sub-view data (icon, label, sub-text)
const SUB_MENU_DATA = {
    'needs': [
        { id: 'water', label: 'WATER', sub: 'Thirsty', icon: 'needs.png' },
        { id: 'food', label: 'FOOD', sub: 'Hungry', icon: 'needs.png' },
        { id: 'toilet', label: 'TOILET', sub: 'Assistance', icon: 'needs.png' },
        { id: 'medicine', label: 'MEDICINE', sub: 'Pain/Meds', icon: 'needs.png' },
        { id: 'help', label: 'ASSIST', sub: 'Call Caregiver', icon: 'needs.png' },
        { id: 'back', label: 'BACK', sub: 'Main Menu', icon: 'needs.png' }
    ],
    'body': [
        { id: 'roll', label: 'ROLL OVER', sub: 'Change position', icon: 'body.png' },
        { id: 'head', label: 'LIFT HEAD', sub: 'Adjust pillow', icon: 'body.png' },
        { id: 'itch', label: 'ITCHY', sub: 'Scratch body', icon: 'body.png' },
        { id: 'temp', label: 'TEMP', sub: 'Hot / Cold', icon: 'body.png' },
        { id: 'massage', label: 'MASSAGE', sub: 'Muscle stiff', icon: 'body.png' },
        { id: 'back', label: 'BACK', sub: 'Main Menu', icon: 'body.png' }
    ],
    'media': [
        { id: 'tv', label: 'TV', sub: 'Watch News', icon: 'media.png' },
        { id: 'music', label: 'MUSIC', sub: 'Play Relax', icon: 'media.png' },
        { id: 'photos', label: 'ALBUM', sub: 'Family photos', icon: 'media.png' },
        { id: 'read', label: 'READ', sub: 'Audio Book', icon: 'media.png' },
        { id: 'youtube', label: 'YOUTUBE', sub: 'Video content', icon: 'media.png' },
        { id: 'back', label: 'BACK', sub: 'Main Menu', icon: 'media.png' }
    ]
};

// 2. Get DOM elements
const mainGrid = document.getElementById('main-grid');
const viewContainer = document.getElementById('view-container');
const subGrid = document.getElementById('sub-grid');
const viewTitle = document.getElementById('view-title');

/**
 * Show a sub-view.
 * @param {string} categoryId - Key in SUB_MENU_DATA.
 */
function showSubView(categoryId) {
    const data = SUB_MENU_DATA[categoryId];
    if (!data) return;

    // A. Update title
    viewTitle.innerText = categoryId.toUpperCase();

    // B. Clear old content and inject new cards
    subGrid.innerHTML = '';
    data.forEach((item) => {
        const card = document.createElement('article');
        card.className = `card ${item.id === 'back' ? 'back-card' : ''}`;
        card.id = `sub-${item.id}`;

        card.innerHTML = `
            <div class="scan-bar"></div>
            <div class="icon"><img src="assets/icons/${item.icon}" alt="${item.label}"></div>
            <div class="label">${item.label}</div>
            <div class="sub-label">${item.sub}</div>
            <div class="confirm-bar"></div>
        `;

        // Click handler (temporary for testing)
        card.onclick = (event) => {
            event.stopPropagation();
            if (item.id === 'back') {
                hideSubView();
            } else {
                handleAction(item.label);
            }
        };

        subGrid.appendChild(card);
    });

    // C. Toggle visibility
    mainGrid.classList.add('hidden');
    viewContainer.classList.remove('hidden');
}

/**
 * Return to main view.
 */
function hideSubView() {
    viewContainer.classList.add('hidden');
    mainGrid.classList.remove('hidden');
}

/**
 * Handle selected action.
 */
function handleAction(label) {
    console.log(`%c Action Sent: ${label} `, 'background: #222; color: #bada55; font-size: 16px;');

    const feedback = document.getElementById('overlay-feedback');
    if (feedback) {
        feedback.classList.add('visible');
        setTimeout(() => {
            feedback.classList.remove('visible');
        }, 2000);
    }
}

// 3. Bind main menu entries (temporary click testing)
document.addEventListener('DOMContentLoaded', () => {
    const entryNeeds = document.getElementById('c-needs');
    const entryBody = document.getElementById('c-body');
    const entryMedia = document.getElementById('c-fun');

    if (entryNeeds) entryNeeds.onclick = () => showSubView('needs');
    if (entryBody) entryBody.onclick = () => showSubView('body');
    if (entryMedia) entryMedia.onclick = () => showSubView('media');
});
