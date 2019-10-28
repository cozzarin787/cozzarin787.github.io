import * as THREE from "./three/build/three.module.js";
import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js";
import CubeObject from "./SceneObjects/cube.js";
import SphereObject from "./SceneObjects/sphere.js"
import PlaneObject from "./SceneObjects/plane.js";

// Credit to: https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
// Followed this tutorial to create the basic physics engine

export default class SceneManager {
    constructor(canvas) {
        // ThreeJs Graphics Initialization
        const clock = new THREE.Clock();
        const screenDimensions = {
            width: canvas.width,
            height: canvas.height
        };
        const scene = buildScene();
        const renderer = buildRender(screenDimensions);
        const camera = buildCamera(screenDimensions);
        camera.position.set(0, 30, 70);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        const controls = new OrbitControls( camera, renderer.domElement );
        controls.enableKeys = true;
        addSceneLights(scene);

        //AmmoJs Physics Initialization
        const tmpTrans = new Ammo.btTransform();
        const physicsWorld = buildPhysicsWorld();
        const sceneFloor = new PlaneObject(scene, physicsWorld);
        const rigidBodies = [];
        const sceneObjects = [];
        addSphereToScene([camera.position.x,20,camera.position.z - 70], scene, physicsWorld, rigidBodies);
        setupKeyControls();
        
        function buildScene() {
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xbfd1e5);
            return scene;
        }
        function buildRender({ width, height }) {
            const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
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
        function addSceneLights(scene) {
            //Add hemisphere light
            var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.1 );
            hemiLight.color.setHSL( 0.6, 0.6, 0.6 );
            hemiLight.groundColor.setHSL( 0.1, 1, 0.4 );
            hemiLight.position.set( 0, 50, 0 );
            scene.add( hemiLight );

            //Add directional light
            var dirLight = new THREE.DirectionalLight( 0xffffff , 1);
            dirLight.color.setHSL( 0.1, 1, 0.95 );
            dirLight.position.set( -1, 1.75, 1 );
            dirLight.position.multiplyScalar( 100 );
            scene.add( dirLight );

            dirLight.castShadow = true;

            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;

            var d = 50;

            dirLight.shadow.camera.left = -d;
            dirLight.shadow.camera.right = d;
            dirLight.shadow.camera.top = d;
            dirLight.shadow.camera.bottom = -d;

            dirLight.shadow.camera.far = 13500;
        }
        function buildPhysicsWorld() {
            var collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
                dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
                overlappingPairCache    = new Ammo.btDbvtBroadphase(),
                solver                  = new Ammo.btSequentialImpulseConstraintSolver();

            var physicsWorld            = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
            physicsWorld.setGravity(new Ammo.btVector3(0, -15, 0));
            return physicsWorld;
        }
        function updatePhysics( deltaTime ){

            // Step world
            physicsWorld.stepSimulation( deltaTime, 10 );
        
            // Update rigid bodies
            for ( var i = 0; i < rigidBodies.length; i++ ) {
                var objThree = rigidBodies[ i ];
                var objAmmo = objThree.userData;
                var ms = objAmmo.getMotionState();
                if ( ms ) {
        
                    ms.getWorldTransform( tmpTrans );
                    var p = tmpTrans.getOrigin();
                    var q = tmpTrans.getRotation();
                    objThree.position.set( p.x(), p.y(), p.z() );
                    objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
        
                }
            }
        
        }
        function updateKdTree() {

        }
        function addSphereToScene(position, scene, physicsWorld, rigidBodies) {
            sceneObjects.push(new SphereObject(position, scene, physicsWorld, rigidBodies));
        }
        function addCubeToScene(position, scene, physicsWorld, rigidBodies) {
            sceneObjects.push(new CubeObject(position, scene, physicsWorld, rigidBodies));
        }
        function setupKeyControls() {
            document.onkeydown = function(e) {
                var vector = new THREE.Vector3();
                camera.getWorldDirection( vector );
                vector.multiplyScalar(70);
                vector.addVectors(vector, camera.position);
                var position = [vector.x,vector.y+20,vector.z]
                console.log(position)
                switch (e.keyCode) {
                    // Add Sphere
                    case 83:
                        addSphereToScene(position, scene, physicsWorld, rigidBodies);
                        break;
                    case 67:
                        addCubeToScene(position, scene, physicsWorld, rigidBodies);
                        break;
                }
            };
        }
        this.update = function () {
            //console.log(camera.position)
            var deltaTime = clock.getDelta();
            controls.update();
            updatePhysics( deltaTime );
            updateKdTree();
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
