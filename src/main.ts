import "./styles.css";

const HIGH = true;
const LOW = false;

type HighType = typeof HIGH;
type LowType = typeof LOW;

type State = HighType | LowType;
type Sub = {
    (state: State): void;
}

class Pin {
    public state: State;
    public subs: Set<Sub>;

    constructor() {
        this.state = LOW;
        this.subs = new Set();
    }

    sub(fn: Sub) {
        this.subs.add(fn);
        return () => this.subs.delete(fn);
    }

    removeSubs() {
        this.subs.clear();
    }
}

class InputPin extends Pin {
    toggleState() {
        this.state = this.state === HIGH ? LOW : HIGH;
        this.subs.forEach(sub => sub(this.state));
    }
}

class OutputPin extends Pin {
    setState(state) {
        this.state = typeof state === 'function' ? state(this.state) : state;

        if (this.subs.size > 0) {
            this.subs.forEach(sub => sub(this.state));
        }
    }
}

const piAND1 = new InputPin();
const piAND2 = new InputPin();
const poAND1 = new OutputPin();

const piNOT1 = new InputPin();
const poNOT1 = new OutputPin();

interface Library {
    process(): void;
    sub(fn: Sub): void;
}

class And implements Library {
    private inputPins: InputPin[];
    private outputPins: OutputPin[];
    private subs: Set<Sub>;
    private inputsLen: number = 2 as const;
    private outputsLen: number = 1 as const;

    constructor() {
        this.inputPins = [];
        this.outputPins = [];
        this.subs = new Set();
    }

    process() {
        const outputIsHigh = this.inputPins[0].state === HIGH && this.inputPins[0].state === HIGH;
        this.outputPins[0].setState(outputIsHigh ? HIGH : LOW);
    }

    sub(fn: Sub) {
        this.subs.add(fn);
    }
}

class Not {
    private inputPins: InputPin[];
    private outputPins: OutputPin[];
    private subs: Set<Sub>;
    private inputsLen: number = 1 as const;
    private outputsLen: number = 1 as const;

    constructor() {
        this.inputPins = [];
        this.outputPins = [];
        this.subs = new Set();
    }

    process() {
        this.outputPins[0].setState(this.inputPins[0].state === HIGH ? LOW : HIGH);
    }

    sub(fn: Sub) {
        this.subs.add(fn);
    }
}

const libraries = {
    'and': And,
    'not': Not
};

type LibraryKeys = keyof typeof libraries;
type LibraryValues = typeof libraries[LibraryKeys];
type LibraryList = LibraryValues[];

class Scene {
    private inputPins: InputPin[];
    private outputPins: OutputPin[];
    private bridges: LibraryList;

    private inputsLen: number = 0;
    private outputsLen: number = 0;

    constructor() {
        this.inputPins = [];
        this.outputPins = [];
        this.bridges = [];
    }

    addInputPin() {
        const pin = new InputPin();
        this.inputsLen += 1;
        this.inputPins.push(pin);
        return pin;
    }
    
    addOutputPin() {
        const pin = new OutputPin();
        this.outputsLen += 1;
        this.outputPins.push(pin);
        return pin;
    }

    removeOutputPin(pin: Pin) {
        pin.removeSubs();
        this.outputPins = this.outputPins.filter(p => p !== pin);
    }

    addJoinPinToPin(a: InputPin, b: OutputPin) {
        a.sub(state => {
            b.setState(state);
        });
    }

    addJoinBridgeToPin(a: InstanceType<LibraryValues>, b: OutputPin) {
        a.sub(state => {
            b.setState(state);
        });
    }

    addJoinPinToBridge(a: InputPin, b: InstanceType<LibraryValues>) {
        // TODO
    }

    print() {
        console.clear();
        console.log('inputs', this.inputPins.map(p => p.state).join(' '));
        console.log('outputs', this.outputPins.map(p => p.state).join(' '));
    }
    
    addBridge(name: string) {
        const bridge = libraries[name];
        this.bridges.push(new bridge());
        return bridge;
    }
}

const scene = new Scene();

const pi1 = scene.addInputPin();
const pi2 = scene.addInputPin();
const po1 = scene.addOutputPin();
const and1 = scene.addBridge('and');

scene.addJoinPinToPin(pi1, and1);
scene.addJoinPinToPin(pi2, and1);
scene.addJoinBridgeToPin(and1, po1);

scene.print();