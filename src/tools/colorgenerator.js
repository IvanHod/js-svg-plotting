export class ColorGenerator {
    constructor() {
        this.defaultColors = ['green', 'red', 'blue', 'orange', 'yellow'];
        this.currentIndex = 0;
    }

    getNextColor() {
        this.currentIndex += 1;
        return this.defaultColors[this.currentIndex - 1];
    }
}