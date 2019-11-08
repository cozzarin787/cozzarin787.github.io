import * as THREE from "./three/build/three.module.js";
import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js";
import PlaneObject from "./SceneObjects/plane.js";
import ArticulatedFig from "./ArticulatedFig.js"

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
        camera.position.set(-100, 150, 300);
        camera.lookAt(new THREE.Vector3(0, 100, 0));
        const controls = new OrbitControls( camera, renderer.domElement );
        controls.enableKeys = true;
        addSceneLights(scene);
        var keyFrameIndex = 0;
        var oldTime = 0;

        const sceneFloor = new PlaneObject(scene);
        var articulatedFigure = new ArticulatedFig("./BVH_MOCAP/PIck up.bvh", scene);
        
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
            const farPlane = 10000;
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
        this.update = function () {
            const elapsedTime = clock.getElapsedTime() - oldTime;
            while (elapsedTime > (keyFrameIndex+1) * articulatedFigure.frameTime) {
                keyFrameIndex++;
                if (keyFrameIndex == articulatedFigure.numFrames) {
                    keyFrameIndex = 0;
                    oldTime = clock.getElapsedTime();
                    break;
                }
            }
            articulatedFigure.update(elapsedTime, keyFrameIndex);
            controls.update();
            renderer.render(scene, camera);
        };
        document.getElementById("BvhVal").addEventListener("change", function () {
            articulatedFigure.destroy(articulatedFigure.figure);
            articulatedFigure = new ArticulatedFig("./BVH_MOCAP/" + document.getElementById("BvhVal").value, scene);
            
        }, false);
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
