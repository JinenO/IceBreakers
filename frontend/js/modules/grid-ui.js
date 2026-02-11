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
        this.cards = Array.from(document.querySelectorAll(selector));
        console.log(`Scanner found ${this.cards.length} cards for scanning.`);

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

    getCurrentId() {
        return this.cards[this.currentIndex]?.id || null;
    }
}
