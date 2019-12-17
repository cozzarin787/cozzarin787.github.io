/**
 * File: fluidParticle.js
 * Author: Jacob Cozzarin
 */

import * as THREE from "../three/build/three.module.js";

export default class FluidParticle {
    constructor(initPos, initVel, mass, initSize, baseColor, fadeColor) {
        this.pos = initPos;     // position
        this.v = initVel;       // velocity
        this.m = 1;             // mass
        this.d = 0;             // density
        this.p = 0;             // pressure
        this.F = 0;             // Force
        this.size = initSize;   // Particle Size
        this.color = new THREE.Color(baseColor);    // Color
        this.baseColor = new THREE.Color(baseColor);    // Water Color
        this.fadeColor = new THREE.Color(fadeColor);    // "White cap" color
        this.M = new THREE.Vector3();
        this.gridUpdated = false;       // Bool to flag whether this particle's position in the grid has been updated

        var MAX_VELOCITY = 1000;

        // Update method used to animate the object based on basic physics
        this.updateMotion = function (delta_t, gridCell, left, right, up, down, front, back, x, y, z) {
            // Find new position
            var newPos = new THREE.Vector3();
            newPos.addVectors(this.pos, this.integrate(this.v.x, this.v.y, this.v.z, delta_t, gridCell, left, right, up, down, front, back, x, y, z));
            this.pos.set(newPos.x, newPos.y, newPos.z);
        };

        // Update method used to change color of the particle
        this.updateRendering = function () {
            this.color = this.baseColor.lerp(this.fadeColor, Math.abs(this.v.length()) / MAX_VELOCITY);
        }

        // Give initial force 
        this.setVelocity = function (v) {
            this.v.set(v.x, v.y, v.z);
        }

        this.integrate = function(x, y, z, delta_t, gridCell, left, right, up, down, front, back, gridx, gridy, gridz) {
            var integrated = new THREE.Vector3(x, y, z);
            // Euler Integration
            //integrated.multiplyScalar(delta_t);
            // Midpoint (RK2)
            var midPointPosition = this.pos.clone().add((integrated.multiplyScalar(delta_t * 0.5)));
            var midPointVelocity = gridCell.getParticleVelocity(left, right, up, down, front, back, (midPointPosition.x - gridx), (midPointPosition.y - gridy), (midPointPosition.z - gridz));
            integrated = midPointVelocity.multiplyScalar(delta_t); 
            integrated.clamp(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1)); // CFL Condition
            return integrated;
        }
    }
}
