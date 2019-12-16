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
        this.fluidWidth = 4;
        this.fluidHeight = 4;
        this.fluidDepth = 4;
        this.particlesPerGridCell = 8;
        this.particleSize = 0.5;
        this.emitColor = 0x0000ff;
        this.fadeColor = 0xc2ff;
        this.particleGrid = [];
        this.particleGridCopy = [];
        this.particleArray = [];
        this.gravity = -9.81;

        this.particleGeometry = new THREE.Geometry();
        this.particleMaterial = new THREE.PointsMaterial({
            size: this.particleSize,
            vertexColors: THREE.VertexColors,
            opacity: 1.0
        });
        this.particleMesh = new THREE.Points();

        this.initializeSimulation = function(scene) {
            // STEP 1
            // Create initial box and subdivide into number of voxels
            // Label most outer voxels as solid
            // Label an inner set of voxels as fluid. 
            // Every voxel labeled as fluid will have 8 particles seeded by randomly placing
            //  them in a 2x2x2 sub-grid. 
            // Also need to initialize velocities of the fluid particles (Coming out of a hose or stagnant water)
            // All other voxels label as air
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
            // STEP 2
            // Transfer particles to appropriate grid cells that contain them
            // for (var i = 0; i < this.simWidth; i++) {
            //     for (var j = 0; j < this.simHeight; j++) {
            //         for (var k = 0; k < this.simDepth; k++) {
            //             this.particleGrid[i][j][k].particleIndices = [];
            //         }
            //     }
            // }
            // for (var i = 0; i < this.particleArray.length; i++) {
            //     var xi = Math.floor(this.particleArray[i].pos.x) + ((this.simWidth / 2));
            //     var yi = Math.floor(this.particleArray[i].pos.y) + ((this.simHeight / 2));
            //     var zi = Math.floor(this.particleArray[i].pos.z) + ((this.simDepth / 2));
            //     xi = THREE.Math.clamp(xi, 0, this.simWidth-1);
            //     yi = THREE.Math.clamp(yi, 0, this.simHeight-1);
            //     zi = THREE.Math.clamp(zi, 0, this.simDepth-1);
            //     this.particleGrid[xi][yi][zi].particleIndices.push(i);
            // }
            for (var i = 1; i < this.simWidth-1; i++) {
                for (var j = 1; j < this.simHeight-1; j++) {
                    for (var k = 1; k < this.simDepth-1; k++) {
                        var gridParticles = this.particleGrid[i][j][k].particleIndices.slice();
                        var indicesToRemove = [];
                        for (var l = 0; l < gridParticles.length; l++) {
                            var particle = this.particleArray[gridParticles[l]];
                            // Check if particle is already updated
                            if (!particle.gridUpdated) {
                                var x = i - (this.simWidth / 2);
                                var y = j - (this.simHeight / 2);
                                var z = k - (this.simDepth / 2);
                                var parPos = particle.pos;
                                var xi = i;
                                var yi = j;
                                var zi = k;
                                // Check if particle moved out of this grid cell into another
                                
                                // X POS
                                // left
                                while (parPos.x < x && xi > 0) {
                                    xi -= 1;
                                    x -= 1;
                                }
                                // right
                                while (parPos.x > x+1 && xi < this.simWidth-1) {
                                    xi += 1;
                                    x += 1;
                                }
                                // Y POS
                                // bottom
                                while (parPos.y < y && yi > 0) {
                                    yi -= 1;
                                    y -= 1;
                                }
                                // top
                                while (parPos.y > y+1 && yi < this.simHeight-1) {
                                    yi += 1;
                                    y += 1;
                                }
                                // Z POS
                                // front
                                while (parPos.z < z && zi > 0) {
                                    zi -= 1;
                                    z -= 1;
                                }
                                // back
                                while (parPos.z > z+1 && zi < this.simDepth-1) {
                                    zi += 1;
                                    z += 1;
                                }
                                // Check if new cell isn't a solid or the particle hasn't moved out of the current cell

                                if (this.particleGrid[xi][yi][zi].isSolid()) {
                                    // if particle moved into solid, push it back out
                                    if (xi > i)
                                        parPos.set(x-(1+randn_bm()/16), parPos.y, parPos.z);
                                    else if (xi < i)
                                        parPos.set(x+(1+randn_bm()/16), parPos.y, parPos.z);
                                    if (yi > j)
                                        parPos.set(parPos.x, y-(1+randn_bm()/16), parPos.z);
                                    else if (yi < j)
                                        parPos.set(parPos.x, y+(1+randn_bm()/16), parPos.z);
                                    if (zi > k)
                                        parPos.set(parPos.x, parPos.y, z-(1+randn_bm()/16));
                                    else if (zi < k)
                                        parPos.set(parPos.x, parPos.y, z+(1+randn_bm()/16));
                                }
                                else if (xi != i && yi != j && zi != k) {
                                    // particle moved, so add it to the appropriate new cell
                                    this.particleGrid[xi][yi][zi].particleIndices.push(gridParticles[l]);
                                    indicesToRemove.push(l);
                                }
                                particle.gridUpdated = true;
                            }
                        }
                        // Remove particles that have moved out of the current cell
                        for (var ri = indicesToRemove.length-1; ri > 0; ri--) {
                            this.particleGrid[i][j][k].particleIndices.splice(indicesToRemove[ri], 1);
                        }
                    }
                }
            }

            // Interpolate nearby particle velocities to a corresponding stagger grid cube
            // Use trilinear interpolation of the weighted average particle velocities that 
            // lies in a cube twice the grid cell width where the center is at the grid-velocity component.
            for (var i = 1; i < this.simWidth-1; i++) {
                for (var j = 1; j < this.simHeight-1; j++) {
                    for (var k = 1; k < this.simDepth-1; k++) {
                        var x = i - (this.simWidth / 2);
                        var y = j - (this.simHeight / 2);
                        var z = k - (this.simDepth / 2);

                        // Calculate weighted average of particle velocities in the nearby surrounding grids
                        var xPosition = new THREE.Vector3(x, y + 0.5, z + 0.5);
                        var yPosition = new THREE.Vector3(x + 0.5, y, z + 0.5);
                        var zPosition = new THREE.Vector3(x + 0.5, y + 0.5, z);
                        var velocity_x = 0;
                        var velocity_y = 0;
                        var velocity_z = 0;
                        var weight_x = 0;
                        var weight_y = 0;
                        var weight_z = 0;
                        // Get neighboring particles
                        var particles = [];
                        for (var xi = 0; xi < 2; xi++) {
                            for (var yi = -1; yi < 2; yi++) {
                                for (var zi = -1; zi < 2; zi++) {
                                    this.particleGrid[i + xi][j + yi][k + zi].particleIndices.forEach(parIdx => {
                                        particles = particles.concat(this.particleArray[parIdx]);
                                    });
                                }
                            }
                        }
                        // loop through neighbor particles accumulating weight and velocity
                        particles.forEach(p => {
                            var w_x = calcVelWeight(p.pos.clone().sub(xPosition));
                            var w_y = calcVelWeight(p.pos.clone().sub(yPosition));
                            var w_z = calcVelWeight(p.pos.clone().sub(zPosition));

                            velocity_x += p.v.x * w_x;
                            velocity_y += p.v.y * w_y;
                            velocity_z += p.v.z * w_z;
                            weight_x += w_x;
                            weight_y += w_y;
                            weight_z += w_z;
                        });

                        // normalize based on accumulated weights
                        if (weight_x != 0)
                            velocity_x /= weight_x;
                        if (weight_y != 0)
                            velocity_y /= weight_y;
                        if (weight_z != 0)
                            velocity_z /= weight_z;

                        // Assigned interpolated/weighted average velocity components to staggered grid
                        this.particleGrid[i][j][k].velocity_right = velocity_x;
                        this.particleGrid[i+1][j][k].velocity_left = velocity_x;
                        this.particleGrid[i][j][k].velocity_up = velocity_y;
                        this.particleGrid[i][j+1][k].velocity_down = velocity_y;
                        this.particleGrid[i][j][k].velocity_back = velocity_z;
                        this.particleGrid[i][j][k+1].velocity_front = velocity_z;
                    }
                }
            }

            // STEP 3
            // (FLIP) Just save the grid from step 2/3 and keep it persistent
            //this.particleGridCopy = FLIPCopy(this.particleGrid);

            // STEP 4
            // Calculate and Apply Extern Forces (GRAVITY)
            // Add velocities (gravity and user interaction) by simple Euler integration 
            // V_new = V_old + F*delta_t
            for (var i = 1; i < this.simWidth-1; i++) {
                for (var j = 1; j < this.simHeight-1; j++) {
                    for (var k = 1; k < this.simDepth-1; k++) {
                        // Just need to worry about gravity, so change only the y velocities
                        this.particleGrid[i][j][k].velocity_up += this.gravity * delta_t;
                        this.particleGrid[i][j+1][k].velocity_down += this.gravity * delta_t;
                    }
                }
            }

            // STEP 5
            // Enforce Dirichlet Boundary condition: 
            //  "There should be no flow into or out of solid cells to which has the normal n."
            // If a fluid cell has a solid neighboring cell, the velocity componenets are checked and 
            //  if any of the velocity componenets point towards a neighboring solid cell, the velocity 
            //  is projected to go along with the surface of the solid cell
            // Project is simple: set component velocity to 0 if it points into the normal of the solid cell
            for (var i = 0; i < this.simWidth; i++) {
                for (var j = 0; j < this.simHeight; j++) {
                    for (var k = 0; k < this.simDepth; k++) {
                        // Check if velocity component is adjacent to solid (boundary), set velocity to 0 
                        // X VELOCITY
                        if (i == 1) { // left velocity adjacent to solid
                            this.particleGrid[i][j][k].velocity_left = 0;
                            this.particleGrid[i-1][j][k].velocity_right = 0;
                        }
                        if (i == this.simWidth-2) {// right velocity adjacent to solid
                            this.particleGrid[i][j][k].velocity_right = 0;
                            this.particleGrid[i+1][j][k].velocity_left = 0;
                        }
                        // Y VELOCITY
                        if (j == 1) {// up velocity adjacent to solid
                            this.particleGrid[i][j][k].velocity_down = 0;
                            this.particleGrid[i][j-1][k].velocity_up = 0;
                        }
                        if (j == this.simHeight-2) {// down velocity adjacent to solid
                            this.particleGrid[i][j][k].velocity_up = 0;
                            this.particleGrid[i][j+1][k].velocity_down = 0;
                        }
                        // Z VELOCITY
                        if (k == 1) {// front velocity adjacent to solid
                            this.particleGrid[i][j][k].velocity_front = 0;
                            this.particleGrid[i][j][k-1].velocity_back = 0;
                        }
                        if (k == this.simHeight-2) {// down velocity adjacent to solid
                            this.particleGrid[i][j][k].velocity_back = 0;
                            this.particleGrid[i][j][k+1].velocity_front = 0;
                        }
                        if (i == 0 || j == 0 || k == 0 || i == this.simWidth-1 || j == this.simHeight-1 || k == this.simDepth-1) {
                            this.particleGrid[i][j][k].velocity_right = 0;
                            this.particleGrid[i][j][k].velocity_left = 0;
                            this.particleGrid[i][j][k].velocity_up = 0;
                            this.particleGrid[i][j][k].velocity_down = 0;
                            this.particleGrid[i][j][k].velocity_back = 0;
                            this.particleGrid[i][j][k].velocity_front = 0;
                        }
                    }
                }
            }
            
            // STEP 6
            // Update labels of each voxel:
            //  if voxel contains 1 or more particles 
            //      FLUID
            //  else label voxel as air
            //  (Solids are set at the particle initialization step and do not change)
            for (var i = 1; i < this.simWidth-1; i++) {
                for (var j = 1; j < this.simHeight-1; j++) {
                    for (var k = 1; k < this.simDepth-1; k++) {
                        if (this.particleGrid[i][j][k].particleIndices.length != 0) {
                            this.particleGrid[i][j][k].type = FLUID;
                        }
                        else {
                            this.particleGrid[i][j][k].type = AIR;
                        }
                    }
                }
            }

            // Step 7 (CONSERVE MASS)
            // COMPUTATIONALLY HEAVY need to solve Poisson equation
            // decomposition of vector into two parts divergence-free and curl-free parts
            //      V = V_df + V_cf
            // replace curl free with gradient of an unknown scalar since gradient of scalar is curl-free
            //      V = V_df + DELTA * q
            // apply divergence operator (DELTA) to both sides, not changing equality
            //      DELTA * V = DELTA * V_df + DELTA * DELTA * q
            // further simplify since divergence applied to V_df must therefore be equal to zero
            //      DELTA * V = DELTA^2 * q (This is Poisson equation where missing q will solve the equation)
            // q referred to as pseudo-pressure
            // Solve Poisson equation for q
            // left-hand side can be calculated simply by evaluating the divergence of the velocity field.
            // DELTA^2 * q is the Laplace operator and can be solved by using the coefficients obtained from adjacent
            //  cells. However, the adjacent cell coefficients are also unknown. Need to consider fluids against solid 
            //  boundries: solid adjacent cell coefficient is set to 0, and the central cell coefficient is increased by 1
            //  for each solid adjacent boundry
            //  Continue calculating these coefficients creating a massive system equations that needs to be solved of the 
            //  form Ax = b (A = coefficient matrix, b is the divergence of every cell)
            //  Size of coefficient matrix = (width * Height * depth)^2
            //  Solve this equation using interative methods since only 6 cells can be adjacent to a given cell.
            // TODO FIGURE OUT SOLUTION METHOD FOR THIS SYSTEM OF EQUATIONS (Bridson: preconditioned conjugate gradient method)
            // Substract q from the velocities to conserve mass:
            //      V_df = V - DELTA * q
            

            // For the following steps:
                // Use trilinear interplation of the velocities of the eight neighboring grid-velocities to the 
                // particle you are calculating the velocity for
            // Step 8 (FLIP) PARTICLE UPDATE METHOD calcParticleVelocity
                // update the velocity with the new velocity
            // Step 9 (PIC) PARTICLE UPDATE METHOD calcParticleVelocity
                // interpolate the change in velocity and add it to the exiting particle velocity. 
            // Step 10 (PIC/FLIP) PATICLE UPDATE METHDO weightFLIP/PICVelocities
                // linear combination of both resulting values from Step 8 and 9 (can be used to determine viscosity)
            for (var i = 1; i < this.simWidth-1; i++) {
                for (var j = 1; j < this.simHeight-1; j++) {
                    for (var k = 1; k < this.simDepth-1; k++) {
                        var x = i - (this.simWidth / 2);
                        var y = j - (this.simHeight / 2);
                        var z = k - (this.simDepth / 2);
                        if (this.particleGrid[i][j][k].isFluid()) {
                            for (var l = 0; l < this.particleGrid[i][j][k].particleIndices.length; l++) {
                                var gridCell = this.particleGrid[i][j][k];
                                var p = this.particleArray[gridCell.particleIndices[l]];
                                // Calculate new velocity using trilinear interpolation
                                // normalize particle coordinates in respect to grid location (0-1)
                                var x_d = (p.pos.x - x);
                                var y_d = (p.pos.y - y);
                                var z_d = (p.pos.z - z);
                                
                                // FLIP
                                p.setVelocity(gridCell.getVelocity(x_d, y_d, z_d));
                                // PIC
                                // PIC/FLIP
                            }
                        }
                    }
                }
            }

            // Step 11 PARTICLE UPDATE METHOD updateParticlePosition
            // CFL CONDITION: Particles should always move less than one grid-cell in each sub step. 
            //  Take cell width and dividing it by the maximum velocity in the grid to get a stabledt
            //  this stabledt is compared to the actual time step dt, if it is larger than dt, the stabledt is set to dt
            //  the particles are then advected in six sub steps until it has reached dt. 
            // update position based on velocity using RK 2 ODE solver. Errors with penetrating solids, so maybe correct if collision detected
            for (var i = 1; i < this.simWidth-1; i++) {
                for (var j = 1; j < this.simHeight-1; j++) {
                    for (var k = 1; k < this.simDepth-1; k++) {
                        var x = i - (this.simWidth / 2);
                        var y = j - (this.simHeight / 2);
                        var z = k - (this.simDepth / 2);
                        
                        for (var l = 0; l < this.particleGrid[i][j][k].particleIndices.length; l++) {
                            var gridCell = this.particleGrid[i][j][k];
                            var pI = gridCell.particleIndices[l];
                            var p = this.particleArray[gridCell.particleIndices[l]];
                            
                            p.updateMotion(delta_t, gridCell, x, y, z);
                            this.particleGeometry.vertices[pI] = p.pos.clone();
                            p.updateRendering();
                            this.particleGeometry.colors[pI] = p.color.clone();
                            // reset to update for next fluid sim step
                            this.particleArray[pI].gridUpdated = false;
                        }
                    }
                }
            }
            
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

        function h (r) {
            if (r >= 0.0 && r <= 1.0) {
                return 1.0 - r;
            } else if (r >= -1.0 && r <= 0.0) {
                return 1.0 + r;
            } else {
                return 0.0;
            }
        }

        function calcVelWeight (v) {
            return h(v.x) * h(v.y) * h(v.z);
        }
    }
}
