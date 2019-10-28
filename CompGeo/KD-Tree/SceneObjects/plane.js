import * as THREE from "../three/build/three.module.js";

export default class PlaneObject {
    constructor(scene, physicsWorld) {
        var pos = {x: 0, y: 0, z: 0};
        var scale = {x: 200, y: 2, z: 200};
        var quat = {x: 0, y: 0, z: 0, w: 1};
        var mass = 0;
    
        //threeJS Section
        var blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0xa0afa4}));
    
        blockPlane.position.set(pos.x, pos.y, pos.z);
        blockPlane.scale.set(scale.x, scale.y, scale.z);
    
        blockPlane.castShadow = true;
        blockPlane.receiveShadow = true;
    
        scene.add(blockPlane);

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
    }
}
