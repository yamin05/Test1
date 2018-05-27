'use strict';

/* Directives */

angular.module('myApp.directives', []).
directive('appVersion', ['version', function (version) {
        return function (scope, elm, attrs) {
            elm.text(version);
        };
    }
]).
directive('autoScroll', function($timeout, $window) {
    return {
      link: function(scope, element) {
          if(!scope.isMobile) {
              element.css({
                  'max-height':angular.element($window).height() - 55,
                  'overflow':'auto'
              });
          }
      }
    };
}).
directive('focusMe', function($timeout) {
  return {
    link: function(scope, element) {
        element.focus();
    }
  };
}).
directive('shortcut', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    link: function postLink(scope, iElement, iAttrs){
    	var isCtrl=false;
		jQuery(document).keyup(function(e){
			if(e.which == 17) isCtrl=false;
		}).keydown(function (e) {
		    if(e.which == 17) isCtrl=true;
		    if (e.which == 13) {
		    	if(isCtrl) {
		    		scope.$apply(scope.keyPressed(e));
		    	}
		    } 
	    });
    }
  };
});


