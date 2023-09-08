var program;
var gl;
var imageNumberLocation;

var buffer;



/* 
 * Extra Credit:
 * Soft Shadows are used in Image 1 and Image 3
 */


function main()
{
	// Create Buttons and  Listeners
	var button1 = document.getElementById("button1");
	var button2 = document.getElementById("button2");
	var button3 = document.getElementById("button3");
	button1.addEventListener("click", image1);
	button2.addEventListener("click", image2);
	button3.addEventListener("click", image3);
	
	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');
	
	// Get the rendering context for WebGL
	gl = WebGLUtils.setupWebGL(canvas, undefined);
	if (!gl)
	{
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	program = initShaders(gl, "vshader", "fshader");
	gl.useProgram(program);

	gl.viewport( 0, 0, canvas.width, canvas.height );

	// Set clear color
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


	imageNumberLocation = gl.getUniformLocation(program, "imageNumber");


	buffer = gl.createBuffer();


	gl.uniform1i(imageNumberLocation, 1);
	draw(buffer);
}

function image1() {
	gl.uniform1i(imageNumberLocation, 1);
	draw(buffer);
}
function image2() {
	gl.uniform1i(imageNumberLocation, 2);
	draw(buffer);
}
function image3() {
	gl.uniform1i(imageNumberLocation, 3);
	draw(buffer);
}

function draw(buffer) {
	// Create a square as a strip of two triangles.
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([
			-1,1,
			0,1,
			1,0,
			-1,-1,
			0,1,
			-1,0]),
		gl.STATIC_DRAW
	);

	gl.aPosition = gl.getAttribLocation(program, "aPosition");
	gl.enableVertexAttribArray(gl.aPosition);
	gl.vertexAttribPointer(gl.aPosition, 3, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

}
