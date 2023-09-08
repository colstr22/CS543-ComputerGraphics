// Colin Streck

// Program Elements
var canvas;
var gl;
var program;

// Pointers for Attributes
var vPositionLoc;
var vNormalLoc;
var vTexCoordLoc;

// Buffers
var positionBuffer;
var normalBuffer;
var texCoordBuffer;

// Object Queues
var unloaded = [];
var loaded = [];

// Perspective
var mainEye = vec3(0.0, 7.5, 7.5);
var mainAt = vec3(0.0, 0.0, 0.0);
var mainUp = vec3(0.0, 7.5 + 1 / Math.sqrt(2), 7.5 - 1 / Math.sqrt(2));
var mainLook = lookAt(mainEye, mainAt, mainUp);
var mainFov = 60;
var mainPerspective = perspective(mainFov, 1, 0.1, 100);
var stationaryCamera = mult(mainPerspective, mainLook);
var carEye = vec3(0.0, 0.0, 0.0);
var carAt = vec3(0.0, 0.0, 1.0);
var carUp = vec3(0.0, 1.0, 0.0);
var carLook = lookAt(carEye, carAt, carUp);
var carFov = 60;
var carPerspective = perspective(carFov, 1, 0.01, 100);
var carCamera = mult(carPerspective, carLook);

// Matrices and Their Storage
var modelView;
var modelViewMatrix;
var projection;
var projectionMatrix;
var currentTransform;

// States
var circularCamera = false;
var lightOn = true;
var carMoving = false;
var textured = 0;
var circularCamera = false;
var carView = false;
var reflectionOn = false;
var refractionOn = false;
var skyboxOn = false; 
var shadowOn = false;

// Values
var carSpeed = 5;
var rotateSpeed = 5;
var cameraTheta = 0;
var carTheta = 0;

// Texture
var texCoordsArray = [];
var stopSignTextured = false;
var stopSignTexture;
var tex;

// Skybox
var k = 25.0;
var skyboxLoaded = false;
var cubeMap;
var cubeMapFaces = {};
var vertices = [
        vec4( -0.5 * k, -0.5 * k,  0.5 * k, 1.0 ),
        vec4( -0.5 * k,  0.5 * k,  0.5 * k, 1.0 ),
        vec4(  0.5 * k,  0.5 * k,  0.5 * k, 1.0 ),
        vec4(  0.5 * k, -0.5 * k,  0.5 * k, 1.0 ),
        vec4( -0.5 * k, -0.5 * k, -0.5 * k, 1.0 ),
        vec4( -0.5 * k,  0.5 * k, -0.5 * k, 1.0 ),
        vec4(  0.5 * k,  0.5 * k, -0.5 * k, 1.0 ),
	vec4(  0.5 * k, -0.5 * k, -0.5 * k, 1.0 )
];

// Light
var lightPosition = vec4(0.0, 5.0, 2.0, 0.0);

// Models
var stopSign;
var lamp;
var car;
var street;
var bunny;

// Precomputed Transformation Matrices
var identity = translate(0.0, 0.0, 0.0);
var stopSignTransform = mult(translate(4.0, 0.0, 0.0), rotateY(270));
var carTransform = mult(translate(3.0, 0.0, 0.0), rotateY(180));
var bunnyTransform = translate(0.0, 0.65, 1.75);

var projectionMatrix;

// ================================ Initial Set Up ============================

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

	// Misc. Settings
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	// Initialize shaders
	program = initShaders(gl, "vshader", "fshader");
	gl.useProgram(program);

	// Set Up GPU Interfacing
	setLocations();
	
	// Load Static Traits
	gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
	
	// Load State Traits
	gl.uniform1i(gl.getUniformLocation(program, "lightOn"), 0);
	gl.uniform1i(gl.getUniformLocation(program, "lightOn"), 1);
	gl.uniform1i(gl.getUniformLocation(program, "reflectionOn"), 0);
	gl.uniform1i(gl.getUniformLocation(program, "refractionOn"), 0);
	gl.uniform1i(gl.getUniformLocation(program, "skyboxOn"), 0);
	gl.uniform1i(gl.getUniformLocation(program, "fShadow"), 0);
	gl.uniform1i(gl.getUniformLocation(program, "textured"), 0);
	gl.uniform1i(gl.getUniformLocation(program, "textureLoaded"), 0);

	// Make the Scene
	unloaded = makeModels();
	makeDefaultTexture();
	getSkyBox();

	window.addEventListener("keydown", keyHandler);
	render();
}

