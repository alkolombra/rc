'use strict';
angular.module('rc.controllers', ['ui']);
var GlobalCtrl = ['$scope', '$resource', '$location', '$window', '$routeParams', function($scope, $resource, $location, $window, $routeParams){
	$scope.resource = $resource;
	$scope.location = $location;
	$scope.window = $window;

	$scope.safeApply = function(fn) {
	  var phase = this.$root.$$phase;	  
	  if(phase == '$apply' || phase == '$digest') {
	    if(fn && (typeof(fn) === 'function')) {
	      fn();
	    }
	  } else {
	    this.$apply(fn);
	  }
	};	

}];

var MainCtrl = ['$scope', function($scope){	

	$scope.connected = false;
	$scope.socket = new SocketController(io.connect('node.mediamagic.co.il:8080'));		

 	$scope.socket.io.on('SOCKET_CONNECT', function () {
 		$scope.connected = true;
 		// $scope.safeApply(function() {
 			
 		// });
 	});

	var key = {
		forward:38,
		backwards:40,
		left:37,
		right:39
	}

	var driving = {
		forward:false,
		backwards:false,
		left:false,
		right:false	
	}
	

	$scope.window.onkeydown = function(evt) {
    	evt = evt || window.event;

    	if($scope.connected) {

	    	switch(evt.keyCode) {
	    		case key.forward:
	    			if(!driving.forward) {
	    				driving.forward = true;
	    				$scope.socket.to('server').emit('DRIVE', {direction:'forward', drive:driving.forward});
	    			}
	    		break;
	    		case key.backwards:
	    			if(!driving.backwards) {
	    				driving.backwards = true;
	    				$scope.socket.to('server').emit('DRIVE', {direction:'backwards', drive:driving.backwards});
	    			}
	    		break;
	    		case key.left:
	    			if(!driving.left) {
	    				driving.left = true;
	    				$scope.socket.to('server').emit('DRIVE', {direction:'left', drive:driving.left});
	    			}
	    		break;
	    		case key.right:
	    			if(!driving.right) {
	    				driving.right = true;
	    				$scope.socket.to('server').emit('DRIVE', {direction:'right', drive:driving.right});
	    			}
	    		break;
	    		default:
	    		break;
	    	}
	    }
    	
	};

	$scope.window.onkeyup = function(evt) {
	    evt = evt || window.event;
	    
	    if($scope.connected) {

	    	switch(evt.keyCode) {
	    		case key.forward:
	    			if(driving.forward) {
	    				driving.forward = false;
	    				$scope.socket.to('server').emit('DRIVE', {direction:'forward', drive:driving.forward});
	    			}
	    		break;
	    		case key.backwards:
	    			if(driving.backwards) {
	    				driving.backwards = false;
	    				$scope.socket.to('server').emit('DRIVE', {direction:'backwards', drive:driving.backwards});
	    			}
	    		break;
	    		case key.left:
	    			if(driving.left) {
	    				driving.left = false;
	    				$scope.socket.to('server').emit('DRIVE', {direction:'left', drive:driving.left});
	    			}
	    		break;
	    		case key.right:
	    			if(driving.right) {
	    				driving.right = false;
	    				$scope.socket.to('server').emit('DRIVE', {direction:'right', drive:driving.right});
	    			}
	    		break;
	    		default:
	    		break;
	    	}
	    }
	};

}];