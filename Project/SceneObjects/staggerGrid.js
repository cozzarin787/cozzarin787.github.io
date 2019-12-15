import * as THREE from "../three/build/three.module.js";
import Particle from "./fluidParticle.js"

export default class StaggerGridCell {
    constructor(type) {
        this.type = type;
        this.velocity_up = 0.0;
        this.velocity_down = 0.0;
        this.velocity_left = 0.0;
        this.velocity_right = 0.0;
        this.velocity_front = 0.0;
        this.velocity_back = 0.0;
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