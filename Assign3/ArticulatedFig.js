import Node from "./Node.js"
import * as THREE from "./three/build/three.module.js";

export default class ArticulatedFig {
    constructor(bvhFile, scene) {
        // Get text data from the bvh file
        var root;
        var result = null;
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", bvhFile, false);
        xmlhttp.send();
        if (xmlhttp.status==200) {
            result = xmlhttp.responseText;
        }
        // Begin parsing the file contents
        var bvhData = result.split("\n");
        var numFrames = 0;
        var frameTime = 0;
        var frames = [];
        this.figure = buildFigure(bvhData);
        this.numFrames = numFrames;
        this.frameTime = frameTime;
        console.log(numFrames)
        console.log(frameTime)

        this.update = function(time, keyFrameIndex) {
            // Calculate U value to interpolate on
            var u = ((time - (keyFrameIndex * this.frameTime)) / this.frameTime);
            console.log(u)
            var transMat = new THREE.Matrix4();
            inOrderMoCapApply(u, this.figure, keyFrameIndex, transMat, 0);
        }

        function inOrderMoCapApply(u, currentNode, keyFrameIndex, transMat, mocapIndex) {
            // Calculate Interpolated values between frames for each data point for the currentNode
            var curTransMat = new THREE.Matrix4();
            if (currentNode.channelMask.length == 6) {
                // Interpolation based on u value
                // Translation
                var p0 = new THREE.Vector3(frames[keyFrameIndex][mocapIndex], frames[keyFrameIndex][mocapIndex+1], frames[keyFrameIndex][mocapIndex+2]);
                var p1 = new THREE.Vector3(frames[keyFrameIndex + 1][mocapIndex], frames[keyFrameIndex + 1][mocapIndex+1], frames[keyFrameIndex + 1][mocapIndex+2]);
                mocapIndex += 3;
                var translate = new THREE.Vector3();
                translate.subVectors(p1, p0);
                translate.multiplyScalar(u);
                translate.add(p0);
                curTransMat.setPosition(translate);
                curTransMat.multiply(transMat);
            }
            else {
                curTransMat = transMat.clone();
            }

            // Translate joint
            curTransMat.multiply(currentNode.offsetMat);
            currentNode.sphere.matrix = curTransMat;
            currentNode.updateLines();
            // Orientation
            var q1 = new THREE.Quaternion();
            var q2 = new THREE.Quaternion();
            var newTransMat = curTransMat.clone();
            var rotatMatX = new THREE.Matrix4();
            var rotatMatY = new THREE.Matrix4();
            var rotatMatZ = new THREE.Matrix4();

            var z_axis = new THREE.Vector3(0,0,1);
            q1.setFromAxisAngle(z_axis, (Math.PI/180) * frames[keyFrameIndex][mocapIndex+2]).normalize();
            q2.setFromAxisAngle(z_axis, (Math.PI/180) * frames[keyFrameIndex + 1][mocapIndex+2]).normalize();
            q1.slerp(q2, u);
            q1.normalize();
            rotatMatZ.makeRotationFromQuaternion(q1);

            var x_axis = new THREE.Vector3(1,0,0);
            q1.setFromAxisAngle(x_axis, (Math.PI/180) * frames[keyFrameIndex][mocapIndex]).normalize();
            q2.setFromAxisAngle(x_axis, (Math.PI/180) * frames[keyFrameIndex + 1][mocapIndex]).normalize();
            q1.slerp(q2, u);
            q1.normalize();
            rotatMatX.makeRotationFromQuaternion(q1);

            var y_axis = new THREE.Vector3(0,1,0);
            q1.setFromAxisAngle(y_axis, (Math.PI/180) * frames[keyFrameIndex][mocapIndex+1]).normalize();
            q2.setFromAxisAngle(y_axis, (Math.PI/180) * frames[keyFrameIndex + 1][mocapIndex+1]).normalize();
            q1.slerp(q2, u);
            q1.normalize();
            rotatMatY.makeRotationFromQuaternion(q1);
            
            newTransMat.multiply(rotatMatZ).multiply(rotatMatX).multiply(rotatMatY);
            mocapIndex += 3;

            // Update the children
            if (currentNode.joints.length > 0) {
                currentNode.joints.forEach(child => {
                    inOrderMoCapApply(u, child, keyFrameIndex, newTransMat, mocapIndex);
                });
            }
        }

        function buildFigure(fileLines) {
            // Check beginning for hierarchy and root definitions
            var line = fileLines.shift().trim();
            if (line != "HIERARCHY") {
                console.log("Invalid file format. Exiting");
                return -1;
            }
            var rootParse = fileLines.shift().split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
            
            var nodeName = "";
            if (rootParse[0] == "ROOT") {
                nodeName = rootParse[1];
            }
            var prevNode = null;
            var currentNode = null;
            line = rootParse;
            while(line != "MOTION" && fileLines.length) {
                // Check for End effector or Joint or root
                if (line[0] == "JOINT" || line[0] == "ROOT") {
                    nodeName = line[1];
                    line = fileLines.shift().trim();
                    
                    // Create new node with given parent, offset, and name
                    if (line == "{") {
                        line = fileLines.shift().split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
                        
                        var offset = [parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3])]
                        // Parse channel data 
                        line = fileLines.shift().split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
                        
                        var channelNum = parseInt(line[1]);
                        var channelMask = [];
                        for (var i = 0; i < channelNum; i++) {
                            switch (line[i+2])
                            {
                                case "Xposition":
                                    channelMask.push(0);
                                    break;
                                case "Yposition":
                                    channelMask.push(1);
                                    break;
                                case "Zposition":
                                    channelMask.push(2);
                                    break;
                                case "Zrotation":
                                    channelMask.push(5);
                                    break;
                                case "Xrotation":
                                    channelMask.push(3);
                                    break;
                                case "Yrotation":
                                    channelMask.push(4);
                                    break;
                            }
                        }
                        // Create node 
                        currentNode = new Node(prevNode, nodeName, offset, channelMask, scene);
                        if (prevNode != null) {
                            prevNode.joints.push(currentNode);
                        }
                        prevNode = currentNode;

                        // Get next joint
                        line = fileLines.shift().split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
                    }
                    else {
                        console.log("Error Parsing file: Expected {");
                        return -1;
                    }
                }
                else if (line[0] == "End") {
                    prevNode = currentNode;
                    nodeName = line[0] + " " + line[1];
                    line = fileLines.shift().trim();
                    
                    if (line == "{") {
                        line = fileLines.shift().split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
                        
                        var offset = [line[1], line[2], line[3]];
                        // Create node
                        currentNode = new Node(prevNode, nodeName, offset, [], scene);
                        if (prevNode != null) {
                            prevNode.joints.push(currentNode);
                        }
                        prevNode = currentNode;
                        line = fileLines.shift().trim();
                        
                        // For each end bracket, move back up the parent nodes
                        while (line == "}") {
                            var tmp = currentNode;
                            currentNode = currentNode.parent;
                            if (currentNode != null) {
                                prevNode = currentNode.parent;
                            }
                            else {
                                currentNode = tmp
                            }
                            line = fileLines.shift().trim();
                        }
                        if (currentNode != null) {
                            prevNode = currentNode;
                        }
                        else {

                        }
                        line = line.split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
                    }
                    else {
                        console.log("Error Parsing file: Expected {");
                        return -1;
                    }
                }
                else {
                    console.log("Error Parsing file: Unexpected HIERARCHAL specifier");
                    return -1;
                }
            }
            if (fileLines.length <= 0) {
                console.log("Error: No Motion data");
                return -1;
            }
            // Prepare Motion data            
            if (line != "MOTION") {
                console.log("Error Parsing file: Unexpected MOTION specifier");
                return -1;
            }
            // Get number of frames
            var frameNum = fileLines.shift().split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
            numFrames = parseFloat(frameNum[1]);
            // Get frame time
            var timeFrame = fileLines.shift().split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
            
            frameTime = parseFloat(timeFrame[2]);
            
            fileLines.forEach(element => {
                frames.push(element.split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } ).map(parseFloat));
            });;
            return currentNode;
        }

        this.destroy = function(node) {
            // Destroy sphere
            scene.remove(node.sphere);
            node.sphere.geometry.dispose();
            node.sphere.material.dispose();
            node.sphere = undefined;

            // Destroy line
            if (node.line) {
                scene.remove(node.line);
                node.line.geometry.dispose();
                node.line.material.dispose();
                node.line = undefined;
            }

            if (node.joints.length > 0) {
                node.joints.forEach(child => {
                    this.destroy(child);
                });
            }
        }
    }
}