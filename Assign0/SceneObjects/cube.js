import * as THREE from "../../node_modules/three/build/three.module.js";

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
        var material = new THREE.MeshFaceMaterial(cubeMaterials);
        var cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        cube.position.set(0, 0, -20);
        this.update = function (time) {
            console.log(time);
            cube.position.x = time % 20;
            cube.position.y = time % 20;
            cube.rotation.y = (18 * time) * (Math.PI / 180);
        };
    }
}
