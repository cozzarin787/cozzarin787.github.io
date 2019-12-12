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

        var MAX_VELOCITY = 1000;

        // Update method used to animate the object based on basic physics
        this.updateMotion = function (delta_t) {
            // Calculate Forces
            // Gravity
            var F_grav = new THREE.Vector3(0, -9.81, 0);
            // Pressure
            // Density

            // Find new position
            var s = new THREE.Vector3();
            s.addVectors(this.pos, this.integrate(this.v.x, this.v.y, this.v.z, delta_t));
            this.pos.set(s.x, s.y, s.z);
            // Update Translational Momentum
            this.M = this.v.clone().multiplyScalar(this.m);
            // Calculate velocity
            this.v.addVectors(this.v, this.integrate(F_grav.x, F_grav.y, F_grav.z, delta_t));
        };

        // Update method used to change color of the particle
        this.updateRendering = function () {
            this.color = this.baseColor.lerp(this.fadeColor, this.v.length() / MAX_VELOCITY);
        }

        // Give initial force 
        this.calcInitialForce = function (x, y, z) {
            this.v.set(x, y, z);
        }

        this.integrate = function(x, y, z, delta_t) {
            var integrated = new THREE.Vector3(x, y, z);
            integrated.multiplyScalar(delta_t);
            return integrated;
        }

        this.updateVelocity = function(J) {
            // Update Translational Velocity
            var newV = new THREE.Vector3(this.M.x, this.M.y, this.M.z);
            newV.divideScalar(this.m);
            this.v.addVectors(newV, J);
        }
    }
}
