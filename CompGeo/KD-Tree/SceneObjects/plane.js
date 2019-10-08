import * as THREE from "../three/build/three.module.js";

export default class PlaneObject {
    constructor(scene) {
        var geometry = new THREE.PlaneGeometry(100, 100);
        var planeMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.SingleSide });
        var plane = new THREE.Mesh(geometry, planeMaterial);
        scene.add(plane);
        plane.position.set(0, 0, 0);
        plane.rotation.set((Math.PI/180) * -90, 0, 0);
        this.update = function (time) {
            time;
        };
    }
}
