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
        const renderer = buildRender(screenDimensions);
        const camera = buildCamera(screenDimensions);
        camera.position.set(10, 10, 0);
        const sceneObjects = createSceneObjects(scene);
        function buildScene() {
            const scene = new THREE.Scene();
            scene.background = new THREE.Color("#000");
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
        function createSceneObjects(scene) {
            const sceneObjects = [
                new CubeObject(scene)
            ];
            return sceneObjects;
        }
        this.update = function () {
            const elapsedTime = clock.getElapsedTime();
            for (let i = 0; i < sceneObjects.length; i++)
                sceneObjects[i].update(elapsedTime);
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
