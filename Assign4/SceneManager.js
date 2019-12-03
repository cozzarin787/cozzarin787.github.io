import * as THREE from "./three/build/three.module.js";
import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js";
import Billard from "./SceneObjects/billard.js";

export default class SceneManager {
    constructor(canvas) {
        const clock = new THREE.Clock();
        const screenDimensions = {
            width: canvas.width,
            height: canvas.height
        };
        const scene = buildScene();
        const renderer = buildRender(screenDimensions);
        const camera = buildCamera(screenDimensions);
        const controls = new OrbitControls( camera, renderer.domElement );
        camera.position.set(10, 10, -20);
        controls.update();
        const poolTable = createPoolTable(scene);
        // Data structure containing pool table cusion normals and a point on the plane of collision
        const poolSideNorms = [[new THREE.Vector3(-1,0,0), new THREE.Vector3((1.298*10 / 2)-0.25,0.5,0)],
                               [new THREE.Vector3(1,0,0), new THREE.Vector3((-1.298*10 / 2)+0.25,0.5,0)],
                               [new THREE.Vector3(0,0,-1), new THREE.Vector3(0,0.5,(2.438*10 / 2) - 0.3)],
                               [new THREE.Vector3(0,0,1), new THREE.Vector3(0,0.5,(-2.438*10 / 2) + 0.3)]
                              ]
        const sceneObjects = createBillards(scene);
        var oldTime = 0;

        function buildScene() {
            const scene = new THREE.Scene();
            scene.background = new THREE.Color("#000");
            var light = new THREE.PointLight( 0xffffff, 1, 100 );
            var ambLight = new THREE.AmbientLight( 0xffffff, 0.2);
            light.position.set( 0, 25, 0);
            scene.add( light );
            scene.add( ambLight );
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

        function createPoolTable(scene) {
            // Create pool table
            const poolTable = [];
            var poolFloorGeo = new THREE.BoxGeometry(1.298*10, 0.5, 2.438*10);
            var poolCusionGeo1 = new THREE.BoxGeometry(0.5, 1, 2.5*10);
            var poolCusionGeo2 = new THREE.BoxGeometry(1.298*10, 1, 0.6);
            var poolMaterial = new THREE.MeshPhongMaterial({color: 0x0a6c03});
            var poolCusionMaterial = new THREE.MeshPhongMaterial({color: 0x8b5a2b});
            var poolFloor = new THREE.Mesh(poolFloorGeo, poolMaterial);
            poolFloor.translateY(-0.25);

            var poolSide1 = new THREE.Mesh(poolCusionGeo1, poolCusionMaterial);
            poolSide1.translateX(1.298*10 / 2);
            var poolSide2 = new THREE.Mesh(poolCusionGeo1, poolCusionMaterial);
            poolSide2.translateX(-1.298*10 / 2);
            var poolSide3 = new THREE.Mesh(poolCusionGeo2, poolCusionMaterial);
            poolSide3.translateZ(2.438*10 / 2);
            var poolSide4 = new THREE.Mesh(poolCusionGeo2, poolCusionMaterial);
            poolSide4.translateZ(-2.438*10 / 2);

            scene.add( poolFloor );
            scene.add( poolSide1 );
            scene.add( poolSide2 );
            scene.add( poolSide3 );
            scene.add( poolSide4 );
            poolTable.push( poolFloor );
            poolTable.push( poolSide1 );
            poolTable.push( poolSide2 );
            poolTable.push( poolSide3 );
            poolTable.push( poolSide4 );
            
            return poolTable;
        }

        function createBillards(scene) {
            const sceneObjects = [
                new Billard(scene, 0xffffff, 0, 0.5, -6),
                new Billard(scene, 0xffff00, 0, 0.5, 5.9),
                new Billard(scene, 0x9f00ff, -0.51, 0.5, 6.95),
                new Billard(scene, 0xff0000, 0.51, 0.5, 6.95),
                new Billard(scene, 0x3f00f0, -1.01, 0.5, 7.95),
                new Billard(scene, 0x000000, 0, 0.5, 7.95),
                new Billard(scene, 0x0000ff, 1.01, 0.5, 7.95),
                new Billard(scene, 0xff3f00, -1.53, 0.5, 8.95),
                new Billard(scene, 0x0f3f00, -0.50, 0.5, 8.95),
                new Billard(scene, 0x000f3f, 0.51, 0.5, 8.95),
                new Billard(scene, 0x0fffff, 1.53, 0.5, 8.95)
            ];
            return sceneObjects;
        }
        this.update = function () {
            const elapsedTime = clock.getElapsedTime();
            const timeChange = elapsedTime - oldTime;
            oldTime = elapsedTime;
            
            for (let i = 0; i < sceneObjects.length; i++) {
                // Calc Forces, Update position / rotation, Update Momentum
                sceneObjects[i].update(elapsedTime, timeChange);
            }

            // Collision detection / response
            var e = parseFloat(document.getElementById("CoERestitution").value) / 100;
            var impulses = [];
            for (let i = 0; i < sceneObjects.length; i++)
                impulses.push(new THREE.Vector3());

            for (let i = 0; i < sceneObjects.length; i++) {
                // Detect Ball-to-Ball Collision
                for (let j = i; j < sceneObjects.length; j++) {
                    if (i != j) {
                        var d_T = sceneObjects[i].sphere.position.distanceTo(sceneObjects[j].sphere.position);
                        if (d_T <= sceneObjects[i].r + sceneObjects[j].r) {
                            // Collision Detected
                            // Back up collision
                            // If current object is colliding, but isn't moving, backup the other object before the collision
                            var v1 = new THREE.Vector3(sceneObjects[i].v.x, sceneObjects[i].v.y, sceneObjects[i].v.z);
                            v1.normalize();
                            v1.multiplyScalar(-1);
                            var v2 = new THREE.Vector3(sceneObjects[j].v.x, sceneObjects[j].v.y, sceneObjects[j].v.z);
                            v2.normalize();
                            v2.multiplyScalar(-1);
                            var pos1 = sceneObjects[i].sphere.position;
                            var pos2 = sceneObjects[j].sphere.position;

                            var prevPos1 = pos1;
                            var prevPos2 = pos2;
                            pos1.add(v1.multiplyScalar(2*sceneObjects[i].r - d_T + 0.05));
                            d_T = pos1.distanceTo(pos2);

                            if (d_T <= sceneObjects[i].r + sceneObjects[j].r) {
                                pos1 = prevPos1;
                                pos2.add(v2.multiplyScalar(2*sceneObjects[i].r - d_T + 0.05));
                                d_T = pos1.distanceTo(pos2);
                                var toggleCount = 0;
                                pos2 = prevPos2;
                                while (d_T <= sceneObjects[i].r + sceneObjects[j].r) {
                                    if (toggleCount < 5) {
                                        var incVec = new THREE.Vector3().set(v1.x, v1.y, v1.z).divideScalar(2)
                                        pos1.add(incVec);
                                        d_T = pos1.distanceTo(pos2);
                                    } 
                                    else {
                                        pos1 = prevPos1;
                                        var incVec = new THREE.Vector3().set(v1.x, v1.y, v1.z).divideScalar(2)
                                        pos1.add(incVec);
                                        d_T = pos1.distanceTo(pos2);
                                    }
                                }
                            }

                            // calculate line of action n
                            var n = new THREE.Vector3();
                            n.subVectors(sceneObjects[j].sphere.position, sceneObjects[i].sphere.position);
                            n.normalize();
                            // Calc impulse                         
                            impulses[i].set(n.x, n.y, n.z);
                            impulses[i].multiplyScalar(((sceneObjects[j].v.dot(n) - sceneObjects[i].v.dot(n))));
                            // Update velocity for next step
                            var oppositeImpulse = new THREE.Vector3();
                            oppositeImpulse.set(impulses[i].x, impulses[i].y, impulses[i].z).multiplyScalar(-1);
                            impulses[j] = oppositeImpulse;
                        }
                    }
                }
                sceneObjects[i].updateVelocity(impulses[i]);
                // Detect Ball-to-Cusion Collision
                for (let k = 1; k < poolTable.length; k++) {
                    var result = new THREE.Vector3();
                    var d = result.subVectors(sceneObjects[i].sphere.position, poolSideNorms[k-1][1]).dot(poolSideNorms[k-1][0]);
                    if (d <= sceneObjects[i].r) {
                        // Collision Detected
                        // Back up collision
                        var v = new THREE.Vector3(poolSideNorms[k-1][0].x, poolSideNorms[k-1][0].y, poolSideNorms[k-1][0].z);
                        sceneObjects[i].sphere.position.add(v.multiplyScalar(sceneObjects[i].r - d));

                        // reflect over the normal with some loss of energy due to e
                        var eVec = new THREE.Vector3(poolSideNorms[k-1][0].x, poolSideNorms[k-1][0].y, poolSideNorms[k-1][0].z);
                        sceneObjects[i].v.subVectors(sceneObjects[i].v, eVec.multiplyScalar(2 * sceneObjects[i].v.dot(eVec)));
                        sceneObjects[i].v.multiplyScalar(e);
                    }
                }
            }
            // Render Frame
            controls.update();
            renderer.render(scene, camera);
        };

        document.getElementById("StartSim").onclick = function () {
            sceneObjects[0].calcInitialForce(0,0,parseFloat(document.getElementById("impulseForce").value));
        }

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
