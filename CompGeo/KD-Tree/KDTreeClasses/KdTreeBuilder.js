import KdInterior from "./KdInterior.js"
import KdLeaf from "./KdLeaf.js"
import * as THREE from "../three/build/three.module.js"

export default class KdTreeBuilder {
    constructor() {
        const X_AXIS = 0;
        const Y_AXIS = 1;
        const Z_AXIS = 2;

        this.MAX_DEPTH = 20;
        this.curAxis = 0;
        this.SurfaceAreaHeuristicParitioning = false;
        this.traversalCostSAH = 1;
        this.intersectCostSAH = 1;
        this.xPartitionColor = 0xff0000;
        this.yPartitionColor = 0x00ff00;
        this.zPartitionColor = 0x0000ff;
        this.DisplayKdTree = false;

        this.getPartitionPlane = function(voxel, scene, depth) {
            var spatialMedian = new THREE.Vector3();
            spatialMedian.addVectors(voxel.max, voxel.min).divideScalar(2.0);
            var voxelDistances = new THREE.Vector3();
            voxelDistances.subVectors(voxel.max, voxel.min);

            // Generate Paritioning Plane and add to the scene to visualize
            var geometry;
            var material;
            var plane;
            switch(depth % 3) {
                case X_AXIS:
                    geometry = new THREE.PlaneGeometry(voxelDistances.z, voxelDistances.y);
                    material = new THREE.MeshBasicMaterial({color: this.xPartitionColor, side: THREE.DoubleSide, opacity: 0.1, transparent: true});
                    plane = new THREE.Mesh(geometry, material);
                    plane.position.set(spatialMedian.x, spatialMedian.y, spatialMedian.z);
                    plane.rotation.set(0, Math.PI * (90 / 180), 0);
                    scene.add( plane );
                    break;
                case Y_AXIS:
                    geometry = new THREE.PlaneGeometry(voxelDistances.x, voxelDistances.z);
                    material = new THREE.MeshBasicMaterial({color: this.yPartitionColor, side: THREE.DoubleSide, opacity: 0.1, transparent: true});
                    plane = new THREE.Mesh(geometry, material);
                    plane.position.set(spatialMedian.x, spatialMedian.y, spatialMedian.z);
                    plane.rotation.set(Math.PI * (90 / 180), 0, 0);
                    scene.add( plane );
                    break;
                case Z_AXIS:
                    geometry = new THREE.PlaneGeometry(voxelDistances.x, voxelDistances.y);
                    material = new THREE.MeshBasicMaterial({color: this.zPartitionColor, side: THREE.DoubleSide, opacity: 0.1, transparent: true});
                    plane = new THREE.Mesh(geometry, material);
                    plane.position.set(spatialMedian.x, spatialMedian.y, spatialMedian.z);
                    scene.add( plane );
                    break;
            }
            return plane;
        }

        this.getPartitionPlaneSAH = function(voxel, scene, primitives) {
            // epsilon for plane event positions
            var epsilon = 0.001
            // Optimal plane
            var opt_plane = [Number.MAX_VALUE, 0, X_AXIS];

            // Consider all k dimensions (3)
            for (var k = 0; k < 3; k++) {
                switch (k) {
                    case X_AXIS:
                        // create sorted list of plane checks 
                        var eventList = []
                        primitives.forEach(prim => {
                            if (prim.geometry instanceof THREE.SphereGeometry) {
                                var max = prim.position.x + prim.radius;
                                var min = prim.position.x - prim.radius;
                                eventList.push([min-epsilon, 0]);
                                eventList.push([max+epsilon, 1]);
                            }
                            else {
                                var objBBox = new THREE.Box3().setFromObject(prim);
                                eventList.push([objBBox.min.x-epsilon, 0]);
                                eventList.push([objBBox.max.x+epsilon, 1]);
                            }
                        });
                        // Sort eventList from least to greatest
                        eventList.sort(function(a, b) {
                            if (a[0]-b[0] == 0) {
                                return a[1] - b[1];
                            }
                            else {
                                return a[0] - b[0];
                            }
                        });
                        // Check each plane "event" interatively for the best split candidates
                        var N_L = 0;
                        var N_R = primitives.length;

                        for (var i = 0; i < eventList.length; i++) {
                            var p = eventList[i][0];
                            var p_beg = 0;
                            var p_end = 0;
                            while (i < eventList.length && eventList[i][0] == p && eventList[i][1] == 1) {
                                p_end++;
                                i++;
                            }
                            while (i < eventList.length && eventList[i][0] == p && eventList[i][1] == 0) {
                                p_beg++;
                                i++;
                            }
                            // Found next plane, update left and right prims and calculate SAH
                            N_R -= p_end;
                            var plane_cost = this.calcSAH(voxel, p, X_AXIS, N_L, N_R);
                            if (plane_cost < opt_plane[0]) {
                                opt_plane[0] = plane_cost;
                                opt_plane[1] = p;
                                opt_plane[2] = X_AXIS;
                            }
                            N_L += p_beg;
                        }
                        break;
                    case Y_AXIS:
                        // create sorted list of plane checks 
                        eventList = []
                        primitives.forEach(prim => {
                            if (prim.geometry instanceof THREE.SphereGeometry) {
                                var max = prim.position.y + prim.radius;
                                var min = prim.position.y - prim.radius;
                                eventList.push([min-epsilon, 0]);
                                eventList.push([max+epsilon, 1]);
                            }
                            else {
                                var objBBox = new THREE.Box3().setFromObject(prim);
                                eventList.push([objBBox.min.y-epsilon, 0]);
                                eventList.push([objBBox.max.y+epsilon, 1]);
                            }
                        });
                        // Sort eventList from least to greatest
                        eventList.sort(function(a, b) {
                            if (a[0]-b[0] == 0) {
                                return a[1] - b[1];
                            }
                            else {
                                return a[0] - b[0];
                            }
                        });
                        // Check each plane "event" interatively for the best split candidates
                        var N_L = 0;
                        var N_R = primitives.length;

                        for (var i = 0; i < eventList.length; i++) {
                            var p = eventList[i][0];
                            var p_beg = 0;
                            var p_end = 0;
                            while (i < eventList.length && eventList[i][0] == p && eventList[i][1] == 1) {
                                p_end++;
                                i++;
                            }
                            while (i < eventList.length && eventList[i][0] == p && eventList[i][1] == 0) {
                                p_beg++;
                                i++;
                            }
                            // Found next plane, update left and right prims and calculate SAH
                            N_R -= p_end;
                            var plane_cost = this.calcSAH(voxel, p, Y_AXIS, N_L, N_R);
                            if (plane_cost < opt_plane[0]) {
                                opt_plane[0] = plane_cost;
                                opt_plane[1] = p;
                                opt_plane[2] = Y_AXIS;
                            }
                            N_L += p_beg;
                        }
                        break;
                    case Z_AXIS:
                        // create sorted list of plane checks 
                        eventList = []
                        primitives.forEach(prim => {
                            if (prim.geometry instanceof THREE.SphereGeometry) {
                                var max = prim.position.z + prim.radius;
                                var min = prim.position.z - prim.radius;
                                eventList.push([min-epsilon, 0]);
                                eventList.push([max+epsilon, 1]);
                            }
                            else {
                                var objBBox = new THREE.Box3().setFromObject(prim);
                                eventList.push([objBBox.min.z-epsilon, 0]);
                                eventList.push([objBBox.max.z+epsilon, 1]);
                            }
                        });
                        // Sort eventList from least to greatest
                        eventList.sort(function(a, b) {
                            if (a[0]-b[0] == 0) {
                                return a[1] - b[1];
                            }
                            else {
                                return a[0] - b[0];
                            }
                        });
                        // Check each plane "event" interatively for the best split candidates
                        var N_L = 0;
                        var N_R = primitives.length;

                        for (var i = 0; i < eventList.length; i++) {
                            var p = eventList[i][0];
                            var p_beg = 0;
                            var p_end = 0;
                            while (i < eventList.length && eventList[i][0] == p && eventList[i][1] == 1) {
                                p_end++;
                                i++;
                            }
                            while (i < eventList.length && eventList[i][0] == p && eventList[i][1] == 0) {
                                p_beg++;
                                i++;
                            }
                            // Found next plane, update left and right prims and calculate SAH
                            N_R -= p_end;
                            var plane_cost = this.calcSAH(voxel, p, Z_AXIS, N_L, N_R);
                            console.log(plane_cost)
                            if (plane_cost < opt_plane[0]) {
                                opt_plane[0] = plane_cost;
                                opt_plane[1] = p;
                                opt_plane[2] = Z_AXIS;
                            }
                            N_L += p_beg;
                        }
                        break;
                }
            }
            // Check to see if optimal plane cost is greater than termination cost
            if (opt_plane[0] > this.intersectCostSAH * primitives.length) {
                return false;
            }
            // Construct and return the optimal split plane
            var spatialMedian = new THREE.Vector3();
            spatialMedian.addVectors(voxel.max, voxel.min).divideScalar(2.0);
            var voxelDistances = new THREE.Vector3();
            voxelDistances.subVectors(voxel.max, voxel.min);

            // Generate Paritioning Plane and add to the scene to visualize
            var geometry;
            var material;
            var plane;
            switch(opt_plane[2]) {
                case X_AXIS:
                    geometry = new THREE.PlaneGeometry(voxelDistances.z, voxelDistances.y);
                    material = new THREE.MeshBasicMaterial({color: this.xPartitionColor, side: THREE.DoubleSide, opacity: 0.1, transparent: true});
                    plane = new THREE.Mesh(geometry, material);
                    plane.position.set(opt_plane[1], spatialMedian.y, spatialMedian.z);
                    plane.rotation.set(0, Math.PI * (90 / 180), 0);
                    scene.add( plane );
                    break;
                case Y_AXIS:
                    geometry = new THREE.PlaneGeometry(voxelDistances.x, voxelDistances.z);
                    material = new THREE.MeshBasicMaterial({color: this.yPartitionColor, side: THREE.DoubleSide, opacity: 0.1, transparent: true});
                    plane = new THREE.Mesh(geometry, material);
                    plane.position.set(spatialMedian.x, opt_plane[1], spatialMedian.z);
                    plane.rotation.set(Math.PI * (90 / 180), 0, 0);
                    scene.add( plane );
                    break;
                case Z_AXIS:
                    geometry = new THREE.PlaneGeometry(voxelDistances.x, voxelDistances.y);
                    material = new THREE.MeshBasicMaterial({color: this.zPartitionColor, side: THREE.DoubleSide, opacity: 0.1, transparent: true});
                    plane = new THREE.Mesh(geometry, material);
                    plane.position.set(spatialMedian.x, spatialMedian.y, opt_plane[1]);
                    scene.add( plane );
                    break;
            }
            this.curAxis = opt_plane[2]
            return plane;
        }

        this.calcSAH = function(voxel, p, axis, N_L, N_R) {
            // Create new voxels based on partitioning plane
            var min;
            var max;
            switch (axis)
            {
                case X_AXIS:
                    max = new THREE.Vector3(p, voxel.max.y, voxel.max.z);
                    min = new THREE.Vector3(p, voxel.min.y, voxel.min.z);
                    break;
                case Y_AXIS:
                    max = new THREE.Vector3(voxel.max.x, p, voxel.max.z);
                    min = new THREE.Vector3(voxel.min.x, p, voxel.min.z);
                    break;
                case Z_AXIS:
                    max = new THREE.Vector3(voxel.max.x, voxel.max.y, p);
                    min = new THREE.Vector3(voxel.min.x, voxel.min.y, p);
                    break;
            }
            var vL = new THREE.Box3(voxel.min, max);
            var vR = new THREE.Box3(min, voxel.max);
            // Calculate voxel surface areas
            var SA_v = this.CalcSAVoxel(voxel);
            var SA_vL = this.CalcSAVoxel(vL);
            var SA_vR = this.CalcSAVoxel(vR);
            // Calculate SAH
            return this.traversalCostSAH + (this.intersectCostSAH * (N_L * (SA_vL / SA_v)) + (N_R * (SA_vR / SA_v)));
        }

        this.CalcSAVoxel = function(voxel) {
            return (2 * ((voxel.max.x - voxel.min.x) * (voxel.max.y - voxel.min.y))) +
                   (2 * ((voxel.max.x - voxel.min.x) * (voxel.max.z - voxel.min.z))) +
                   (2 * ((voxel.max.y - voxel.min.y) * (voxel.max.z - voxel.min.z)));
        }

        this.getNode = function(voxel, primitives, depth, scene) {
            if (primitives.length <= 1 || depth == this.MAX_DEPTH) {
                // if (depth == this.MAX_DEPTH) {
                //     console.log("Max depth reached")
                // }
                return new KdLeaf(primitives);
            }
            else {
                var partitionAxis;
                var s_plane;
                // Create a partitioning plane
                if (this.SurfaceAreaHeuristicParitioning) {
                    var s_plane = this.getPartitionPlaneSAH(voxel, scene, primitives);
                    if (!s_plane) {
                        return new KdLeaf(primitives);
                    }
                    partitionAxis = this.curAxis;
                }
                else {
                    var s_plane = this.getPartitionPlane(voxel, scene, depth);
                }

                // Create new voxels based on partitioning plane
                var min;
                var max;
                var seperateValue;
                var color;
                var v1;
                var v2;
                if (this.SurfaceAreaHeuristicParitioning) {
                    switch (this.curAxis)
                    {
                        case X_AXIS:
                            seperateValue = s_plane.position.x;
                            max = new THREE.Vector3(seperateValue, voxel.max.y, voxel.max.z);
                            min = new THREE.Vector3(seperateValue, voxel.min.y, voxel.min.z);
                            color = this.xPartitionColor;
                            break;
                        case Y_AXIS:
                            seperateValue = s_plane.position.y;
                            max = new THREE.Vector3(voxel.max.x, seperateValue, voxel.max.z);
                            min = new THREE.Vector3(voxel.min.x, seperateValue, voxel.min.z);
                            color = this.yPartitionColor;
                            break;
                        case Z_AXIS:
                            seperateValue = s_plane.position.z;
                            max = new THREE.Vector3(voxel.max.x, voxel.max.y, seperateValue);
                            min = new THREE.Vector3(voxel.min.x, voxel.min.y, seperateValue);
                            color = this.zPartitionColor;
                            break;
                    }
                    v1 = new THREE.Box3(voxel.min, max);
                    v2 = new THREE.Box3(min, voxel.max);
                }
                else {
                    switch (depth % 3)
                    {
                        case X_AXIS:
                            seperateValue = (voxel.max.x + voxel.min.x) / 2.0;
                            max = new THREE.Vector3(seperateValue, voxel.max.y, voxel.max.z);
                            min = new THREE.Vector3(seperateValue, voxel.min.y, voxel.min.z);
                            color = this.xPartitionColor;
                            break;
                        case Y_AXIS:
                            seperateValue = (voxel.max.y + voxel.min.y) / 2.0;
                            max = new THREE.Vector3(voxel.max.x, seperateValue, voxel.max.z);
                            min = new THREE.Vector3(voxel.min.x, seperateValue, voxel.min.z);
                            color = this.yPartitionColor;
                            break;
                        case Z_AXIS:
                            seperateValue = (voxel.max.z + voxel.min.z) / 2.0;
                            max = new THREE.Vector3(voxel.max.x, voxel.max.y, seperateValue);
                            min = new THREE.Vector3(voxel.min.x, voxel.min.y, seperateValue);
                            color = this.zPartitionColor;
                            break;
                    }
                    v1 = new THREE.Box3(voxel.min, max);
                    v2 = new THREE.Box3(min, voxel.max);
                }

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
                        if (v2.intersectsSphere(sphere)) {
                            L_2.push(primitives[i]);
                        }
                    }
                    else {
                        var objBBox = new THREE.Box3().setFromObject(primitives[i]);
                        if (v1.intersectsBox(objBBox)) {
                            L_1.push(primitives[i]);
                        }
                        if (v2.intersectsBox(objBBox)) {
                            L_2.push(primitives[i]);
                        }
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