import * as THREE from "./three/build/three.module.js";
import CubeObject from "./SceneObjects/cube.js";

export default class SceneManager {
    constructor(canvas) {
        const clock = new THREE.Clock();
        const screenDimensions = {
            width: canvas.width,
            height: canvas.height
        };
        const scene = buildScene();
        const glContext = canvas.getContext( 'webgl2', { alpha: true});
        const renderer = buildRender(screenDimensions, glContext);
        const camera = buildCamera(screenDimensions);
        camera.position.set(0, 1, 10);
        camera.up = new THREE.Vector3(0, 1, 0);
        camera.lookAt(new THREE.Vector3(11, 0, 0));
        var sceneObjects = [];
        
        function buildScene() {
            const scene = new THREE.Scene();
            scene.background = new THREE.Color("#ffffff");
            return scene;
        }
        function buildRender({ width, height }, context) {
            const renderer = new THREE.WebGLRenderer({ canvas: canvas, context: context, antialias: true, alpha: true });
            const DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
            renderer.setPixelRatio(DPR);
            renderer.setSize(width, height);
            renderer.gammaInput = true;
            renderer.gammaOutput = true;
            return renderer;
        }
        function buildCamera({ width, height }) {
            const aspectRatio = width / height;
            const fieldOfView = 60;
            const nearPlane = 1;
            const farPlane = 1000;
            const camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
            return camera;
        }

        // WEBGL COMPONENT METHOD:
        
        // Setup data buffers for WebGL use. These buffers will contain data for particles and grid cells for the GPU
        function createBuffers() {
            
        }

        // FLUID SIMULATION METHOD:

        // Step 1
        function initializeParticleGrid() {
            // Create initial box and subdivide into number of voxels
            // Label most outer voxels as solid
            // Label an inner set of voxels as fluid. 
            // Every voxel labeled as fluid will have 8 particles seeded by randomly placing
            //  them in a 2x2x2 sub-grid. 
            // Also need to initialize velocities of the fluid particles (Coming out of a hose or stagnant water)
            // All other voxels label as air

        }
        // Step 2
        function transferParticleToStaggerGrid(particles) {
            // Interpolate nearby particle velocities to a corresponding stagger grid cube
            // Use trilinear interpolation of the weighted average particle velocities that 
            //  lies in a cube twice the grid cell width where the center is at the grid-velocity component.

        }
        // Step 3 (FLIP) Just save the grid from step 2 and keep it persistent
        // Step 4
        function calcApplyExternForces() {
            // Add velocities (gravity and user interaction) by simple Euler integration 
            // V_new = V_old + F*delta_t
        }
        // Step 5
        function enforceDirichletBoundaryCond() {
            // Enforce Dirichlet Boundary condition: 
            //  "There should be no flow into or out of solid cells to which has the normal n."
            // If a fluid cell has a solid neighboring cell, the velocity componenets are checked and 
            //  if any of the velocity componenets point towards a neighboring solid cell, the velocity 
            //  is projected to go along with the surface of the solid cell
            // Project is simple: set component velocity to 0 if it points into the normal of the solid cell
        }
        // Step 6
        function classifyVoxels() {
            // Update labels of each voxel:
            //  if voxel contains 1 or more particles 
            //      FLUID
            //  else label voxel as air
            //  (Solids are set at the particle initialization step and do not change)

        }
        // Step 7 (CONSERVE MASS)
        function calcPressureGradient() {
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
        }
        // For the following steps:
            // Use trilinear interplation of the velocities of the eight neighboring grid-velocities to the 
            // particle you are calculating the velocity for
        // Step 8 (FLIP) PARTICLE UPDATE METHOD calcParticleVelocity
            // update the velocity with the new velocity
        // Step 9 (PIC) PARTICLE UPDATE METHOD calcParticleVelocity
            // interpolate the change in velocity and add it to the exiting particle velocity. 
        // Step 10 (PIC/FLIP) PATICLE UPDATE METHDO weightFLIP/PICVelocities
            // linear combination of both resulting values from Step 8 and 9 (can be used to determine viscosity)
        // Step 11 PARTICLE UPDATE METHOD updateParticlePosition
            // CFL CONDITION: Particles should always move less than one grid-cell in each sub step. 
            //  Take cell width and dividing it by the maximum velocity in the grid to get a stabledt
            //  this stabledt is compared to the actual time step dt, if it is larger than dt, the stabledt is set to dt
            //  the particles are then advected in six sub steps until it has reached dt. 
        // update position based on velocity using RK 2 ODE solver. Errors with penetrating solids, so maybe correct if collision detected


        this.update = function () {
            for (let i = 0; i < sceneObjects.length; i++)
                sceneObjects[i].update();
            renderer.render(scene, camera);
        };
        this.onWindowResize = function () {
            const { width, height } = canvas;
            screenDimensions.width = width;
            screenDimensions.height = height;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
    }
}