// Load Shader Locations
function setLocations() {

	// Set buffer locations
	positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	texCoordBuffer = gl.createBuffer();
	normalBuffer = gl.createBuffer();

	// Set Array Locations
	projection = gl.getUniformLocation(program, "projectionMatrix");
	modelView = gl.getUniformLocation(program, "modelViewMatrix");

	// set and enable attributes
	vPositionLoc = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPositionLoc, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPositionLoc);

	vNormalLoc = gl.getAttribLocation(program, "vNormal");
	gl.vertexAttribPointer(vNormalLoc, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vNormalLoc);

	vTexCoordLoc = gl.getAttribLocation(program, "vTexCoord");
	gl.vertexAttribPointer(vTexCoordLoc, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vTexCoordLoc);

}

// Parse Model Files
function makeModels() {
	let models = [];
	stopSign = new Model(
		"https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/stopsign.obj",
		"https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/stopsign.mtl",
		"stopSign");
	models.push(stopSign);

	lamp = new Model(
		"https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/lamp.obj",
		"https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/lamp.mtl",
		"lamp");
	models.push(lamp);

	car = new Model(
		"https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/car.obj",
		"https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/car.mtl",
		"car");
	models.push(car);

	street = new Model(
		"https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/street.obj",
		"https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/street.mtl",
		"street");
	models.push(street);

	bunny = new Model(
		"https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/bunny.obj",
		"https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/bunny.mtl",
		"bunny");
	models.push(bunny);
	return models;
}

// ============================= General Rendering ============================
// Continuous Render Calls
function render() {
	// Clear Screen
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.cullFace(gl.BACK);

	
	if (unloaded.length > 0) checkLoadStates();

	if (lightOn) gl.uniform1i(gl.getUniformLocation(program, "lightOn"), 1);
	
	// Projection Matrix
	projectionMatrix = getCamera();
	
	// Render Models
	modelViewMatrix = identity;	
	if (skyboxOn) skybox();

	let stack = [];
	stack.push(modelViewMatrix);
		// Car
		modelViewMatrix = mult(modelViewMatrix, mult(rotateY(carTheta), carTransform));
		if (reflectionOn) gl.uniform1i(gl.getUniformLocation(program, "reflectionOn"), 1);
		if (shadowOn && lightOn) tryToRender(car, true);
		tryToRender(car, false);
		if (reflectionOn) gl.uniform1i(gl.getUniformLocation(program, "reflectionOn"), 0);
		stack.push(modelViewMatrix);
			// Ornament
			modelViewMatrix = mult(modelViewMatrix, bunnyTransform);
			if (refractionOn) gl.uniform1i(gl.getUniformLocation(program, "refractionOn"), 1);
			tryToRender(bunny, false);
			if (refractionOn) gl.uniform1i(gl.getUniformLocation(program, "refractionOn"), 0);
			modelViewMatrix = stack.pop();
			if (carView) {
				stack.push(modelViewMatrix);
					// Camera
					modelViewMatrix = mult(inverse4(modelViewMatrix), translate(0.0, -1.3, 0.0));
					projectionMatrix = mult(carCamera, modelViewMatrix);
					if (carMoving) modelViewMatrix = mult(modelViewMatrix, rotateY(-5.0));
					if (carMoving) projectionMatrix = mult(projectionMatrix, rotateY(-5.0));
				stack.pop();
			}
		modelViewMatrix = stack.pop();
	stack.push(modelViewMatrix);
		// Street
		tryToRender(street, false);
		// Lamp
		tryToRender(lamp, false);
		stack.push(modelViewMatrix);
			// Stop Sign
			modelViewMatrix = mult(modelViewMatrix, stopSignTransform);
			if (shadowOn && lightOn) tryToRender(stopSign, true);
			tryToRender(stopSign, false);
		modelViewMatrix = stack.pop();
	modelViewMatrix = stack.pop();
	
	if (lightOn) gl.uniform1i(gl.getUniformLocation(program, "lightOn"), 0);

	// Pass Projection Matrix
	gl.uniformMatrix4fv(projection, false, flatten(projectionMatrix));
	// Turn off Textures
	textured = 0;	
	gl.uniform1i(gl.getUniformLocation(program, "textured"), textured);

	if (carMoving) carTheta += carSpeed;
	
	// Get next Frame
	requestAnimationFrame(render);
}

// Only Render Loaded Models
function tryToRender(model, shadow) {
	if (loaded.some( load => load.name === model.name)) {
		renderObject(model, shadow);
	}
}

