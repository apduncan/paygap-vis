var pkgjson = require('./package.json');

var config = {
  pkg: pkgjson,
  app: 'bower_components',
  dist: 'dist'
}

module.exports = function (grunt) {

  // Configuration
  grunt.initConfig({
    config: config,
    pkg: config.pkg,
    bower: grunt.file.readJSON('bower.json'),
    copy: {
      dist: {
       files: [{
         expand: true,
         cwd: '<%= config.app %>/jquery/dist',
         src: 'jquery.min.js',
         dest: '<%= config.dist %>/js'
       },
       {
         expand: true,
         cwd: '<%= config.app %>/typeahead.js/dist',
         src: 'typeahead.bundle.min.js',
         dest: '<%= config.dist %>/js'
       },
       {
	       expand: true,
	       cwd: '<%= config.app %>/localforage/dist',
	       src: 'localforage.min.js',
	       dest: '<%= config.dist %>/js'
       }]
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> lib - v<%= pkg.version %> -' +
          '<%= grunt.template.today("yyyy-mm-dd") %> */'
      },
      dist: {
        files: {
          '<%= config.dist %>/js/lib.min.js': [
            '<%= bower.directory %>/jquery/jquery.js',
            '<%= bower.directory %>/typeahead.js/dist/typeahead.bundle.min.js'
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', [
    //'uglify'
    'copy'
  ]);
};
