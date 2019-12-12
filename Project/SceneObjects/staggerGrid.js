import * as THREE from "../three/build/three.module.js";
import Particle from "./fluidParticle.js"

export default class StaggerGridCell {
    constructor(type) {
        this.type = type;
        this.velocity = new THREE.Vector3(0,0,0);
        this.particleIndices = [];

        this.initParticles = function(newParticles) {
            this.particleIndices = newParticles;
        }

        this.isAir = function() {
            return this.type == 0;
        }
        this.isFluid = function() {
            return this.type == 1;
        }
        this.isSolid = function() {
            return this.type == 2;
        }
    }
}