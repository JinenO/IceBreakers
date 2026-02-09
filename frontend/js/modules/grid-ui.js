/* ============================================
   GRID UI - Visual Control Logic
   Responsible for highlighting cards, not timing.
   ============================================ */

export class GridUI {
    constructor() {
        this.cards = Array.from(document.querySelectorAll('#main-grid .card'));
        this.currentIndex = -1;
        this.totalCards = this.cards.length;
    }

    /**
     * Move to the next card.
     * @returns {string} Current highlighted card ID
     */
    highlightNext() {
        if (this.currentIndex >= 0) {
            this.removeHighlight(this.currentIndex);
        }

        this.currentIndex = (this.currentIndex + 1) % this.totalCards;
        this.addHighlight(this.currentIndex);

        return this.cards[this.currentIndex].id;
    }

    /**
     * Highlight a specific index.
     */
    addHighlight(index) {
        const card = this.cards[index];
        if (card) {
            card.classList.add('active');
        }
    }

    /**
     * Remove highlight.
     */
    removeHighlight(index) {
        const card = this.cards[index];
        if (card) {
            card.classList.remove('active');
        }
    }

    /**
     * Get current selected card ID.
     */
    getCurrentId() {
        if (this.currentIndex === -1) return null;
        return this.cards[this.currentIndex].id;
    }
}
