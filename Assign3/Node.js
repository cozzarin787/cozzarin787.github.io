import * as THREE from "./three/build/three.module.js";

export default class Node {
    constructor(_parent, _name, _offset, _channelMask, scene) {
        this.parent = _parent;
        this.name = _name;
        this.offsetMat = new THREE.Matrix4().makeTranslation(_offset[0], _offset[1], _offset[2]);
        this.channelMask = _channelMask;

        this.joints = [];

        // Create 3D Object for joint
        var geometry = new THREE.SphereGeometry(1, 32, 32);
        var material = new THREE.MeshPhongMaterial( {color: 0xff0000} );
        this.sphere = new THREE.Mesh(geometry, material);
        scene.add(this.sphere);
        this.sphere.position.set(_offset[0], _offset[1], _offset[2]);
        this.sphere.matrixAutoUpdate = false;

        this.line = null;
        // Create Line for the bone
        if (this.parent) {
            var lineGeometry = new THREE.Geometry();
            lineGeometry.needsUpdate = true;
            lineGeometry.vertices.push(this.parent.sphere.position);
            lineGeometry.vertices.push(this.sphere.position);
            lineGeometry.verticesNeedUpdate = true;

            var lineMaterial = new THREE.LineBasicMaterial( { color: 0xff0000 } );
            this.line = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(this.line);
        }

        this.updateLines = function() {
            if (this.parent) {
                var translation = new THREE.Vector3();
                var translation2 = new THREE.Vector3();
                var rotation = new THREE.Quaternion();
                var scale = new THREE.Vector3();
                this.parent.sphere.matrix.decompose(translation, rotation, scale);
                this.line.geometry.vertices[0] = translation;
                this.sphere.matrix.decompose(translation2, rotation, scale);
                this.line.geometry.vertices[1] = translation2;
                this.line.geometry.verticesNeedUpdate = true;
            }
        }
    }
}