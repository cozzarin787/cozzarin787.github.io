import * as THREE from "../three/build/three.module.js";

export default class CubeObject {
    constructor(scene) {
        var geometry = new THREE.BoxGeometry(1, 1, 1);
        var cubeMaterials = [
            new THREE.MeshBasicMaterial({ color: 0xff0000 }),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
            new THREE.MeshBasicMaterial({ color: 0x0000ff }),
            new THREE.MeshBasicMaterial({ color: 0xffff00 }),
            new THREE.MeshBasicMaterial({ color: 0xff00ff }),
            new THREE.MeshBasicMaterial({ color: 0x00ffff })
        ];
        var cube = new THREE.Mesh(geometry, cubeMaterials);
        scene.add(cube);
        cube.position.set(0, 0, 0);
        cube.matrixAutoUpdate = false;
        // Update method used to animate the object based upon keyframes
        this.update = function (time) {
            time;
        }
    }
}
