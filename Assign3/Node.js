import * as THREE from "./three/build/three.module.js";

export default class Node {
    constructor(_parent, _name, _offset, _channelMask, scene) {
        this.parent = _parent;
        this.name = _name;
        this.transMat = new THREE.Matrix4().makeTranslation(_offset[0], _offset[1], _offset[2]);
        this.channelMask = _channelMask;

        this.joints = [];

        // Create 3D Object for joint
        var geometry = new THREE.SphereGeometry(0.5, 32, 32);
        var material = new THREE.MeshPhongMaterial( {color: 0xff0000} );
        this.sphere = new THREE.Mesh(geometry, material);
        scene.add(this.sphere);
        this.sphere.position.set(_offset[0], _offset[1], _offset[2]);
        this.sphere.matrixAutoUpdate = false;
        this.sphere.updateMatrix();

        this.line = null;
        // Create Line for the bone
        if (this.parent) {
            var lineGeometry = new THREE.Geometry();
            lineGeometry.vertices.push(this.parent.sphere.position);
            lineGeometry.vertices.push(this.sphere.position);

            var lineMaterial = new THREE.LineBasicMaterial( { color: 0xff0000 } );
            this.line = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(this.line);
        }

        this.update = function(transVec, rotatVec) {

            this.sphere.updateMatrix();
        }
    }
}