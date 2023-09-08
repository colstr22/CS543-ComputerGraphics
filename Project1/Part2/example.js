/*
 * Extra Credit:
 * Increase speed with 'p'
 * Decrease speed with 'o'
 * Set speed to default with '0'
 * Use mouse wheel to change fov
 */
var canvas
var gl;
var program;
var vBuffer;
var vPosition
var vNormalBuffer;
var vNormal
var moving = false;

// Path Variables
var pathSubdivisions = 0;
var pathControlPoints = [
	vec4(-0.75 * 5, -0.5 * 5, 0.0, 1.0),
	vec4(-0.25 * 5, 0.5 * 5, 0.0, 1.0),
	vec4(0.0 * 5, 0.25 * 5, 0.0, 1.0),
	vec4(0.25 * 5, 0.5 * 5, 0.0, 1.0),
	vec4(0.75 * 5, -0.5 * 5, 0.0, 1.0),
	vec4(0.0 * 5, -0.25 * 5, 0.0, 1.0),
	vec4(0.0 * 5, -0.5 * 5, 0.0, 1.0)
];
var pathPoints, pathNormals;

// Cube Variables
var speed = 0.001;
var cubeSubdivisions = 0;
var points, normals;
var cubeProgressPercent = 0.0;
var vertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5,  0.5, -0.5, 1.0 ),
	vec4(  0.5, -0.5, -0.5, 1.0 )
];

// Camera
var eye = vec3(0.0, 0.0, 20.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var cameraMatrix = lookAt(eye, at, up);
var fov = 30;
var projectionMatrix = perspective(fov, 1, 0.1, 100);
var projMatrix;


var ctMatrixLoc, cameraMatrixLoc;
var ctMatrix;

// Material and Light Properties
var lightPosition = vec4(0.0, 0.0, 20.0, 1.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 20.0;

var diffuseProduct, specularProduct, ambientProduct;

function main() {
	// Retrieve <canvas> element
	canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	gl = WebGLUtils.setupWebGL(canvas, undefined);
	if (!gl) 
	{
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	program = initShaders(gl, "vshader", "fshader");

	// We tell WebGL which shader program to execute.
	gl.useProgram(program);

	// Settings
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.clearColor(0.0, 0.0, 1.0, 1.0);
	gl.viewport( 0, 0, canvas.width, canvas.height );
	
	// Initialize stuff
	cube();
	pathPoints = chaikin(pathControlPoints, pathSubdivisions);

	// Vertices
	vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

	vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	// Normals
	vNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

	vNormal = gl.getAttribLocation(program, "vNormal");
	gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vNormal);

	// camera 
	projMatrix = gl.getUniformLocation(program, 'projMatrix');
	gl.uniformMatrix4fv(projMatrix, false, flatten(projectionMatrix));

	ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	cameraMatrixLoc = gl.getUniformLocation(program, "cameraMatrix");
	gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));

	// Light Calculations
	diffuseProduct = mult(lightDiffuse, materialDiffuse);
	specularProduct = mult(lightSpecular, materialSpecular);
	ambientProduct = mult(lightAmbient, materialAmbient);

	gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
	gl.uniform1f(gl.getUniformLocation(program, "shininess"), flatten(materialShininess));

	// Set default buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)

	// Listen for input
	document.addEventListener("keypress", keyHandler);
	document.addEventListener("wheel", wheelHandler);
	
	// start animating
	render();
}

function render() {	
	projectionMatrix = perspective(fov, 1, 0.1, 100);
	projMatrix = gl.getUniformLocation(program, 'projMatrix');
	gl.uniformMatrix4fv(projMatrix, false, flatten(projectionMatrix));


	// Clean
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.cullFace(gl.BACK);
	

	// Make Path
	pathNormals = [];
	pathPoints = chaikin(pathControlPoints, pathSubdivisions);

	// Set Stationary Model Matrix
	ctMatrix = translate(0.0, 0.0, 0.0);
	gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));

	// Render
	gl.bindBuffer(gl.ARRAY_BUFFER, vNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pathNormals), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pathPoints), gl.STATIC_DRAW);

	gl.drawArrays(gl.LINE_LOOP, 0, (Math.pow(2.0, pathSubdivisions) * 7.0) );

	// Set Moving Model Matrix
	ctMatrix = moveCube();
	gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));
	
	// Render
	gl.bindBuffer(gl.ARRAY_BUFFER, vNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	
	gl.drawArrays(gl.TRIANGLES, 0, points.length);

	// only repeat rendering when necessary
	if (moving) {
		cubeProgressPercent = (cubeProgressPercent + speed) % 1.0; 
		requestAnimationFrame(render);
	}
}


