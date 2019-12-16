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

        this.getVelocity = function(x_d, y_d, z_d) {
            // Get velocity vectors on each vertex of the cube
            var c_000 = new THREE.Vector3(this.velocity_left, this.velocity_down, this.velocity_front);
            var c_100 = new THREE.Vector3(this.velocity_right, this.velocity_down, this.velocity_front);
            var c_010 = new THREE.Vector3(this.velocity_left, this.velocity_up, this.velocity_front);
            var c_110 = new THREE.Vector3(this.velocity_right, this.velocity_up, this.velocity_front);
            var c_001 = new THREE.Vector3(this.velocity_left, this.velocity_down, this.velocity_back);
            var c_101 = new THREE.Vector3(this.velocity_right, this.velocity_down, this.velocity_back);
            var c_011 = new THREE.Vector3(this.velocity_left, this.velocity_up, this.velocity_back);
            var c_111 = new THREE.Vector3(this.velocity_right, this.velocity_up, this.velocity_back);

            // interpolate along x
            var c_00 = c_000.multiplyScalar(1-x_d).add(c_100.multiplyScalar(x_d));
            var c_10 = c_010.multiplyScalar(1-x_d).add(c_110.multiplyScalar(x_d));
            var c_01 = c_001.multiplyScalar(1-x_d).add(c_101.multiplyScalar(x_d));
            var c_11 = c_011.multiplyScalar(1-x_d).add(c_111.multiplyScalar(x_d));
            // interpolate along y
            var c_0 = c_00.multiplyScalar(1-y_d).add(c_01.multiplyScalar(y_d));
            var c_1 = c_10.multiplyScalar(1-y_d).add(c_11.multiplyScalar(y_d));
            // interpolate along z
            var newVel = c_0.multiplyScalar(1-z_d).add(c_1.multiplyScalar(z_d));
            return newVel;
        }
    }
}