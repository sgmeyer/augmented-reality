threshold = 100;
  DEBUG = false;

Photos = [
"img/my-image_01.jpg"
];

  photos = Photos.map(Image.load);

  var video = document.createElement('video');
  video.width = 640;
  video.height = 480;
  video.loop = false;
  video.volume = 0;
  video.autoplay = true;
  video.style.display = 'none';
  video.controls = true;

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
       video.src = window.URL.createObjectURL(localMediaStream);
    });

  window.onload = function() {
    //byId('loading').style.display = 'none';
    document.body.appendChild(video);

    var canvas = document.getElementsByTagName('canvas')[0];
    canvas.width = 320;
    canvas.height = 240;
    canvas.style.display = 'none';

    var videoCanvas = document.createElement('canvas');
    videoCanvas.width = video.width;
    videoCanvas.height = video.height;

    var raster = new NyARRgbRaster_Canvas2D(canvas);
    var param = new FLARParam(320,240);

    var resultMat = new NyARTransMatResult();

    var detector = new FLARMultiIdMarkerDetector(param, 80);
    detector.setContinueMode(true);

    var ctx = canvas.getContext('2d');
    ctx.font = "24px URW Gothic L, Arial, Sans-serif";

    var glCanvas = document.createElement('canvas');
    glCanvas.width = 960;
    glCanvas.height = 720;
    var s = glCanvas.style;
    document.body.appendChild(glCanvas);
    display = new Magi.Scene(glCanvas);
    display.drawOnlyWhenChanged = true;
    param.copyCameraMatrix(display.camera.perspectiveMatrix, 10, 10000);
    display.camera.useProjectionMatrix = true;

    var videoTex = new Magi.FlipFilterQuad();
    videoTex.material.textures.Texture0 = new Magi.Texture();
    videoTex.material.textures.Texture0.image = videoCanvas;
    videoTex.material.textures.Texture0.generateMipmaps = false;
    display.scene.appendChild(videoTex);

    var times = [];
    var pastResults = {};
    var lastTime = 0;
    var cubes = {};
    var images = [];

    window.updateImage = function() {
      display.changed = true;
    }
    window.addEventListener('keydown', function(ev) {
      if (Key.match(ev, Key.LEFT)) {
        images.forEach(function(e){ e.setImage(photos.rotate(true)); });
      } else if (Key.match(ev, Key.RIGHT)) {
        images.forEach(function(e){ e.setImage(photos.rotate(false)); });
      }
    }, false);

    setInterval(function(){
      if (video.ended) video.play();
      if (video.paused) return;
      if (window.paused) return;
      if (video.currentTime == video.duration) {
        video.currentTime = 0;
      }
      if (video.currentTime == lastTime) return;
      lastTime = video.currentTime;
      videoCanvas.getContext('2d').drawImage(video,0,0);
      ctx.drawImage(videoCanvas, 0,0,320,240);

      var dt = new Date().getTime();

      videoTex.material.textures.Texture0.changed = true;

      canvas.changed = true;
      display.changed = true;

      var t = new Date();
      var detected = detector.detectMarkerLite(raster, threshold);
      for (var idx = 0; idx<detected; idx++) {
        var id = detector.getIdMarkerData(idx);
        //read data from i_code via Marsial--MarshalçµŒç”±ã§èª­ã¿å‡ºã™
        var currId;
        if (id.packetLength > 4) {
          currId = -1;
        }else{
          currId=0;
          for (var i = 0; i < id.packetLength; i++ ) {
            currId = (currId << 8) | id.getPacketData(i);
            //console.log("id[", i, "]=", id.getPacketData(i));
          }
        }
        //console.log("[add] : ID = " + currId);
        if (!pastResults[currId]) {
          pastResults[currId] = {};
        }
        detector.getTransformMatrix(idx, resultMat);
        pastResults[currId].age = 0;
        pastResults[currId].transform = Object.asCopy(resultMat);
      }
      for (var i in pastResults) {
        var r = pastResults[i];
        if (r.age > 1) {
          delete pastResults[i];
          cubes[i].image.setImage(photos.rotate());
        }
        r.age++;
      }
      for (var i in cubes) cubes[i].display = false;
      for (var i in pastResults) {
        if (!cubes[i]) {
          var pivot = new Magi.Node();
          pivot.transform = mat4.identity();
          pivot.setScale(80);
          var image = new Magi.Image();
          image
            .setAlign(image.centerAlign, image.centerAlign)
            .setPosition(0, 0, 0)
            .setAxis(0,0,1)
            .setAngle(Math.PI)
            .setSize(1.5);
          image.setImage = function(src) {
            var img = E.canvas(640,640);
            Magi.Image.setImage.call(this, img);
            this.texture.generateMipmaps = false;
            var self = this;
            src.onload = function(){
              var w = this.width, h = this.height;
              var f = Math.min(640/w, 640/h);
              w = (w*f);
              h = (h*f);
              img.getContext('2d').drawImage(this, (640-w)/2,(640-h)/2,w,h);
              img.getContext('2d').fillText("Zibri", 100, 100);
              self.texture.changed = true;
              self.setSize(1.1*Math.max(w/h, h/w));
            };
            if (Object.isImageLoaded(src)) {
              src.onload();
            }
          };
          image.setImage(photos.rotate());
          images.push(image);
          pivot.image = image;
          pivot.appendChild(image);
          /*var txt = new Magi.Text(i);
          txt.setColor('#f0f0d8');
          txt.setFont('URW Gothic L, Arial, Sans-serif');
          txt.setFontSize(32);
          txt.setAlign(txt.leftAlign, txt.bottomAlign)
            .setPosition(-0.45, -0.48, -0.51)
            .setScale(1/190);*/
          display.scene.appendChild(pivot);
          cubes[i] = pivot;
        }
        cubes[i].display = true;
        var mat = pastResults[i].transform;
        var cm = cubes[i].transform;
        cm[0] = mat.m00;
        cm[1] = -mat.m10;
        cm[2] = mat.m20;
        cm[3] = 0;
        cm[4] = mat.m01;
        cm[5] = -mat.m11;
        cm[6] = mat.m21;
        cm[7] = 0;
        cm[8] = -mat.m02;
        cm[9] = mat.m12;
        cm[10] = -mat.m22;
        cm[11] = 0;
        cm[12] = mat.m03;
        cm[13] = -mat.m13;
        cm[14] = mat.m23;
        cm[15] = 1;
      }
    }, 15);
  }
