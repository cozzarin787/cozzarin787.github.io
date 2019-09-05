function CubeObject(scene) {
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshBasicMaterial({color: 0xff0000});
    var cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.set(0, 0, -20);

    this.update = function(time) {
        console.log(time);
        cube.position.x = time % 18;
        cube.position.y = time % 18;
        cube.rotation.y = (18 * time) * (Math.PI / 180);
    }
}