// Manage Whether or Not Models Are Ready
function checkLoadStates() {
	for (var i = 0; i < unloaded.length; i++) {
		if (unloaded[i].objParsed === true && unloaded[i].mtlParsed === true) {
			loaded.push(unloaded[i]);
			unloaded.splice(i, 1);
		}
	}
}

// Render An Individual Model
function renderObject(model, shadow) {
	gl.disable(gl.BLEND);
	
	// Set Appropriate Texture
	if (model.name == "stopSign" && shadow == false) useTexture();

	if (model.name == "bunny" && refractionOn) {
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_COLOR, gl.SRC_COLOR);
	}

	let mvMatrix = modelViewMatrix;
	if (shadow) { 
		mvMatrix = shadowMatrix(mvMatrix);
		gl.uniform1i(gl.getUniformLocation(program, "fShadow"), 1);
	}

	gl.uniformMatrix4fv(modelView, false, flatten(mvMatrix));
	
	// Render faces
	for (let i = 0; i < model.faces.length; i++) {
		// Access Model Information
		let face = model.faces[i];
		let pointsArray = face.faceVertices;
		let normalsArray = face.faceNormals;
		let texCoordsArray = face.faceTexCoords;
		let material = face.material;

		// These Take a Bit to Load
		let fSpecular = model.specularMap.get(material);
		let fDiffuse = model.diffuseMap.get(material);

		// Load Light Maps
		gl.uniform4fv(gl.getUniformLocation(program, "fSpecular"), flatten(fSpecular));
		gl.uniform4fv(gl.getUniformLocation(program, "fDiffuse"), flatten(fDiffuse));

		// Pass Information to GPU
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
	
		// Draw face
		gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
	}
		
	gl.uniform1i(gl.getUniformLocation(program, "fShadow"), 0);
}

// Render An Individual Model
function renderStopSign(model, shadow) {

	useTexture();
	console.log("FLAG");

	let mvMatrix = modelViewMatrix;
	if (shadow) { 
		mvMatrix = shadowMatrix(mvMatrix);
		gl.uniform1i(gl.getUniformLocation(program, "fShadow"), 1);
	}

	gl.uniformMatrix4fv(modelView, false, flatten(mvMatrix));
	
	let localPoints = [];
	let localNormals = [];
	let localTexCoords = [];
	let localMat;
	let localSpec;
	let localDiff;

	// Render faces
	for (let i = 0; i < model.faces.length; i++) {
		// Access Model Information
		let face = model.faces[i];
		localPoints.push(face.faceVertices);
		localNormals.push(face.faceNormals);
		localTexCoords.push(face.faceTexCoords);
		localMat = face.material;

		// These Take a Bit to Load
		localSpec = model.specularMap.get(localMat);
		localDiff = model.diffuseMap.get(localMat);

		}
		
	// Load Light Maps
	gl.uniform4fv(gl.getUniformLocation(program, "fSpecular"), flatten(localSpec));
	gl.uniform4fv(gl.getUniformLocation(program, "fDiffuse"), flatten(localDiff));

	// Pass Information to GPU
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(localPoints), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(localNormals), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(localTexCoords), gl.STATIC_DRAW);

	// Draw face
	gl.drawArrays(gl.TRIANGLES, 0, localPoints.length);

	gl.uniform1i(gl.getUniformLocation(program, "fShadow"), 0);
}

// Render the Skybox
function skybox() {

	if (!skyboxLoaded) return;

	gl.cullFace(gl.FRONT);
	
	// Load Projection and Modelview Matrix
	let projectionMatrix = getCamera();
	gl.uniformMatrix4fv(modelView, false, flatten(modelViewMatrix));
	gl.uniform1i(gl.getUniformLocation(program, "reflectionOn"), 1);
	gl.uniform1i(gl.getUniformLocation(program, "isSkybox"), 1);
	
	// Render Faces
	quad( 1, 0, 3, 2 ); 
	quad( 2, 3, 7, 6 );
	quad( 3, 0, 4, 7 );
	quad( 6, 5, 1, 2 );
	quad( 4, 5, 6, 7 );
	quad( 5, 4, 0, 1 );

	// Reset Settings
	gl.uniform1i(gl.getUniformLocation(program, "reflectionOn"), 0);
	gl.uniform1i(gl.getUniformLocation(program, "isSkybox"), 0);
	gl.cullFace(gl.BACK);
}

