import * as THREE from "../three/build/three.module.js";

export default class SphereObject {
    constructor(position, scene, physicsWorld, rigidBodies) {
        var pos = {x: position[0], y: position[1], z: position[2]};
        var radius = 2;
        var quat = {x: 0, y: 0, z: 0, w: 1};
        var mass = 1;

        //threeJS Section
        this.ball = new THREE.Mesh(new THREE.SphereBufferGeometry(radius), new THREE.MeshPhongMaterial({color: 0xff0505}));

        this.ball.position.set(pos.x, pos.y, pos.z);

        this.ball.castShadow = true;
        this.ball.receiveShadow = true;
        this.ball.geometry.computeBoundingBox();
        scene.add(this.ball);

        //Ammojs Section
        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
        transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
        var motionState = new Ammo.btDefaultMotionState( transform );

        var colShape = new Ammo.btSphereShape( radius );
        colShape.setMargin( 0.05 );

        var localInertia = new Ammo.btVector3( 0, 0, 0 );
        colShape.calculateLocalInertia( mass, localInertia );

        var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
        var body = new Ammo.btRigidBody( rbInfo );

        physicsWorld.addRigidBody( body );

        this.ball.userData = body;
        rigidBodies.push(this.ball);
    }
}