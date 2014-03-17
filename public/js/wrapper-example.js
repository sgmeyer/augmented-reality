var div = document.getElementById('DOMTarget');

(function( global, doc ){

  // When the DOM has finished loading...
  function initialize(){

    var video = document.createElement('video');

    navigator.getMedia = ( navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia);

    navigator.getMedia (

       // constraints
       {
          video: true,
          audio: false
       },

       // successCallback
       function(localMediaStream) {
          // Example of creating a new tracker object with all possible options
          var myTracker = jsartoolkit.tracker({
              src       : window.URL.createObjectURL(localMediaStream),                  // Source of the video file
              autoplay  : true,                             // Does the video start automatically
              repeat    : false,                             // Loop the video
              volume    : 0,                                // Volume of audio from video source
              target    : div,                              // The DOM element in which to append the canvas
              width     : 800,                              // Width of the final output
              height    : 600,                              // Height of the final output
              threshold : 100,                              // Adjust tracking-threshold to suit video lighting
              ratio     : 0.5,                              // Adjust size of hidden tracking-canvas (1 = same as video size)
              debug     : false                             // Add a debug canvas to the DOM target that will help when adjusting the threshold
          });

          //window.myTracker1 = myTracker;

          // Add an image to the first Augmented Reality marker
          myTracker.marker(0).image('img/my-image_01.png');

          // Add Blender3D models to Augmented Reality markers
          //myTracker.marker(2).model('HTML5_Logo001');

          // Adjust properties of Marker_0
          myTracker.marker(0)
            .scale(1)
            .axis(0, 0, 1)
            .angle(0)
            .position(0,0,0)
          ;

          // A callback can be fired when an image has been loaded
          myTracker.marker(0).image('img/my-image_02.png', function( e ){
            console.log( 'Image loaded!', e );
          });

          // Add new images for two more Markers
          //myTracker.marker(2).image('img/my-image_03.png');
          //myTracker.marker(3).image('img/my-image_04.png');
      },

      // errorCallback
      function(err) {
       console.log("The following error occured: " + err);
      });
  };

  // Call the initialize function when the page finishes loading
  doc.addEventListener( 'DOMContentLoaded', function(){ initialize(); }, false );

})( window, document );