// Render Square Face
function quad(a, b, c, d) {
	triangle(vertices[a], vertices[b], vertices[c]);
	triangle(vertices[a], vertices[c], vertices[d]);
}

// Render Triangle
function triangle(a, b, c) {
	
	let points = [a, b, c];
	let normals = [a, b, c];

	// Pass Information to GPU
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

	// Draw face
	gl.drawArrays(gl.TRIANGLES, 0, 3);

}

function shadowMatrix(modelMatrix) {
	// Create Matrix to Project onto XZ-Plane
	let m = translate(0.0, 0.0, 0.0);
	m[3][3] = 0;
	m[3][1] = -1 / lightPosition[1];

	// Transfrom to Center and Back
	let t1 = translate(lightPosition[0], lightPosition[1], lightPosition[2]);
	let t2 = translate(-lightPosition[0], -lightPosition[1], -lightPosition[2]);
	
	t1 = mult(t1, m);
	t1 = mult(t1, t2);

	return mult(t1, modelMatrix);
}

// ==================================== Camera =================================

// Get Projection Matrix
function getCamera() {
	if (circularCamera && !carView) {
		cameraTheta += rotateSpeed;
	}
	return  mult(mult(stationaryCamera, translate(0.0, 0.5 * Math.sin(cameraTheta / 22.5), 0.0)), rotateY(cameraTheta));
}

// ====================================== Input =================================

// User Input (Just Toggling States)
function keyHandler (ev) {
	if (ev.code == "KeyC") circularCamera = !circularCamera;	// toggle circle camera
	if (ev.code == "KeyD") carView = !carView;			// toggle car camera
	if (ev.code == "KeyE") skyboxOn = !skyboxOn;			// toggle skybox
	if (ev.code == "KeyF") refractionOn = !refractionOn;		// toggle ornament refraction
	if (ev.code == "KeyL") lightOn = !lightOn;			// toggle light
	if (ev.code == "KeyM") carMoving = !carMoving;			// toggle car motion
	if (ev.code == "KeyR") reflectionOn = !reflectionOn;		// toggle car reflection
	if (ev.code == "KeyS") shadowOn = !shadowOn;			// toggles shadows
}

// =================================== Texture =================================

// Create Default Texture
function makeDefaultTexture() {
	tex = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE,
		new Uint8Array([0, 255, 0, 255, 0, 0, 255, 255, 0, 255, 0, 255, 0, 0, 255, 255]));
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.uniform1i(gl.getUniformLocation(program, "defaultTex"), 0);
}

// Create New Texture From Image
function configureTexture(image) {
	
	// make texture
	stopSignTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, stopSignTexture);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	
	// Write texture
	gl.uniform1i(gl.getUniformLocation(program, "tex"), 2); 
	gl.uniform1i(gl.getUniformLocation(program, "textureLoaded"), 1); 
	stopSignTextured = true;

	gl.activeTexture(gl.TEXTURE2);
}

// Create Skybox Texture
function configureCubeMap() {
	cubeMap = gl.createTexture();
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapFaces["https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_posx.png"]);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapFaces["https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_negx.png"]);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapFaces["https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_posy.png"]);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapFaces["https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_negy.png"]);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapFaces["https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_posz.png"]);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeMapFaces["https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_negz.png"]);

	gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);
	skyboxLoaded = true;
}

// Use Texture 
function useTexture(model) {
	// Enable Textures
	textured = 1;	
	gl.uniform1i(gl.getUniformLocation(program, "textured"), textured);

	// Make New Texture or Load One
	if (!stopSignTextured) {
		if (stopSign.imagePath != null) {
			getStopSignImage();
		}
	}
}

// Load Image (Called Once) 
function getStopSignImage() {
	var image = new Image();
	image.crossOrigin = "";
	image.src = stopSign.imagePath;
	
	// Use Listener
	image.onload = function() {
		configureTexture(image);
		console.log(image);
	}
}

// Load Skybox
function getSkyBox() {
	getCubeMapFace("https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_negx.png");
	getCubeMapFace("https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_negy.png");
	getCubeMapFace("https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_negz.png");
	getCubeMapFace("https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_posx.png");
	getCubeMapFace("https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_posy.png");
	getCubeMapFace("https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_posz.png");
}

// Create cubeMap Face from Image
function getCubeMapFace(url) {
	var image = new Image();
	image.crossOrigin = "";
	image.src = url;
	image.onload = function () {
		cubeMapFaces[url] = image;
		if (Object.keys(cubeMapFaces).length == 6) {
			configureCubeMap();
		}
	}
}
