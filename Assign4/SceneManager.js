import * as THREE from "./three/build/three.module.js";
import * as dat from "./three/examples/jsm/libs/dat.gui.module.js"
import ParticleSimulator from "./SceneObjects/particleSimulator.js";

export default class SceneManager {
    constructor(canvas) {
        const clock = new THREE.Clock();
        const screenDimensions = {
            width: canvas.width,
            height: canvas.height
        };
        const scene = buildScene();
        addSceneLights(scene);
        const renderer = buildRender(screenDimensions);
        const camera = buildCamera(screenDimensions);
        camera.position.set(0, 0, -20);
        var oldTime = 0;
        var particleSim = new ParticleSimulator();
        particleSim.initializeSimulation(scene);

        // Setup dat.gui
        var gui = new dat.GUI();
        gui.add(particleSim, "emitRate", 1, 1000, 1);
        gui.add(particleSim, "speed", 0.2, 10);
        gui.add(particleSim, "lifeTime", 0.1, 5);
        gui.add(particleSim, "emitterRadius", 0.2, 5);
        gui.addColor(particleSim, "emitColor");
        gui.addColor(particleSim, "fadeColor");

        function buildScene() {
            const scene = new THREE.Scene();
            scene.background = new THREE.Color("#000");
            return scene;
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
            const elapsedTime = clock.getElapsedTime();
            const timeChange = elapsedTime - oldTime;
            oldTime = elapsedTime;
            particleSim.simulateParticles(timeChange);
            renderer.render(scene, camera);
        };

        window.addEventListener( 'mousemove', function ( event ) {
            var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
	        var mouseY = (event.clientY / window.innerHeight) * 2 + 1;
            var vector = new THREE.Vector3(mouseX, mouseY, 0.5);
            vector.unproject( camera );
            var dir = vector.sub( camera.position ).normalize();
            var distance = - camera.position.z / dir.z;
            particleSim.position = camera.position.clone().add( dir.multiplyScalar( distance ) );
        } );

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
