import * as THREE from "./three/build/three.module.js";
import CubeObject from "./SceneObjects/cube.js";
import KeyFrame from "./KeyFrame.js";

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
        camera.position.set(11, -10, -35);
        camera.up = new THREE.Vector3(0, 1, 0);
        camera.lookAt(new THREE.Vector3(11, 0, 0));
        const sceneObjects = createSceneObjects(scene);
        const keyFrames = parseKeyFrameFile("keyframe-input.txt");
        var keyFrameIndex = 0;
        var oldTime = 0;

        function parseKeyFrameFile(fileName) {
            var keyFrameList = [];
            var result = null;
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", fileName, false);
            xmlhttp.send();
            if (xmlhttp.status==200) {
                result = xmlhttp.responseText;
            }
            var textKeyFrames = result.split("\n");
            textKeyFrames.forEach(keyFrame => {
                keyFrameList.push(new KeyFrame(keyFrame));
            });
            return keyFrameList;
        }
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
            const elapsedTime = clock.getElapsedTime() - oldTime;
            if (elapsedTime > keyFrames[keyFrameIndex+1].t) {
                keyFrameIndex++;
                if (keyFrameIndex == keyFrames.length - 1) {
                    keyFrameIndex = 0;
                    oldTime = clock.getElapsedTime();
                }
            }
            for (let i = 0; i < sceneObjects.length; i++)
                sceneObjects[i].update(elapsedTime, keyFrames, keyFrameIndex);
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
