/**
 * Minified custom, ultralight version of irregular shapes library
 * www.javisperez.com
 */
(function(l){var d=function(){this.CHUNK_SIZE=5;this.X_DIRT=.17*this.CHUNK_SIZE;this.Y_DIRT=.17*this.CHUNK_SIZE;this.CTX=null;var b=this;this.coord=function(a,b){return{x:a||0,y:b||0}};this.getBezier=function(a,e,c,f,g){var h=new b.coord;h.x=e.x*a*a*a+3*f.x*a*a*(1-a)+3*g.x*a*(1-a)*(1-a)+c.x*(1-a)*(1-a)*(1-a);h.y=e.y*a*a*a+3*f.y*a*a*(1-a)+3*g.y*a*(1-a)*(1-a)+c.y*(1-a)*(1-a)*(1-a);return h}};d.prototype.setChunkSize=function(b){this.CHUNK_SIZE=b;this.X_DIRT=.17*b;this.Y_DIRT=.17*b};d.prototype.setNoise=
function(b,a){this.X_DIRT=b;this.Y_DIRT=a};d.prototype.setContext=function(b){this.CTX=b};d.prototype.drawArc=function(b,a,e,c,f){var g=this.CTX;g.save();g.lineCap="round";var h=(f-c)/Math.floor((180*f/Math.PI-180*c/Math.PI)/360*2*Math.PI*e/this.CHUNK_SIZE),d=c;b+=Math.random()*this.X_DIRT*2-this.X_DIRT;a+=Math.random()*this.Y_DIRT*2-this.Y_DIRT;var k=b+Math.sin(c)*e;c=a+Math.cos(c)*e;g.moveTo(k,c);for(f-=h;d<f;)d+=h,b+=Math.random()*this.X_DIRT*2-this.X_DIRT,a+=Math.random()*this.Y_DIRT*2-this.Y_DIRT,
k=b+Math.sin(d)*e,c=a+Math.cos(d)*e,g.lineTo(k,c);g.restore()};l.IrregularShapes=d})(window);

/**
 * The experiment
 */

