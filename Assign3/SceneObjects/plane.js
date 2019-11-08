import * as THREE from "../three/build/three.module.js";

export default class PlaneObject {
    constructor(scene) {
        var pos = {x: 0, y: 1, z: 0};
        var scale = {x: 10000, y: 2, z: 10000};
        var quat = {x: 0, y: 0, z: 0, w: 1};
        var mass = 0;
    
        //threeJS Section
        var blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0xa0afa4}));
    
        blockPlane.position.set(pos.x, pos.y, pos.z);
        blockPlane.scale.set(scale.x, scale.y, scale.z);
    
        blockPlane.castShadow = true;
        blockPlane.receiveShadow = true;
    
        scene.add(blockPlane);
    }
}
