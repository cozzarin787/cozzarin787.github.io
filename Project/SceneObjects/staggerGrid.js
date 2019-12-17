/**
 * File: staggerDrid.js
 * Author: Jacob Cozzarin
 */

import * as THREE from "../three/build/three.module.js";
import Particle from "./fluidParticle.js"

export default class StaggerGridCell {
    constructor(type) {
        this.type = type;
        this.velocity = new THREE.Vector3(0,0,0);
        this.divergenceCenter = 0.0;
        this.pressure = 0.0;
        this.particleIndices = [];

        this.isAir = function() {
            return this.type == 0;
        }
        this.isFluid = function() {
            return this.type == 1;
        }
        this.isSolid = function() {
            return this.type == 2;
        }

        this.addParticle = function(pI) {
            this.particleIndices.push(pI);
        }

        this.removeParticle = function(i) {
            this.particleIndices.splice(i, 1);
        }

        this.getParticleVelocity = function(left, right, up, down, front, back, x_d, y_d, z_d) {
            // Get velocity vectors on each vertex of the cube
            var c_000 = new THREE.Vector3(left, down, front);
            var c_100 = new THREE.Vector3(right, down, front);
            var c_010 = new THREE.Vector3(left, up, front);
            var c_110 = new THREE.Vector3(right, up, front);
            var c_001 = new THREE.Vector3(left, down, back);
            var c_101 = new THREE.Vector3(right, down, back);
            var c_011 = new THREE.Vector3(left, up, back);
            var c_111 = new THREE.Vector3(right, up, back);

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