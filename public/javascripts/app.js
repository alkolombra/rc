'use strict';
angular.module('rc', ['ngResource', 'ui']).
config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {		
	$routeProvider.
		when('/main', { templateUrl:'/views/main.html', controller:MainCtrl}).				
		when('/video', { templateUrl:'/views/video.html', controller:VideoCtrl}).
		otherwise({ redirectTo:'/main'});
}]).
filter('break', function() {
	return function(items, count) { 
		var counting = 0;
		var newObj = {};
		
		for(var item in items) {			
			counting++;
			newObj[item] = items[item];
			if(counting == count)
				return newObj;			
		}
		
		return newObj;
	}
});