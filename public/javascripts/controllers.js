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

	$scope.socket = null;
	$scope.connected = false;
	
	// $scope.updateSocket = function(socket) {
	// 	$scope.socket = socket;		
	// }
}];

var MainCtrl = ['$scope', function($scope){	
	
	$scope.canDrive = false;
	$scope.showGameWrapper = false;
	$scope.showWaitingList = false;
	$scope.validNickname = false;
	$scope.showPlayAgain = false;

	$scope.timeLeft = '';

	$scope.waitingList = [];

	$scope.loginMessageClass = 'redText';
	$scope.soundClass = 'soundOn';
	$scope.sound = true;
	$scope.animatedPlane = '';

	$scope.car1Class = 'carEnabled';
	$scope.car2Class = 'carDisabled';

	$scope.driver = {
		nickname: 'no one'
	}

	$scope.user = {
		nickname:''
	}

	$scope.webcamUrl = '';
	$scope.randomParam = '';

	$scope.download = {
		show:false,
		url:'',
		file:''
	}

	$scope.plane = {
		logos: [ 'logo_coca_cola.png', 'logo_nike.png'],		
		logo: ''
	}
	
	$scope.socket = new SocketController(io.connect('node.mediamagic.co.il:8080'));		

	$scope.loginMessage = 'Connecting to server, please wait...';
	$scope.message = '';
	
 	$scope.socket.io.on('SOCKET_CONNECT', function () { 		
 		//$scope.updateSocket($scope.socket);
 		 		 		
 		$scope.safeApply(function() {
 			$scope.connected = true;
 			$scope.loginMessageClass = 'greenText';
 			$scope.loginMessage = 'Connected, please type your nickname:'; 	
 		});

 		document.getElementById('loginInput').focus();
 	});

 	$scope.socket.io.on('SWITCH_CAR', function (data) {
 		if(data.car == 1) {
 			$scope.car1Class = 'carEnabled';
			$scope.car2Class = 'carDisabled';	
 		} else {
 			$scope.car1Class = 'carDisabled';
			$scope.car2Class = 'carEnabled';	
 		}	
 	});

 	$scope.selectCar = function(car) {
 		
 		if($scope.canDrive) {
	 		if(car == 1) {
	 			$scope.car1Class = 'carEnabled';
				$scope.car2Class = 'carDisabled';	
	 		} else {
	 			$scope.car1Class = 'carDisabled';
				$scope.car2Class = 'carEnabled';	
	 		}	 		

	 		$scope.socket.to('server').emit('SWITCH_CAR', {car:car}, function(data) { });
	 	}
 	}

 	$scope.toggleSound = function() {
 		$scope.safeApply(function() {
	 		if($scope.sound) {
	 			$scope.sound = false;
	 			$scope.soundClass = 'soundOff';
	 			document.getElementById('audioMusic').pause();
	 			document.getElementById('audioPlane').pause();
	    		document.getElementById('audioPlane').currentTime = 0;			
	 		} else {
	 			$scope.sound = true;
	 			$scope.soundClass = 'soundOn';

	 			if($scope.canDrive)
	 				document.getElementById('audioMusic').play();
	 		}
	 	});
 	}

 	$scope.videoLost = function() { 		 		
 		$scope.safeApply(function() { 			
 			var d = new Date();
 			$scope.randomParam = '?r=' + d.getTime();  			
 		});
 	}

 	$scope.socket.io.on('GAME_OVER', function () {
 		$scope.safeApply(function() {
 			$scope.canDrive = false;
 			$scope.showPlayAgain = true;
 			$scope.message = 'Your time is up :/'; 	
 			$scope.driver.nickname = 'no one';
 			$scope.timeLeft = '';
 		});
 	});

 	$scope.socket.io.on('DOWNLOAD_VIDEO', function (data) {
 		$scope.safeApply(function() {
 			$scope.download.url = data.path;
 			$scope.download.file = data.file;
 			$scope.download.show = true;
 		});
 	});

 	$scope.socket.io.on('UPDATE_WAITING_LIST', function (data) {
 		$scope.safeApply(function() {
 			$scope.waitingList = data.waitingList;

 			if($scope.waitingList.length > 0) {
 				$scope.showWaitingList = true;
 			} else {
 				$scope.showWaitingList = false;
 			}
 		});
 	});

 	$scope.updateName = function(value) {
 		$scope.user.nickname = value;

 		if($scope.user.nickname.length > 2) {
 			$scope.safeApply(function() {
 				$scope.validNickname = true;
 			});
 		} else {
 			$scope.safeApply(function() { 				
 				$scope.validNickname = false; 				
 			});
 		}
 	}

 	$scope.login = function() {
 		$scope.socket.to('server').emit('LOGIN', {user:$scope.user}, function(data) { 		
 			$scope.safeApply(function() { 
	 			if(data.exists) {
	 				$scope.loginMessageClass = 'redText';
	 				$scope.loginMessage = 'Please select another nickname:'; 	
	 			} else {		 	
	 				$scope.webcamUrl = '//webcam.mediamagic.co.il:18390/cam_1.cgi';
				 	$scope.showGameWrapper = true;
				 	$scope.askToDrive();		 			
				 	$scope.flyPlane();	 			 				
		 		}
		 	});
 		});	
 	}

 	$scope.flyPlane = function() { 		
 		setInterval(function() { 			
 			$scope.plane.logo = $scope.plane.logos[Math.floor(Math.random()*$scope.plane.logos.length)];

 			var imageObj = document.getElementById('planeLogoImage');//new Image(); // new instance for each image
		    imageObj.src = "./images/" + $scope.plane.logo;

		    imageObj.onload=function(){
		    	$scope.safeApply(function() { 
	 				$scope.animatedPlane = 'plane';
	 				setTimeout(function() { 
	 					$scope.safeApply(function() { 
	 						$scope.animatedPlane = ''; 
	 					});
	 				}, 12000);
 				});
		    	if($scope.sound)
	 				document.getElementById('audioPlane').play();
		    }
 					 	
 		}, 120000); 		
 	}

 	$scope.socket.io.on('START_DRIVING', function () {
		$scope.startDriving();
 	});

	$scope.socket.io.on('HORN', function (data) {
		if($scope.showGameWrapper) {
			if(data.horn) {
				if($scope.sound)
					document.getElementById('audioHorn').play();
			} else {
				document.getElementById('audioHorn').pause();
	    		document.getElementById('audioHorn').currentTime = 1000;
	    	}
	    }
 	});

 	$scope.socket.io.on('UPDATE_TIMER', function (data) {
 		if($scope.canDrive) {
	 		if(data.time <= 3 && data.time != 0 && $scope.sound)
	 			document.getElementById('audioBeep').play();

	 		if(data.time == 0) {
	 			document.getElementById('audioMusic').pause();
	 			document.getElementById('audioMusic').currentTime = 0;
	 			if($scope.sound)
	 				document.getElementById('audioEndGame').play();	 			
	 		}
 		} else {
 			if($scope.waitingList[0] && $scope.waitingList[0] == $scope.user.nickname && data.time <= 3 && data.time != 0 && $scope.sound)
				document.getElementById('audioBeep').play(); 				
 		}

 		$scope.safeApply(function() { 
			$scope.timeLeft = data.time;
		}); 		
 	});

 	$scope.socket.io.on('SOMEONE_IS_DRIVING', function (data) {
 		$scope.safeApply(function() {
 			$scope.message = data.driver + ' is driving now.';
 			$scope.driver.nickname = data.driver;
 		});
 	});

 	$scope.socket.io.on('SOMEONE_FINISHED_DRIVING', function (data) {
 		$scope.safeApply(function() {
 			$scope.message = data.driver + ' just finished his ride.';
 			$scope.driver.nickname = 'no one';
 			$scope.timeLeft = '';
 		});
 	});

 	$scope.playAgain = function() {
 		$scope.showPlayAgain = false;
 		$scope.askToDrive();
 	}

 	$scope.askToDrive = function() {
 		$scope.socket.to('server').emit('WANT_TO_DRIVE', {}, function(data) {
 			$scope.safeApply(function() {

	 			if(data.drive) { 				
	 				$scope.startDriving();	 				
	 			} else {
	 				$scope.driver.nickname = data.driver;
	 				$scope.message = data.driver + ' is driving now, please wait for him to finish his ride.';
	 			}

 			});
 		});
 	}

 	$scope.startDriving = function() {
 		$scope.safeApply(function() {
	 		$scope.canDrive = true;
		 	$scope.message = 'you can now drive the car with the keyboard arrows :)'; 	
 			$scope.driver.nickname = $scope.user.nickname;
 			if($scope.sound) {
 				document.getElementById('audioStartGame').play();
 				document.getElementById('audioMusic').play();
 			}
		});
 	}

	var key = {
		forward:38,
		backwards:40,
		left:37,
		right:39,
		horn:72
	}

	var driving = {
		forward:false,
		backwards:false,
		left:false,
		right:false	
	}
	
	document.getElementById('loginInput').onkeydown = function(evt) {
		if(evt.keyCode == 13 && $scope.validNickname)
			$scope.login();
	}

	$scope.window.onkeydown = function(evt) {
    	evt = evt || window.event;

    	if($scope.canDrive) {

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
	    		case key.horn:
	    			if($scope.sound)
	    				document.getElementById('audioHorn').play();
	    			$scope.socket.to('server').emit('HORN', {horn:true});
	    		break;
	    		default:
	    		break;
	    	}
	    }
    	
    	if (evt.keyCode >= 37 && evt.keyCode <= 40) {
        	return false;
    	}
	};

	$scope.window.onkeyup = function(evt) {
	    evt = evt || window.event;
	    
	    if($scope.canDrive) {

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
	    		case key.horn:	    			
	    			document.getElementById('audioHorn').pause();
    				document.getElementById('audioHorn').currentTime = 1000;
    				$scope.socket.to('server').emit('HORN', {horn:false});
	    		break;
	    		default:
	    		break;
	    	}
	    }
	};

}];

var GalleryCtrl = ['$scope', function($scope){	
	// if($scope.socket && $scope.socket.io)
	// 	$scope.socket.io.disconnect();

	//$scope.window.stop();

	$scope.test = function() {
		console.log('test');
	}
}];

var VideoCtrl = ['$scope', function($scope){	

}];