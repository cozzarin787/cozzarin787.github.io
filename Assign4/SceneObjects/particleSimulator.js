import * as THREE from "../three/build/three.module.js";
import Particle from "./particle.js"

export default class ParticleSimulator {
    constructor() {
        this.emitRate = 500;
        this.speed = 1;
        this.particleSize = 10;
        this.lifeTime = 2;
        this.emitterRadius = 1;
        this.emitColor = 0xffffff;
        this.fadeColor = 0xffffff;
        this.particleArray = [];
        this.systemAge = 0;

        this.position = new THREE.Vector3(0,0,0);
        this.totalParticles = this.emitRate * this.lifeTime;
        this.particleGeometry = new THREE.Geometry();
        this.particleMaterial = new THREE.PointsMaterial({
            size: this.particleSize,
            vertexColors: THREE.VertexColors,
            opacity: 1.0
        });
        this.particleMesh = new THREE.Points();

        this.initializeSimulation = function(scene) {
            // Create particle system with the total amount of particles there will be at a time
            for (var i = 0; i < this.totalParticles; i++) {
                this.particleArray[i] = this.createParticle();
                this.particleGeometry.vertices[i] = this.particleArray[i].position.clone();
                this.particleGeometry.colors[i] = this.particleArray[i].color.clone();
            }
            this.particleMesh = new THREE.Points(this.particleGeometry, this.particleMaterial);
            scene.add(this.particleMesh);
        }

        this.createParticle = function() {
             // Create init position on sphere randomly
             var x = randn_bm();
             var y = randn_bm();
             var z = randn_bm();
             var pos = new THREE.Vector3(x, y, z).normalize().multiplyScalar(this.emitterRadius);
             // Create init velocity outwards with randomness
             var dir = new THREE.Vector3().subVectors(pos, this.position).normalize();
             dir.multiplyScalar(Math.random());

             // Create particle and add to list of particles
             var particle = new Particle(pos, dir, this.particleSize, this.emitColor, this.fadeColor);
             return particle;
        }

        this.simulateParticles = function(delta_t) {
            var recycleParticles = [];

            // update particles
            for (var i = 0; i < this.totalParticles; i++) {
                if (this.particleArray[i].active) {
                    this.particleArray[i].updateMotion(delta_t);
                    this.particleArray[i].updateRendering(this.lifeTime);

                    // check if particle should expire
                    if (this.particleArray[i].age > this.lifeTime) {
                        this.particleArray[i].active = false;
                        recycleParticles.push(i);
                    }
                    // update vertex color
                    this.particleGeometry.colors[i] = new THREE.Color(this.particleArray[i].color.clone());
                }
            }

            // if the particle system hasn't emitted all of the particles, keep emitting
            if (this.systemAge < this.lifeTime) {
                // determine indices of particles to activate
                var startIndex = Math.round( this.emitRate * (this.systemAge +  0) );
                var   endIndex = Math.round( this.emitRate * (this.systemAge + delta_t) );
                if  ( endIndex > this.totalParticles ) 
                    endIndex = this.totalParticles; 
                    
                for (var i = startIndex; i < endIndex; i++)
                    this.particleArray[i].active = true;		
            }

            // if any particles have died, recycle them back in
            for (var j = 0; j < recycleParticles.length; j++) {
                var i = recycleParticles[j];
                this.particleArray[i] = this.createParticle();
                this.particleArray[i].active = true;
                this.particleGeometry.vertices[i] = this.particleArray[i].position.clone();
                this.particleGeometry.colors[i] = this.particleArray[i].color.clone();
            }

            this.particleGeometry.verticesNeedUpdate = true;

            this.systemAge += delta_t;
        }

        // Standard Normal variate using Box-Muller transform.
        // CREDIT: https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
        function randn_bm() {
            var u = 0, v = 0;
            while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
            while(v === 0) v = Math.random();
            return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        }
    }
}
