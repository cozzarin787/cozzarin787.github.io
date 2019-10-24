import * as THREE from "../three/build/three.module.js";

export default class Billard {
    constructor(scene, color, x, y, z) {
        var geometry = new THREE.SphereGeometry(0.5, 32, 32);
        var material = new THREE.MeshPhongMaterial( {color: color} );
        this.sphere = new THREE.Mesh(geometry, material);
        scene.add(this.sphere);
        this.sphere.position.set(x, y, z);
        this.sphere.matrixAutoUpdate = true;

        this.g = 9.807;
        this.m = 170;
        this.r = 0.5;
        this.M = new THREE.Vector3();
        this.F = new THREE.Vector3();
        this.a = new THREE.Vector3();
        this.v = new THREE.Vector3();
        this.torque = new THREE.Vector3();
        this.I = new THREE.Matrix3(); 
        this.I.multiplyScalar((2.0/5.0) * this.mass * (this.r * this.r));

        // Update method used to animate the object based upon keyframes
        this.update = function (t, delta_t) {
            var u_s = parseFloat(document.getElementById("SlidingFriction").value) / 100;
            var u_r = parseFloat(document.getElementById("RollingFriction").value) / 100;
            
            // Calculate Forces: F(t), torque(t)
            var calcFricSwitch = new THREE.Vector3(this.v.x, this.v.y, this.v.z);
            var time_of_nat_roll = calcFricSwitch.multiplyScalar(2.0/(7.0 * u_s * this.g));
            var F_fric = 0;
            if (t >= time_of_nat_roll) {
                F_fric = u_r*this.m*this.g;
            }
            else {
                F_fric = u_s*this.m*this.g;
            }
            // Integrate position/rotation
            // Find new position
            var s = new THREE.Vector3();
            s.addVectors(this.sphere.position, this.integrate(this.v.x, this.v.y, this.v.z, delta_t));
            this.sphere.position.set(s.x, s.y, s.z);
            // Find new rotation
            
            // Update Translational Momentum
            this.M.addVectors(this.M, this.integrate(this.F.x, this.F.y, this.F.z, delta_t));
            // Update Rotational Momentum

        };

        // Give initial force 
        this.calcInitialForce = function (x, y, z) {
            this.M = new THREE.Vector3(x, y, z);
        }

        this.integrate = function(x, y, z, delta_t) {
            var integrated = new THREE.Vector3(x, y, z);
            integrated.multiplyScalar(delta_t);
            return integrated;
        }

        this.updateVelocity = function(J) {
            // Update Translational Velocity
            var newV = new THREE.Vector3(this.M.x, this.M.y, this.M.z);
            newV.divideScalar(this.m);
            this.v.addVectors(newV, J);
            // Update Rotational Velocity
        }
    }
}
