// other libraries
import animationInterval from "./animationInterval";

// types
type TypeWriterAction = () => Promise<void>;
type ActionCallback = (resolve: () => void) => void;

export default class TypeWriter {
  // Internal state
  private hasStarted: boolean = false;
  private readonly actionsQueue: TypeWriterAction[] = [];
  private _typedText: string = "";

  constructor(
    // Configuration
    private readonly globalSignal: AbortSignal,
    private readonly onUpdate: (text: string) => void,
    private readonly shouldLoop: boolean = false,
    private readonly typingSpeed: number = 80,
    private readonly deletingSpeed: number = 80,
  ) {}

  // A private setter to automatically call the onUpdate callback
  private set typedText(newText: string) {
    this._typedText = newText;
    this.onUpdate(this._typedText);
  }

  typeFullText = (fullText: string) => {
    const words = fullText.split(" ");

    for (const word of words) {
      // Simulate making a typo
      const typo = this.makeTypo(word, 0.03);
      if (word === typo) {
        this.typeWord(word + " ").pauseFor(this.getRandomInt(60, 100));
      } else {
        this.typeWord(typo + " ").pauseFor(this.getRandomInt(60, 250));
        this.deleteChars(typo.length + 1);
        this.typeWord(word + " ").pauseFor(this.getRandomInt(60, 100));
      }
    }

    return this;
  };

  typeWord = (word: string) => {
    this.addNewAction((resolve) => {
      let i = 0;
      const controller = new AbortController();
      animationInterval(this.getRandomInt(60, this.typingSpeed), [controller.signal, this.globalSignal], () => {
        this.typedText = this._typedText + word[i];
        i++;
        if (i >= word.length) {
          controller.abort();
          resolve();
        }
      });
    });

    return this;
  };

  deleteChars = (howMany: number) => {
    this.addNewAction((resolve) => {
      let i = 0;
      const controller = new AbortController();
      animationInterval(this.getRandomInt(60, this.deletingSpeed), [controller.signal, this.globalSignal], () => {
        this.typedText = this._typedText.slice(0, -1);
        i++;
        if (i >= howMany) {
          controller.abort();
          resolve();
        }
      });
    });

    return this;
  };

  pauseFor = (duration: number) => {
    this.addNewAction((resolve) => {
      setTimeout(resolve, duration, { signal: this.globalSignal });
    });

    return this;
  };

  start = async (onFinished: () => void) => {
    // If the action queue for this instance has already begun, do not start another one
    if (this.hasStarted) return this;
    this.hasStarted = true;

    let actionCallback = this.actionsQueue.shift();
    while (actionCallback) {
      if (this.globalSignal.aborted) {
        this.hasStarted = false;
        return this;
      }

      await actionCallback();
      if (this.shouldLoop) this.actionsQueue.push(actionCallback);
      actionCallback = this.actionsQueue.shift();
    }

    this.hasStarted = false;
    onFinished();

    return this;
  };

  private makeTypo = (text: string, typoProbability: number) => {
    // Loop through each character in the text
    let result = "";
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      // Randomly decide if a typo will occur
      if (Math.random() < typoProbability) {
        // Simulate different typo types
        const randomAction = Math.random();
        if (randomAction < 0.33 && i < text.length - 1) {
          // Swap characters (adjacent only)
          result += text[i + 1] + char;
          // Skip the next character since we've already used it
          i++;
        } else if (randomAction < 0.66) {
          // Miss a character
          continue;
        } else {
          // Insert a random character
          result += char + String.fromCharCode(Math.floor(Math.random() * 26) + 97);
        }
      } else {
        // Add the original character if no typo
        result += char;
      }
    }
    return result;
  };

  private addNewAction = (actionCallback: ActionCallback) => {
    this.actionsQueue.push(() => new Promise<void>(actionCallback));
  };

  private getRandomInt = (min: number, max: number) => {
    // Use Math.random to get a decimal between 0 (inclusive) and 1 (exclusive)
    const randomDecimal = Math.random();

    // Calculate the range (max - min + 1) to include both min and max
    const range = max - min + 1;

    // Floor the random number and scale it to the range, then add min for the desired range
    return Math.floor(randomDecimal * range) + min;
  };
}
