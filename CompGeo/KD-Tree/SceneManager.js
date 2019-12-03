import * as THREE from "./three/build/three.module.js";
import * as dat from "./three/examples/jsm/libs/dat.gui.module.js"
import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js";
import { DragControls } from "./three/examples/jsm/controls/DragControls.js";
import CubeObject from "./SceneObjects/cube.js";
import SphereObject from "./SceneObjects/sphere.js"
import PlaneObject from "./SceneObjects/plane.js";
import KDTreeBuilder from "./KDTreeClasses/KdTreeBuilder.js"

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
        const orbControls = new OrbitControls( camera, renderer.domElement );
        var dragControls = new DragControls( [], camera, renderer.domElement);
        addSceneLights(scene);

        //AmmoJs Physics Initialization
        const tmpTrans = new Ammo.btTransform();
        const physicsWorld = buildPhysicsWorld();
        const sceneFloor = new PlaneObject(scene, physicsWorld);
        const rigidBodies = [];
        const sceneObjects = [];
        const dragObjects = [];
        addSphereToScene([2,20,2]);
        setupKeyControls();

        // KD-Tree Initialization
        const worldVoxel = new THREE.Box3(new THREE.Vector3(-100,0,-100), new THREE.Vector3(100,50,100))
        const treeBuilder = new KDTreeBuilder();
        var KD_TREE = treeBuilder.getNode(worldVoxel, rigidBodies, 0, scene);

        // Setup dat.gui
        var gui = new dat.GUI();
        gui.add(treeBuilder, "MAX_DEPTH", 1, 25, 1);
        gui.addColor(treeBuilder, "xPartitionColor");
        gui.addColor(treeBuilder, "yPartitionColor");
        gui.addColor(treeBuilder, "zPartitionColor");
        gui.add(treeBuilder, "DisplayKdTree");
        gui.add(treeBuilder, "SurfaceAreaHeuristicParitioning");
        gui.add(treeBuilder, "traversalCostSAH", 1, 10);
        gui.add(treeBuilder, "intersectCostSAH", 1, 10);
        
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
        function addSphereToScene(position) {
            dragControls.dispose();
            sceneObjects.push(new SphereObject(position, scene, physicsWorld, rigidBodies));
            dragObjects.push(sceneObjects[sceneObjects.length - 1].ball)
            dragControls = new DragControls( dragObjects, camera, renderer.domElement);
            dragControls.addEventListener( 'dragstart', function ( event ) {
                orbControls.enabled = false;
                event.object.material.emissive.set( 0xaaaaaa );
            } );
            dragControls.addEventListener( 'drag', function ( event ) {
                event.object.userData.activate();
                var locationX = event.object.position.x;
                var locationZ = event.object.position.z;
                var coords = new THREE.Vector3(locationX, 0, locationZ);
                scene.worldToLocal(coords);
                var a = Math.min(100,Math.max(-100,coords.x));  // clamp coords to the range -19 to 19, so object stays on ground
                var b = Math.min(100,Math.max(-100,coords.z));
                var transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin( new Ammo.btVector3( a, 2, b ) );
                event.object.userData.setWorldTransform(transform);
            } );
            dragControls.addEventListener( 'dragend', function ( event ) {
                orbControls.enabled = true;
                event.object.material.emissive.set( 0x000000 );
            } );
        }
        function addCubeToScene(position) {
            dragControls.dispose();
            sceneObjects.push(new CubeObject(position, scene, physicsWorld, rigidBodies));
            dragObjects.push(sceneObjects[sceneObjects.length - 1].cube)
            dragControls = new DragControls( dragObjects, camera, renderer.domElement);
            dragControls.addEventListener( 'dragstart', function ( event ) {
                orbControls.enabled = false;
                event.object.material.emissive.set( 0xaaaaaa );
            } );
            dragControls.addEventListener( 'drag', function ( event ) {
                event.object.userData.activate();
                var locationX = event.object.position.x;
                var locationZ = event.object.position.z;
                var coords = new THREE.Vector3(locationX, 0, locationZ);
                scene.worldToLocal(coords);
                var a = Math.min(100,Math.max(-100,coords.x));  // clamp coords to the range -19 to 19, so object stays on ground
                var b = Math.min(100,Math.max(-100,coords.z));
                var transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin( new Ammo.btVector3( a, 2, b ) );
                event.object.userData.setWorldTransform(transform);
            } );
            dragControls.addEventListener( 'dragend', function ( event ) {
                orbControls.enabled = true;
                event.object.material.emissive.set( 0x000000 );
            } );
        }
        function setupKeyControls() {
            document.onkeydown = function(e) {
                var vector = new THREE.Vector3();
                camera.getWorldDirection( vector );
                vector.multiplyScalar(70);
                vector.addVectors(vector, camera.position);
                var position = [vector.x,vector.y+20,vector.z]
                switch (e.keyCode) {
                    // Add Sphere
                    case 83:
                        addSphereToScene(position);
                        break;
                    case 67:
                        addCubeToScene(position);
                        break;
                }
            };
        }
        function updateKdTree() {
            treeBuilder.destroy(KD_TREE, scene);
            KD_TREE = treeBuilder.getNode(worldVoxel, rigidBodies, 0, scene);
        }
        this.update = function () {
            var deltaTime = clock.getDelta();
            orbControls.update();
            updatePhysics( deltaTime );
            if (treeBuilder.DisplayKdTree) {
                updateKdTree();
            }
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
