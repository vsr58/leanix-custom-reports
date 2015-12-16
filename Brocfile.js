var Funnel = require('broccoli-funnel');
var concatenate = require('broccoli-concat'),
    mergeTrees  = require('broccoli-merge-trees'),
    pickFiles   = require('broccoli-static-compiler'),
    uglifyJs    = require('broccoli-uglify-js');

var files = [];

var bubblesDist = 'bubbles/dist';
var destDir = 'bubbles';

var bubblesJs = concatenate(bubblesDist, {
    inputFiles : ['*.js'],
    outputFile : destDir + '/index.js'
});

bubblesJs = uglifyJs(bubblesJs, { compress: true });
var staticFiles = new Funnel(bubblesDist, { files: ['index.html'], destDir: destDir });

files.push(staticFiles, bubblesJs);

// merge HTML, JavaScript and CSS trees into a single tree and export it
module.exports = mergeTrees(files);