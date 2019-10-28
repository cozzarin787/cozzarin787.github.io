import KdInterior from "./KdInterior.js.js"
import KdLeaf from "./KdLeaf.js.js"
import * as THREE from "../three/build/three.module.js"

export default class KdTreeBuilder {
    constructor() {
        const X_AXIS = 0;
        const Y_AXIS = 1;
        const Z_AXIS = 2;

        const MAX_DEPTH = 15;
        this.curAxis = 0;

        this.getPartitionPlane = function(voxel, scene) {
            // Alternate axis
            this.curAxis++;

            var normal = new THREE.Vector3();
            var spatialMedian = new THREE.Vector3();
            spatialMedian.addVectors(voxel.max, voxel.min).divideScalar(2.0);
            var voxelDistances = new THREE.Vector3();
            voxelDistances.subVectors(voxel.max, voxel.min);

            // Generate Paritioning Plane and add to the scene to visualize
            var geometry;
            var material;
            var plane;
            switch(this.curAxis % 3) {
                case X_AXIS:
                    normal.set(1, 0, 0);
                    geometry = new THREE.PlaneGeometry(voxelDistances.z, voxelDistances.y);
                    material = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide, opacity: 0.1, transparent: true});
                    plane = new THREE.Mesh(geometry, material);
                    plane.position.set(spatialMedian.x, spatialMedian.y, spatialMedian.z);
                    plane.rotation.set(0, Math.PI * (90 / 180), 0);
                    scene.add( plane );
                    break;
                case Y_AXIS:
                    normal.set(0, 1, 0);
                    geometry = new THREE.PlaneGeometry(voxelDistances.x, voxelDistances.z);
                    material = new THREE.MeshBasicMaterial({color: 0x00ff00, side: THREE.DoubleSide, opacity: 0.1, transparent: true});
                    plane = new THREE.Mesh(geometry, material);
                    plane.position.set(spatialMedian.x, spatialMedian.y, spatialMedian.z);
                    plane.rotation.set(Math.PI * (90 / 180), 0, 0);
                    scene.add( plane );
                    break;
                case Z_AXIS:
                    normal.set(0, 0, 1);
                    geometry = new THREE.PlaneGeometry(voxelDistances.x, voxelDistances.y);
                    material = new THREE.MeshBasicMaterial({color: 0x0000ff, side: THREE.DoubleSide, opacity: 0.1, transparent: true});
                    plane = new THREE.Mesh(geometry, material);
                    plane.position.set(spatialMedian.x, spatialMedian.y, spatialMedian.z);
                    scene.add( plane );
                    break;
            }
            return plane;
        }

        this.getNode = function(voxel, primitives, depth, scene) {
            if (primitives.length <= 1 || depth == MAX_DEPTH) {
                if (depth == MAX_DEPTH) {
                    console.log("Max depth reached")
                }
                return new KdLeaf(primitives);
            }
            else {
                // Create a partitioning plane
                var s_plane = this.getPartitionPlane(voxel, scene);
                var partitionAxis = this.curAxis % 3;

                // Create new voxels based on partitioning plane
                var min;
                var max;
                var seperateValue;
                var color;
                switch (this.curAxis % 3)
                {
                    case X_AXIS:
                        seperateValue = (voxel.max.x + voxel.min.x) / 2.0;
                        max = new THREE.Vector3(seperateValue, voxel.max.y, voxel.max.z);
                        min = new THREE.Vector3(seperateValue, voxel.min.y, voxel.min.z);
                        color = 0xff0000;
                        break;
                    case Y_AXIS:
                        seperateValue = (voxel.max.y + voxel.min.y) / 2.0;
                        max = new THREE.Vector3(voxel.max.x, seperateValue, voxel.max.z);
                        min = new THREE.Vector3(voxel.min.x, seperateValue, voxel.min.z);
                        color = 0x00ff00;
                        break;
                    case Z_AXIS:
                        seperateValue = (voxel.max.z + voxel.min.z) / 2.0;
                        max = new THREE.Vector3(voxel.max.x, voxel.max.y, seperateValue);
                        min = new THREE.Vector3(voxel.min.x, voxel.min.y, seperateValue);
                        color = 0x0000ff;
                        break;
                }
                var v1 = new THREE.Box3(voxel.min, max);
                var v2 = new THREE.Box3(min, voxel.max);

                // Create visualization of voxels
                var helper1 = new THREE.Box3Helper( v1, color );
                scene.add( helper1 );
                var helper2 = new THREE.Box3Helper( v2, color );
                scene.add( helper2 );

                // Split list of objects based on the partitioning plane
                var L_1 = [];
                var L_2 = [];
                for (var i = 0; i < primitives.length; i++) {
                    if (primitives[i].geometry instanceof THREE.SphereGeometry) {
                        var sphere = new THREE.Sphere(primitives[i].position, primitives[i].radius);
                        if (v1.intersectsSphere(sphere)) {
                            L_1.push(primitives[i]);
                        }
                        else if (v2.intersectsSphere(sphere)) {
                            L_2.push(primitives[i]);
                        }
                        // else {
                        //     L_1.push(primitives[i]);
                        //     L_2.push(primitives[i]);
                        // }
                    }
                    else {
                        var objBBox = new THREE.Box3().setFromObject(primitives[i]);
                        if (v1.intersectsBox(objBBox)) {
                            L_1.push(primitives[i]);
                        }
                        else if (v2.intersectsBox(objBBox)) {
                            L_2.push(primitives[i]);
                        }
                        // else {
                        //     L_1.push(primitives[i]);
                        //     L_2.push(primitives[i]);
                        // }
                    }
                }
                
                // Create new nodes for the 2 voxels created
                return new KdInterior(s_plane, partitionAxis, voxel, this.getNode(v1, L_1, depth+1, scene), this.getNode(v2, L_2, depth+1, scene), helper1, helper2);
            }
        }

        this.destroy = function(KdNode, scene) {
            if (KdNode instanceof KdLeaf) {
                return
            }
            else {
                // Destroy plane
                scene.remove(KdNode.s_plane);
                KdNode.s_plane.geometry.dispose();
                KdNode.s_plane.material.dispose();
                KdNode.s_plane = undefined;
                // Destroy Helper Voxel 1
                scene.remove(KdNode.helper1);
                KdNode.helper1 = undefined;
                // Destroy Helper Voxel 2
                scene.remove(KdNode.helper2);
                KdNode.helper2 = undefined;

                this.destroy(KdNode.node1, scene);
                this.destroy(KdNode.node2, scene);
            }
        }
    }
}