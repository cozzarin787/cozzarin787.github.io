import * as THREE from "../three/build/three.module.js";
import KeyFrame from "../KeyFrame.js";

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
        this.update = function (time, keyFrame1, keyFrame2) {
            // linear interpolation
            var u = (time - keyFrame1.t) / (keyFrame2.t - keyFrame1.t);

            // Interpolation based on u value
            // Translation
            var p0 = new THREE.Vector3(keyFrame1.pos[0], keyFrame1.pos[1], keyFrame1.pos[2]);
            var p1 = new THREE.Vector3(keyFrame2.pos[0], keyFrame2.pos[1], keyFrame2.pos[2]);
            var newPosition = new THREE.Vector3();
            newPosition.subVectors(p1, p0);
            newPosition.multiplyScalar(u);
            newPosition.add(p0);
            // Orientation
            var q1 = new THREE.Quaternion();
            var q2 = new THREE.Quaternion();
            var axis1 = new THREE.Vector3(keyFrame1.axis[0], keyFrame1.axis[1], keyFrame1.axis[2]);
            var axis2 = new THREE.Vector3(keyFrame2.axis[0], keyFrame2.axis[1], keyFrame2.axis[2]);
            q1.setFromAxisAngle(axis1, (Math.PI/180) * keyFrame1.angle).normalize();
            q2.setFromAxisAngle(axis2, (Math.PI/180) * keyFrame2.angle).normalize();
            q1.slerp(q2, u);
            q1.normalize();
            // Construct Transformation Matrix
            // Set the rotation matrix of the transformation matrix of the object
            // Set the position vector of the transformation matrix of the object
            cube.matrix.compose(newPosition, q1, new THREE.Vector3(4, 4, 4));
            console.log(cube.matrix);
        };
    }
}
