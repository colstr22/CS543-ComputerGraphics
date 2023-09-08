var program;
var gl;
var reader;
var xmlObject;
var viewBox;
var points = [];    // For positions (vec4)
var colors = [];    // For colors (vec4)
var vBuffer = [];
var cBuffer = [];
var vPosition;
var vColor;
var canvas;

// Image transform values
var rVar;
var sVar;
var tVar;

// Mouse info
var lastMousePos;
var neverMoved;

// To ensure linearity
var lock = false;

function main() {
	// Retrieve <canvas> element
	canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	gl = WebGLUtils.setupWebGL(canvas, undefined);

	//Check that the return value is not null.
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	program = initShaders(gl, "vshader", "fshader");
	gl.useProgram(program);

	// Set up the viewport
	gl.viewport(0, 0, canvas.width, canvas.height);

	// Input Listeners
	let inputElement = document.getElementById('fileupload'); 
	inputElement.addEventListener("change", fileHandler);

	document.addEventListener("wheel", wheelHandler);
	document.addEventListener("keypress", keyHandler); 
	canvas.addEventListener("mousemove", mouseHandler);

	resetValues();
}

// ===== Event Handlers =====
function fileHandler(ev) {
    reader = readTextFile(ev);
    reader.onloadend = loadImage;
}

function wheelHandler(ev) {
	if (ev.shiftKey) {
		if (ev.deltaY < 0 && sVar < 10.0) {
			sVar += 0.1;
		}
		else if (ev.deltaY > 0 && sVar > 0.1) {
			sVar -= 0.1;
		}
	}
	else {
		if (ev.deltaY < 0) {
			rVar += 1;
		}
		else if (ev.deltaY > 0) {
			rVar -= 1;
		}
	}
}

function mouseHandler(ev) {
    if (lock) {
        return;
    }
	lock = true;
	if (neverMoved) {
		lastMousePos[0] = ev.clientX;
		lastMousePos[1] = ev.clientY;
		neverMoved = false;
	}
	else if (ev.buttons) {
	        tVar[0] += (ev.clientX - lastMousePos[0]) / canvas.width;
	        tVar[1] -= (ev.clientY - lastMousePos[1]) / canvas.height;
	        lastMousePos[0] = ev.clientX;
	        lastMousePos[1] = ev.clientY;
	}
	else {
		neverMoved = true;
	}
	
	lock = false;
}

function keyHandler(ev) {
    if (ev.key == 'r') {
        resetValues();
    }
}

function loadImage() {
	// viewbox sparsing
	xmlObject = makeXML(reader.result);
	viewBox = xmlGetViewbox(xmlObject, canvas.width, canvas.height);

	// line Parsing
	let lin = xmlGetLines(xmlObject, (0.0, 0.0, 0.0, 1.0));
	points = formatPoints(lin[0]);
	colors = formatColors(lin[1]);

	// make vertex buffer in GPU
	vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);    

	// link vPosition in index.html and main.js
	vPosition = gl.getAttribLocation(program, "vPosition");
	gl.enableVertexAttribArray(vPosition);
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

	// make color buffer in GPU
	cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	// link vColor in index.html and main.js
	vColor = gl.getAttribLocation(program, "vColor");
	gl.enableVertexAttribArray(vColor);
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

	resetValues();

	// call first render for new image
	render();
}

function makeXML(xmlString) {
	let parser = new DOMParser();
	return parser.parseFromString(xmlString, "image/svg+xml");
}
// convert points from (x,y) to (x, y, z, h)
function formatPoints(newPoints) {
	var retPoints = [];
	for (coord of newPoints) {
		retPoints.push(vec4(coord[0], -coord[1], 0.0, 1.0));
	}
	return retPoints;
}

// convert color from RGB to hex
function formatColors(newColors) {
	var retColors = [];
	for (coord of newColors) {
		retColors.push(coord);
	}
	return retColors;
}

// animates scene
function render() {

	// viewbox is min-x min-y width height
	let left = viewBox[0];                  // min-x
	let right = (viewBox[0] + viewBox[2]);
	let bottom = -1 * (viewBox[1] + viewBox[3]);
	let top = -1 * viewBox[1];
	var vMatrix = ortho(left, right, bottom, top, -1.0, 1.0);


	var width = viewBox[2];// - viewBox[0];
	var height = viewBox[3];// - viewBox[1];
	var cMatrix = translate(-width / 2.0, height / 2.0, 0.0);

	var centerMatrix = gl.getUniformLocation(program, "centerMatrix");
 	gl.uniformMatrix4fv(centerMatrix, false, flatten(cMatrix));

	var viewboxMatrix = gl.getUniformLocation(program, "viewboxMatrix");
	gl.uniformMatrix4fv(viewboxMatrix, false, flatten(vMatrix));

	var sMatrix = scalem(sVar, sVar, 1.0);
	var scaleMatrix = gl.getUniformLocation(program, "scaleMatrix");
	gl.uniformMatrix4fv(scaleMatrix, false, flatten(sMatrix));

	var rMatrix = rotateZ(rVar); 
	var rotateMatrix = gl.getUniformLocation(program, "rotateMatrix");
	gl.uniformMatrix4fv(rotateMatrix, false, flatten(rMatrix));

	var tMatrix = translate(tVar[0] + width / 2.0, tVar[1] - height / 2.0 , 0.0);
	var translateMatrix = gl.getUniformLocation(program, "translateMatrix");
	gl.uniformMatrix4fv(translateMatrix, false, flatten(tMatrix));

	// clear frame and draw new one
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.LINES, 0, points.length);
	requestAnimationFrame(render);
}

// return global variables to defaults
function resetValues() {
	sVar = 1.0;
	rVar = 0;
	tVar = [0.0, 0.0];
	lastMousePos = [0.0, 0.0];
	neverMoved = true;
}
