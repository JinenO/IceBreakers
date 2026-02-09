/* ============================================
	 IRIS FLOW - View Router Logic
	 Handles switching between Main Grid and Sub-views
	 ============================================ */

// 1. Get DOM elements
const mainGrid = document.getElementById('main-grid');
const viewContainer = document.getElementById('view-container');
const subGrid = document.getElementById('sub-grid');
const viewTitle = document.getElementById('view-title');

// 2. Core view switching
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
		card.onclick = () => {
			if (item.id === 'back') {
				hideSubView();
			} else {
				console.log(`Action Triggered: ${item.label}`);
				// TODO: trigger API call
			}
		};

		subGrid.appendChild(card);
	});

	// C. Toggle visibility
	mainGrid.classList.add('hidden');
	viewContainer.classList.remove('hidden');
}

function hideSubView() {
	viewContainer.classList.add('hidden');
	mainGrid.classList.remove('hidden');
}

// 3. Bind main cards to sub-views (temporary click testing)
document.getElementById('c-needs').onclick = () => showSubView('needs');
document.getElementById('c-body').onclick = () => showSubView('body');
document.getElementById('c-media').onclick = () => showSubView('media');
