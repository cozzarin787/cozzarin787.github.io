import * as THREE from "../three/build/three.module.js";

export default class SphereObject {
    constructor(position, scene, physicsWorld, rigidBodies) {
        var pos = {x: position[0], y: position[1], z: position[2]};
        var scale = {x: 4, y: 4, z: 4};
        var quat = {x: 0, y: 0, z: 0, w: 1};
        var mass = 1;

        //threeJS Section
        this.cube = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0xff0505}));

        this.cube.position.set(pos.x, pos.y, pos.z);
        this.cube.scale.set(scale.x, scale.y, scale.z);
    
        this.cube.castShadow = true;
        this.cube.receiveShadow = true;
        this.cube.geometry.computeBoundingBox();
        scene.add(this.cube);

        //Ammojs Section
        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
        transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
        var motionState = new Ammo.btDefaultMotionState( transform );

        var colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
        colShape.setMargin( 0.05 );

        var localInertia = new Ammo.btVector3( 0, 0, 0 );
        colShape.calculateLocalInertia( mass, localInertia );

        var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
        var body = new Ammo.btRigidBody( rbInfo );


        physicsWorld.addRigidBody( body );

        this.cube.userData = body;
        rigidBodies.push(this.cube);
    }
}