Open the HTML file in the browser of your choice. It was developed in Firefox, and has been tested in Microsoft Edge and Chrome.
The three buttons will cause one of three images to be rendered to the canvas.

 - main.html
After the HTML and webgl boilerplate, the  vertex shader just pushes the information down to the fragment shader, where most of the work in the program is done.
There are several structs and constructors for them, which makes creating things to render simpler and faster.
Global arrays are created to store the instances of the structs, each with a size of the greatest amount of said struct to appear in the images.
The image functions make all of the structs needed for the image and load them into the global struct arrays.
The setup function declares some variables necessary for the ray tracing, calls the correct image function, and creates the first ray.
The checkIntersect functions each take in a ray and a struct and test for collision, with the sphere function also taking whether the first or last intersection is needed (which is how soft-shadows are made).
The getRay function finds the ways the ray bounces off of the environment, noting things like its first intersection, the object of intersection's color, whether the vectors from the light to the intersection are blocked by another object, and the ray's reflections.
The getRay function is called on the reflected ray (and this process is repeated again), resulting in the necessary information to calculate the fragment color, which is calculated in the main function.
All of this is followed up by more boilerplate, and three buttons placed beneath the canvas using a paragraph element as a spacer.
- main.js
During the main function, the buttons are linked and event listeners are set to functions that will send which image is to be rendered to the shader and make another draw call.
The webgl canvas boilerplate is used, as well as sending the first image to the shader and making a draw call.
The draw function creates a background square with two triangles, and uses this to get the vertices for the vertex shader, which will then be used to get the fragments for the fragment shader.