/* ============================================
   GRID UI - Visual Control Logic
   Responsible for highlighting cards, not timing.
   ============================================ */

export class GridUI {
    constructor() {
        this.cards = Array.from(document.querySelectorAll('#main-grid .card'));
        this.currentIndex = -1;
    }

    refreshCards(selector = '#main-grid .card', preserveIndex = false) {
        const previousId = preserveIndex ? this.getCurrentId() : null;
        
        // 1. Get raw cards from DOM
        const rawCards = Array.from(document.querySelectorAll(selector));
        
        // 2. 🧮 DETERMINISTIC SORTING
        // Priority 1: data-index (explicit order from data array)
        // Priority 2: Visual position (fallback for stability)
        this.cards = rawCards.sort((a, b) => {
            const indexA = parseInt(a.dataset.index);
            const indexB = parseInt(b.dataset.index);
            
            if (!isNaN(indexA) && !isNaN(indexB)) {
                return indexA - indexB;
            }

            const topA = a.offsetTop;
            const topB = b.offsetTop;
            
            if (Math.abs(topA - topB) > 20) {
                return topA - topB;
            }
            return a.offsetLeft - b.offsetLeft;
        });

        console.log(`Scanner found ${this.cards.length} cards. deterministic order:`, this.cards.map(c => c.id));

        if (preserveIndex && previousId) {
            const nextIndex = this.cards.findIndex(
                (card) => card.id === previousId
            );
            this.currentIndex = nextIndex >= 0 ? nextIndex : -1;
        } else {
            this.currentIndex = -1;
        }
    }

    highlightNext() {
        if (this.cards.length === 0) return null;
        if (this.currentIndex >= 0) {
            const prevCard = this.cards[this.currentIndex];
            prevCard.classList.remove('active');
            const prevScan = prevCard.querySelector('.scan-bar');
            if (prevScan) {
                prevScan.style.width = '0%';
                prevScan.style.transition = 'none';
            }
        }

        this.currentIndex = (this.currentIndex + 1) % this.cards.length;
        const currentCard = this.cards[this.currentIndex];

        currentCard.classList.add('active');

        const scanBar = currentCard.querySelector('.scan-bar');
        if (scanBar) {
            scanBar.style.width = '0%';
            scanBar.style.transition = 'none';
            void scanBar.offsetWidth;
        }

        return currentCard.id;
    }

    startScanBarAnimation(duration) {
        if (this.currentIndex === -1) return;
        const bar = this.cards[this.currentIndex].querySelector('.scan-bar');
        if (!bar) return;
        bar.style.transition = `width ${duration}ms linear`;
        bar.style.width = '100%';
    }

    updateConfirmBar(percent) {
        if (this.currentIndex === -1) return;
        const bar = this.cards[this.currentIndex].querySelector('.confirm-bar');
        if (!bar) return;
        bar.style.width = `${percent}%`;

        if (percent >= 100) {
            this.cards[this.currentIndex].classList.add('selected');
        } else {
            this.cards[this.currentIndex].classList.remove('selected');
        }
    }

    // Add this helper method for Developer Mode
    highlightCard(index) {
        // Remove previous highlight
        if (this.cards[this.currentIndex]) {
            this.cards[this.currentIndex].classList.remove('active');
            const oldBar = this.cards[this.currentIndex].querySelector('.scan-bar');
            if (oldBar) oldBar.style.width = '0%';
        }

        // Update index
        this.currentIndex = index;

        // Add new highlight
        const newCard = this.cards[this.currentIndex];
        if (newCard) {
            newCard.classList.add('active');
            // If you want the progress bar to fill instantly on click, add this:
            // const newBar = newCard.querySelector('.scan-bar');
            // if (newBar) newBar.style.width = '100%';
        }
    }

    getCurrentId() {
        return this.cards[this.currentIndex]?.id || null;
    }

    clearHighlights() {
        if (this.cards) {
            this.cards.forEach(card => {
                card.classList.remove('active');
                const scanBar = card.querySelector('.scan-bar');
                if (scanBar) scanBar.style.width = '0%';
            });
        }
        // Double insurance: clear any remaining active elements
        document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
        
        this.currentIndex = -1;
    }
}
