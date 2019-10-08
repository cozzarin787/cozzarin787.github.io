import * as THREE from "./three/build/three.module.js";
import CubeObject from "./SceneObjects/cube.js";
import PlaneObject from "./SceneObjects/plane.js";

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
        camera.position.set(0, 1, 10);
        camera.up = new THREE.Vector3(0, 1, 0);
        camera.lookAt(new THREE.Vector3(11, 0, 0));
        const sceneFloorObject = new PlaneObject(scene);
        var sceneObjects = [];
        
        function buildScene() {
            const scene = new THREE.Scene();
            scene.background = new THREE.Color("#faf7f3");
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
