import * as THREE from "../three/build/three.module.js";
import Particle from "./fluidParticle.js"
import StaggerGridCell from "./staggerGrid.js"

export default class FluidSimulator {
    constructor() {
        const AIR = 0;
        const FLUID = 1;
        const SOLID = 2;

        this.simWidth = 15;
        this.simHeight = 15;
        this.simDepth = 15;
        this.fluidOffset = new THREE.Vector3(0,0,0);
        this.fluidWidth = 10;
        this.fluidHeight = 10;
        this.fluidDepth = 10;
        this.particlesPerGridCell = 8;
        this.particleSize = 0.5;
        this.emitColor = 0x0000ff;
        this.fadeColor = 0xc2ff;
        this.particleGrid = [];
        this.particleArray = [];

        this.particleGeometry = new THREE.Geometry();
        this.particleMaterial = new THREE.PointsMaterial({
            size: this.particleSize,
            vertexColors: THREE.VertexColors,
            opacity: 1.0
        });
        this.particleMesh = new THREE.Points();

        this.initializeSimulation = function(scene) {
            var pI = 0;
            var fluidXLow = -Math.floor((this.fluidWidth / 2)) + this.fluidOffset.x;
            var fluidXHigh = Math.floor((this.fluidWidth / 2)) + this.fluidOffset.x;
            var fluidYLow = -Math.floor((this.fluidHeight / 2)) + this.fluidOffset.y;
            var fluidYHigh = Math.floor((this.fluidHeight / 2)) + this.fluidOffset.y;
            var fluidZLow = -Math.floor((this.fluidDepth / 2)) + this.fluidOffset.z;
            var fluidZHigh = Math.floor((this.fluidDepth / 2)) + this.fluidOffset.z;
            for (var i = 0; i < this.simWidth; i++) {
                this.particleGrid[i] = [];
                for (var j = 0; j < this.simHeight; j++) {
                    this.particleGrid[i][j] = [];
                    for (var k = 0; k < this.simDepth; k++) {
                        // Calculate current voxel location boundries and check if in "fluid"
                        var x = i - (this.simWidth / 2);
                        var y = j - (this.simHeight / 2);
                        var z = k - (this.simDepth / 2);
                        if ((fluidXLow <= x && x <= fluidXHigh) && (fluidYLow <= y && y <= fluidYHigh) && (fluidZLow <= z && z <= fluidZHigh)) {
                            // If current voxel is in the defined initial fluid, create initial fluid particles
                            var cell = new StaggerGridCell(FLUID);
                            for (var l = 0; l < this.particlesPerGridCell; l++) {
                                // Calculate min corner of grid cell to create random distribution of particles in
                                var gridLoc = new THREE.Vector3(x, y, z);
                                // Create particle and add to list of particles
                                cell.particleIndices.push(pI);
                                this.particleArray[pI] = this.createParticle(gridLoc);
                                this.particleGeometry.vertices[pI] = this.particleArray[pI].pos.clone();
                                this.particleGeometry.colors[pI] = this.particleArray[pI].color.clone();
                                pI++;
                            }
                            this.particleGrid[i][j][k] = cell;
                        }
                        else if ((i == this.simWidth-1 || i == 0) || (j == this.simHeight-1 || j == 0) || (k == this.simDepth-1 || k == 0)) {
                            // We are at the edge of the grid, make it solid
                            this.particleGrid[i][j][k] = new StaggerGridCell(SOLID);
                        }
                        else {
                            this.particleGrid[i][j][k] = new StaggerGridCell(AIR);
                        }
                    }
                }
            }
            console.log(this.particleGrid)
            this.particleMesh = new THREE.Points(this.particleGeometry, this.particleMaterial);
            scene.add(this.particleMesh);
        }

        this.createParticle = function(gridLoc) {
             // Create init position inside grid cell randomly
             var x = randn_bm();
             var y = randn_bm();
             var z = randn_bm();
             var pos = new THREE.Vector3(x, y, z).add(gridLoc);

             var particle = new Particle(pos, new THREE.Vector3(0,0,0), 1, this.particleSize, this.emitColor, this.fadeColor);
             return particle;
        }

        this.simulateParticles = function(delta_t) {
            // update particles
            for (var i = 0; i < this.simWidth; i++) {
                for (var j = 0; j < this.simHeight; j++) {
                    for (var k = 0; k < this.simDepth; k++) {
                        if (this.particleGrid[i][j][k].isFluid()) {
                            for (var l = 0; l < this.particleGrid[i][j][k].particleIndices.length; l++) {
                                var idx = this.particleGrid[i][j][k].particleIndices[l];
                                this.particleArray[idx].updateMotion(delta_t);
                                this.particleGeometry.vertices[idx] = this.particleArray[idx].pos.clone();
                                this.particleArray[idx].updateRendering();
                                this.particleGeometry.colors[idx] = this.particleArray[idx].color.clone();
                            }
                        }
                    }
                }
            }
            // for (var i = 0; i < this.particleArray.length; i++) {
            //     this.particleArray[i].updateMotion(delta_t);
            //     this.particleGeometry.vertices[i] = this.particleArray[i].pos.clone();
            //     this.particleArray[i].updateRendering();
            //     this.particleGeometry.colors[i] = this.particleArray[i].color.clone();
            // }
            this.particleGeometry.verticesNeedUpdate = true;
            this.particleGeometry.colorsNeedUpdate = true;
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
