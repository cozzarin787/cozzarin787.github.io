import * as THREE from "../three/build/three.module.js";

export default class Particle {
    constructor(initPos, initVel, initSize, baseColor, fadeColor) {
        this.position = initPos;
        this.m = 1;
        this.v = initVel;
        this.size = initSize;
        this.color = new THREE.Color(baseColor);
        this.baseColor = new THREE.Color(baseColor);
        this.fadeColor = new THREE.Color(fadeColor);
        this.active = false;        // Particles are deactivated when created
        this.age = 0;
        this.M = new THREE.Vector3();

        // Update method used to animate the object based on basic physics
        this.updateMotion = function (delta_t) {
            // Find new position
            var s = new THREE.Vector3();
            s.addVectors(this.position, this.integrate(this.v.x, this.v.y, this.v.z, delta_t));
            this.position.set(s.x, s.y, s.z);
            // Update Translational Momentum
            this.M = this.v.clone().multiplyScalar(this.m);
            // Calculate velocity
            this.v.addVectors(this.M, this.integrate(this.M.x, this.M.y, this.M.z, delta_t)).divideScalar(this.m);

            // increase age of particle
            this.age += delta_t;
        };

        // Update method used to change color of the particle
        this.updateRendering = function (lifeTime) {
            this.color = this.baseColor.lerp(this.fadeColor, this.age / lifeTime);
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
