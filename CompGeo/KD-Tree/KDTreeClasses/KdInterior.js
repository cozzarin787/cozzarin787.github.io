export default class KdInterior {
    constructor(_s_plane, _changingAxis, _voxel, _node1, _node2, _helper1, _helper2) {
        this.changingAxis = _changingAxis;
        this.s_plane = _s_plane;
        this.voxel = _voxel;

        this.node1 = _node1;
        this.node2 = _node2;
        this.helper1 = _helper1;
        this.helper2 = _helper2;
    }
}