import * as THREE from "./three/build/three.module.js";

export default class KeyFrame {
    constructor(text) {
        var textElements = text.split(/\s+/);
        console.log(textElements);
        this.t = parseFloat(textElements[0]);
        this.pos = [parseFloat(textElements[1]), parseFloat(textElements[2]), parseFloat(textElements[3])];
        this.axis = [parseFloat(textElements[4]), parseFloat(textElements[5]), parseFloat(textElements[6])];
        this.angle = parseFloat(textElements[7]);
        console.log(this);
    }
}