(function(document, window, Math) {
    var loCanvas       = document.querySelector('canvas');
    var loContext      = loCanvas.getContext('2d');
    var loAudioContext = new AudioContext();
    var loMath         = Math;
    var laParticles    = [];
    var liMaxParticles = 100;
    var liParticlesQty = 1;
    var loAnalyserR;
    var loAnalyserL;
    var laFreqByteDataR;
    var laFreqByteDataL;
    var is = new IrregularShapes();
    
var splitter = loAudioContext.createChannelSplitter(2);
    
    is.setContext(loContext);
    is.setNoise(0, 0);
    
    /**
     * Contansts
     */
    var MIN_SIZE = 10;
    var SCALE = 1.1;
    var RADIUS_LIMIT;
    var BEAT_THRESHOLD = 90;
    
    /**
     * Particles
     */
    function Particle(aiPosX, aiPosY){
        this.posX = aiPosX;
        this.posY = aiPosY;
        this.size = MIN_SIZE;
        this.opacity = 0.4;
    }
    
    Particle.prototype.update = function(){
        this.size *= SCALE;
    }
    
    Particle.prototype.draw = function(){
        var angle = Math.random() * 6.28;
        loContext.beginPath();
        loContext.strokeStyle = 'rgba('+(Math.max(100, Math.round(255*this.opacity)) )+', 179, 78, '+this.opacity+')';
        is.drawArc(this.posX, this.posY, this.size, angle, angle+2*loMath.PI, true);
        loContext.stroke();
        loContext.closePath();
    }
    
    /**
     * Main functions
     */
    function readFile(file) {
        var reader = new FileReader();

        reader.onloadend = function(e) {
            if (e.target.readyState == FileReader.DONE) {    
                prepareAndPlay(e.target.result);
            }
        };
        
        reader.readAsArrayBuffer(file);
    }

    function init() {
        window.addEventListener('resize', resize);
        resize();
        
        document.querySelector('#file').addEventListener('change', function() {
            readFile(this.files[0]);
        });

        document.querySelector('#sample-song').addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();

            loadSampleSong();
        })
    }

    function loadSampleSong() {
        var request = new XMLHttpRequest();
        var loading = document.querySelector('#loading');

        clearUi();

        loading.style.display = 'block';

        request.open('GET', '/Seven Mary Three-Player Piano.mp3', true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
            loading.remove();
            LoadAudio(request.response);
        };

        request.send();
    }

    function prepareAndPlay(audio) {
        clearUi();
        LoadAudio(audio);
    }

    function resize() {
        loCanvas.width  = window.innerWidth;
        loCanvas.height = window.innerHeight;

        RADIUS_LIMIT = loCanvas.width;
    }

    function clearUi() {
        document.querySelector('.container').remove();
        document.querySelector('#file').remove();
    }
    
    function generateParticles(aiParticlesQty, x, y){
        x = x || loCanvas.width/2;
        y = y || loCanvas.height/2;
        
        while(aiParticlesQty--){
            var loParticle = new Particle(x, y);
            laParticles.push(loParticle);
        }
        
        while(laParticles.length > liMaxParticles){
            laParticles.shift();
        }
    }
    
    function loop() {
        loContext.clearRect(0, 0, loCanvas.width, loCanvas.height);
        
        loAnalyserR.getByteFrequencyData(laFreqByteDataR);
        loAnalyserL.getByteFrequencyData(laFreqByteDataL);

        // RIGHT CHANNEL
        setup(laFreqByteDataR, loCanvas.width * .25);
        // LEFT CHANNEL
        setup(laFreqByteDataL, loCanvas.width * .75);

        requestAnimationFrame(loop);
    }
    
    function setup(data, x, y) {
        
        var liRawAvgLevel  = average(data, 256);
        var liRawPercLevel = liRawAvgLevel / 256;
        var liAverageLevel = Math.round( liRawPercLevel );
        
        generateParticles( liAverageLevel, x, y );
    
        var i = laParticles.length;
        
        var beatMultiplier = (liRawAvgLevel - BEAT_THRESHOLD) / BEAT_THRESHOLD;
        beatMultiplier = Math.round(beatMultiplier) + 1;
        
        var opacity = Math.pow(liRawPercLevel, 2);
        
        SCALE = Math.min(1.1, Math.max(1.5, beatMultiplier));

        while(i--){
            var loParticle = laParticles[i];
            
            loParticle.opacity = opacity;

            is.setNoise(liRawPercLevel * 1.5 * beatMultiplier, 0);
            
            loParticle.update();
            loParticle.draw();
            
            if(loParticle.size > RADIUS_LIMIT) {
                laParticles.shift();
            }
        }
    }
    
    function average(array, length) {
        var sum = 0;
        
        var l = length;
        
        if(!length) {
            l = array.length;
        }
        
        var i = l;
        
        while(i--) {
            sum +=  array[i];
        }
        
        return sum / l;
    }
    
    /**
     * Sound Helpers
     */
    function LoadAudio(data) {
        loAudioContext.decodeAudioData(data, function(buffer) {
            mainBuffer = buffer;
            playSound(buffer);
        }, null);
    }
    
    function playSound(buffer) {
        var loSource = loAudioContext.createBufferSource();
        loAnalyserR   = loAudioContext.createAnalyser();
        loAnalyserL   = loAudioContext.createAnalyser();

        loSource.buffer = buffer;
        loSource.connect(loAudioContext.destination);
        loSource.connect(loAnalyserR);
        loSource.connect(loAnalyserL);
        loSource.loop = true;
        
        loSource.connect(splitter, 0, 0);
        
        splitter.connect(loAnalyserR,0,0);
        splitter.connect(loAnalyserL,1,0);
        
        laFreqByteDataR = new Uint8Array(loAnalyserR.frequencyBinCount);
        laFreqByteDataL = new Uint8Array(loAnalyserL.frequencyBinCount);
        
        loSource.start(0);
        
        loop();
    }
    
    /**
     * Start!
     */
    init();

})(document, window, Math);