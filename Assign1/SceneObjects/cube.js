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
        this.update = function (time, keyFrames, keyFrameIndex) {
            // Calculate U value to interpolate on
            var u = (time - keyFrames[keyFrameIndex].t) / (keyFrames[keyFrameIndex + 1].t - keyFrames[keyFrameIndex].t);
            // Check Slowin/out enabled:
            if (document.getElementById('slowInOut').checked) {
                // Map u to be slow in/out
                if (u < 0.5) { 
                    u = 2*u*u;
                } 
                else {
                    u = -1+(4-2*u)*u;
                }
            }
            
            var interpProc = document.getElementById('InterpVal').value;
            if (interpProc === "CatRom") {
                var U = new THREE.Vector4(Math.pow(u, 3), Math.pow(u, 2), u, 1);
                var catRomMat = new THREE.Matrix4();
                catRomMat.set( -1, 3,-3, 1,
                                2,-5, 4,-1,
                               -1, 0, 1, 0,
                                0, 2, 0, 0);
                catRomMat.multiplyScalar(0.5);

                var p0 = new THREE.Vector3();
                if (keyFrameIndex == 0) {
                    p0.set(keyFrames[keyFrameIndex].pos[0], keyFrames[keyFrameIndex].pos[1], keyFrames[keyFrameIndex].pos[2]);
                }
                else {
                    p0.set(keyFrames[keyFrameIndex-1].pos[0], keyFrames[keyFrameIndex-1].pos[1], keyFrames[keyFrameIndex-1].pos[2]);
                }

                // Each key frame will have the current and the next avaliable
                var p1 = new THREE.Vector3(keyFrames[keyFrameIndex].pos[0], keyFrames[keyFrameIndex].pos[1], keyFrames[keyFrameIndex].pos[2]);
                var p2 = new THREE.Vector3(keyFrames[keyFrameIndex+1].pos[0], keyFrames[keyFrameIndex+1].pos[1], keyFrames[keyFrameIndex+1].pos[2]);
                
                // If index is keyFrames.length-1, we do not have a point 2 ahead, generate phantom point
                // using a small epsilon value. In this case 0.0001
                var p3 = new THREE.Vector3();
                if (keyFrameIndex == keyFrames.length-2) {
                    p3.set(keyFrames[keyFrameIndex+1].pos[0], keyFrames[keyFrameIndex+1].pos[1], keyFrames[keyFrameIndex+1].pos[2]);
                }
                else {
                    p3.set(keyFrames[keyFrameIndex+2].pos[0], keyFrames[keyFrameIndex+2].pos[1], keyFrames[keyFrameIndex+2].pos[2]);
                }
                var G_mat = new THREE.Matrix4();
                G_mat.set( p0.x, p0.y, p0.z, 0,
                           p1.x, p1.y, p1.z, 0,
                           p2.x, p2.y, p2.z, 0,
                           p3.x, p3.y, p3.z, 1);
                // G_mat.set( p0.x, p1.x, p2.x, p3.x,
                //            p0.y, p1.y, p2.y, p3.y,
                //            p0.z, p1.z, p2.z, p3.z,
                //            0, 0, 0, 1);
                var m4 = new THREE.Matrix4();
                m4.multiplyMatrices(G_mat, catRomMat);
                U.applyMatrix4(m4);
                var newPosition = new THREE.Vector3(U.x, U.y, U.z);
                
                // Orientation
                var q1 = new THREE.Quaternion();
                var q2 = new THREE.Quaternion();
                var axis1 = new THREE.Vector3(keyFrames[keyFrameIndex].axis[0], keyFrames[keyFrameIndex].axis[1], keyFrames[keyFrameIndex].axis[2]);
                var axis2 = new THREE.Vector3(keyFrames[keyFrameIndex + 1].axis[0], keyFrames[keyFrameIndex + 1].axis[1], keyFrames[keyFrameIndex + 1].axis[2]);
                q1.setFromAxisAngle(axis1, (Math.PI/180) * keyFrames[keyFrameIndex].angle).normalize();
                q2.setFromAxisAngle(axis2, (Math.PI/180) * keyFrames[keyFrameIndex + 1].angle).normalize();
                q1.slerp(q2, u);
                q1.normalize();
                // Construct Transformation Matrix
                // Set the rotation matrix of the transformation matrix of the object
                // Set the position vector of the transformation matrix of the object
                cube.matrix.compose(newPosition, q1, new THREE.Vector3(4, 4, 4));
            }
            else if (interpProc === "de Casteljau Construction") {
                var transU = (u / 2.0) + ((keyFrameIndex % 2) / 2);
                var bezierFrameIndex = keyFrameIndex - (keyFrameIndex % 2);

                var bezierMat = new THREE.Matrix4();
                bezierMat.set( -1, 3,-3, 1,
                                3,-6,-3, 0,
                               -3, 3, 0, 0,
                                1, 0, 0, 0);

                var control_p0 = new THREE.Vector3();
                var control_p1 = new THREE.Vector3();
                var control_p2 = new THREE.Vector3();
                var control_p3 = new THREE.Vector3();
                if (bezierFrameIndex == keyFrames.length - 2) {
                    control_p1 = new THREE.Vector3(keyFrames[bezierFrameIndex-1].pos[0], keyFrames[bezierFrameIndex-1].pos[1], keyFrames[bezierFrameIndex-1].pos[2]);
                    control_p0 = new THREE.Vector3(keyFrames[bezierFrameIndex].pos[0], keyFrames[bezierFrameIndex].pos[1], keyFrames[bezierFrameIndex].pos[2]);
                    control_p3 = new THREE.Vector3(keyFrames[bezierFrameIndex+1].pos[0], keyFrames[bezierFrameIndex+1].pos[1], keyFrames[bezierFrameIndex+1].pos[2]);

                    control_p2.subVectors(control_p3, control_p1);
                    control_p2.add(control_p3);
                }
                else {
                    control_p0 = new THREE.Vector3(keyFrames[bezierFrameIndex].pos[0], keyFrames[bezierFrameIndex].pos[1], keyFrames[bezierFrameIndex].pos[2]);
                    var p1 = new THREE.Vector3(keyFrames[bezierFrameIndex+1].pos[0], keyFrames[bezierFrameIndex+1].pos[1], keyFrames[bezierFrameIndex+1].pos[2]);
                    control_p3 = new THREE.Vector3(keyFrames[bezierFrameIndex+2].pos[0], keyFrames[bezierFrameIndex+2].pos[1], keyFrames[bezierFrameIndex+2].pos[2]);

                    // Vector between p_n-1 and p_n
                    control_p2.subVectors(p1, control_p0);
                    // Add vector to p_n
                    control_p2.add(p1);
                    // average between new point and p_n+1
                    control_p2.add(control_p3);
                    control_p2.divideScalar(2);
                    
                    // Vector between p_n and control_p2
                    control_p1.subVectors(p1, control_p2);
                    // Add vector to p_n
                    control_p1.add(p1);
                }

                var q0 = new THREE.Vector3();
                var q1 = new THREE.Vector3();
                var q2 = new THREE.Vector3();

                q0.lerpVectors(control_p0, control_p1, transU);
                q1.lerpVectors(control_p1, control_p2, transU);
                q2.lerpVectors(control_p2, control_p3, transU);
                var r0 = new THREE.Vector3();
                var r1 = new THREE.Vector3();
                r0.lerpVectors(q0, q1, transU);
                r1.lerpVectors(q1, q2, transU);
                var newPosition = new THREE.Vector3();
                newPosition.lerpVectors(r0, r1, transU);

                // Orientation
                var q1 = new THREE.Quaternion();
                var q2 = new THREE.Quaternion();
                var axis1 = new THREE.Vector3(keyFrames[keyFrameIndex].axis[0], keyFrames[keyFrameIndex].axis[1], keyFrames[keyFrameIndex].axis[2]);
                var axis2 = new THREE.Vector3(keyFrames[keyFrameIndex + 1].axis[0], keyFrames[keyFrameIndex + 1].axis[1], keyFrames[keyFrameIndex + 1].axis[2]);
                q1.setFromAxisAngle(axis1, (Math.PI/180) * keyFrames[keyFrameIndex].angle).normalize();
                q2.setFromAxisAngle(axis2, (Math.PI/180) * keyFrames[keyFrameIndex + 1].angle).normalize();
                q1.slerp(q2, u);
                q1.normalize();
                // Construct Transformation Matrix
                // Set the rotation matrix of the transformation matrix of the object
                // Set the position vector of the transformation matrix of the object
                cube.matrix.compose(newPosition, q1, new THREE.Vector3(4, 4, 4));
            }
            else {
                // Linear interpolation

                // Interpolation based on u value
                // Translation
                var p0 = new THREE.Vector3(keyFrames[keyFrameIndex].pos[0], keyFrames[keyFrameIndex].pos[1], keyFrames[keyFrameIndex].pos[2]);
                var p1 = new THREE.Vector3(keyFrames[keyFrameIndex + 1].pos[0], keyFrames[keyFrameIndex + 1].pos[1], keyFrames[keyFrameIndex + 1].pos[2]);
                var newPosition = new THREE.Vector3();
                newPosition.subVectors(p1, p0);
                newPosition.multiplyScalar(u);
                newPosition.add(p0);
                // Orientation
                var q1 = new THREE.Quaternion();
                var q2 = new THREE.Quaternion();
                var axis1 = new THREE.Vector3(keyFrames[keyFrameIndex].axis[0], keyFrames[keyFrameIndex].axis[1], keyFrames[keyFrameIndex].axis[2]);
                var axis2 = new THREE.Vector3(keyFrames[keyFrameIndex + 1].axis[0], keyFrames[keyFrameIndex + 1].axis[1], keyFrames[keyFrameIndex + 1].axis[2]);
                q1.setFromAxisAngle(axis1, (Math.PI/180) * keyFrames[keyFrameIndex].angle).normalize();
                q2.setFromAxisAngle(axis2, (Math.PI/180) * keyFrames[keyFrameIndex + 1].angle).normalize();
                q1.slerp(q2, u);
                q1.normalize();
                // Construct Transformation Matrix
                // Set the rotation matrix of the transformation matrix of the object
                // Set the position vector of the transformation matrix of the object
                cube.matrix.compose(newPosition, q1, new THREE.Vector3(4, 4, 4));
            }
        };
    }
}