// ===== Cube =====

// makes all faces of the cube
function cube() {
	points = [];
	normals = [];
	quad( 1, 0, 3, 2 );
	quad( 2, 3, 7, 6 );
	quad( 3, 0, 4, 7 );
	quad( 6, 5, 1, 2 );
	quad( 4, 5, 6, 7 );
	quad( 5, 4, 0, 1 );
}

// makes a square face
function quad(a, b, c, d)
{
	divideTriangle(vertices[a], vertices[b], vertices[c], cubeSubdivisions);
	divideTriangle(vertices[a], vertices[c], vertices[d], cubeSubdivisions);
}

// subdivides triangle recursively until depth reached
// then adds all points to lists
function divideTriangle(a, b, c, count) {
	if ( count > 0 ) {

		var ab = mix( a, b, 0.5);
		var ac = mix( a, c, 0.5);
		var bc = mix( b, c, 0.5);

		ab = normalize(ab, true);
		ac = normalize(ac, true);
		bc = normalize(bc, true);

		divideTriangle( a, ab, ac, count - 1 );
		divideTriangle( ab, b, bc, count - 1 );
		divideTriangle( bc, c, ac, count - 1 );
		divideTriangle( ab, bc, ac, count - 1 );
	}
	else {
		triangle( a, b, c );
	}
}

// push points of triangle to lists
function triangle(a, b, c) {
	points.push(a);
	points.push(b);
	points.push(c);

	normals.push(a[0],a[1], a[2], 0.0);
	normals.push(b[0],b[1], b[2], 0.0);
	normals.push(c[0],c[1], c[2], 0.0);
}


// get translation matrix to position, calculated by percent
function moveCube() {
	var pointNum = Math.pow(2.0, pathSubdivisions) * 7.0;
	var prev = Math.floor(pointNum * cubeProgressPercent)  % pointNum;
	var next = Math.ceil(pointNum * cubeProgressPercent)  % pointNum;
	var relativePercent = (cubeProgressPercent * pointNum) % 1.0;
	var pos = mix(pathPoints[prev], pathPoints[next], relativePercent);
	return translate(pos[0], pos[1], 0.0);
}

// ===== Path =====

// subdivide path recusively
function chaikin(vertices, iterations) {
	if (iterations == 0) {
		pathNormals = [];
		for (var i = 0; i < vertices.length; i++) {
			pathNormals.push(0.0, 0.0, 0.0, 0.0);
		}
		return vertices;
	}

	var newVertices = [];
	
	for(var i = 0; i < vertices.length; i++) {
		var v0 = vertices[i % vertices.length];
		var v1 = vertices[(i + 1) % vertices.length];

		var p0 = mix(v0, v1, 0.25);
		var p1 = mix(v0, v1, 0.75);

		newVertices.push(p0, p1);
	}
	return chaikin(newVertices, iterations - 1);
}


// ===== Input =====

function keyHandler(ev) {
	if (ev.key == 'i') {
		if (pathSubdivisions < 8) {
			pathSubdivisions++;
			pathPoints = chaikin(pathControlPoints, pathSubdivisions);
			if (!moving) {
				render();
			}
		}
	}
	else if (ev.key == 'j') {
		if (pathSubdivisions > 0) {
			pathSubdivisions--;
			pathPoints = chaikin(pathControlPoints, pathSubdivisions);
			if (!moving) {
				render();
			}
		}
	}

	else if (ev.key == 'a') {
		moving = !moving;
		render();
	}

	else if (ev.key == '0') {
		speed = 0.001;
	}

	else if (ev.key == 'o') {
		if (speed > 0) {
			speed -= 0.001;
		}
	}

	else if (ev.key == 'p') {
		speed += 0.001;
	}

	else if (ev.key == 'e') {
		if (cubeSubdivisions < 5) {
			cubeSubdivisions++;
			cube();
			if (!moving) {
				render();
			}
		}
	}

	else if (ev.key == 'q') {
		if (cubeSubdivisions > 0) {
			cubeSubdivisions--;
			cube();
			if (!moving) {
				render();
			}
		}
	}
}

function wheelHandler(ev) {
	if (ev.deltaY > 0 && fov > 10) {
		fov -= 10;
		if (!moving) {
			render();
		}
	}
	else if (ev.deltaY < 0 && fov < 90) {
		fov += 10;
		if (!moving) {
			render();
		}
	}
	
}
