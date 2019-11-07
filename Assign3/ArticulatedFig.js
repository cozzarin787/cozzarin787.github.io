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
        this.frames = frames;

        this.update = function(time, keyFrameIndex) {
            // Calculate U value to interpolate on
            var u = ((time - keyFrameIndex * this.frameTime) / this.frameTime) % 2;
            var transMat = new THREE.Matrix4();
            inOrderMoCapApply(u, keyFrameIndex, transMat);
        }

        function inOrderMoCapApply(u, keyFrameIndex, transMat) {
            // Calculate Interpolated value for 
        }

        function buildFigure(fileLines) {
            // Check beginning for hierarchy and root definitions
            var line = fileLines.shift();
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
            numFrames = frameNum[1];
            // Get frame time
            var timeFrame = fileLines.shift().split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
            
            frameTime = timeFrame[2];
            
            fileLines.forEach(element => {
                frames.push(element.split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } ).map(parseFloat));
            });;
            return currentNode;
        }
    }
}