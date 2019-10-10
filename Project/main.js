import { WEBGL } from './three/examples/jsm/WebGL.js'
import SceneManager from "./SceneManager.js";

const canvas = document.getElementById("canvas");
const sceneManager = new SceneManager(canvas);

if ( WEBGL.isWebGL2Available() === false ) {
	document.body.appendChild( WEBGL.getWebGL2ErrorMessage() );
}
else {
    bindEventListeners();
    render();
}

function bindEventListeners() {
    window.onresize = resizeCanvas;
    resizeCanvas();	
}

function resizeCanvas() {
    canvas.style.width = "100%";
    canvas.style.height= "100%";
    
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    sceneManager.onWindowResize();
}

function render() {
    requestAnimationFrame(render);
    sceneManager.update();
}