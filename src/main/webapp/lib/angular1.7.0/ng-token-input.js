var mod;

mod = angular.module('token-input', []);

mod.directive('tokenInput', [
  '$rootScope', '$window', '$timeout', function($rootScope, $window, $timeout) {
    return {
      require: '?ngModel',
      link: function(scope, elem, attrs, ngModel) {
        var reflect = function (results) {
          if (!scope.$$phase) {
            scope.$apply(function () {
              ngModel.$setViewValue(elem.tokenInput("get"));
            });
          }
        };        

        var model = scope.$eval(attrs.ngModel);
        var options = {
        		theme: "facebook",
                onAdd: reflect,
                onDelete: reflect        		
        };
        
        if (attrs.tokenInputSearchingText) {
        	options.searchingText = attrs.tokenInputSearchingText;         	
        }

        if (attrs.tokenInputNoResultsText) {
        	options.noResultsText = attrs.tokenInputNoResultsText;         	
        }
        
        if (attrs.tokenInputHintText) {
        	options.hintText = attrs.tokenInputHintText;
        }
        
        if (attrs.tokenInputWidth) {
        	options.width = attrs.tokenInputWidth;
        }

        elem.tokenInput(scope.$eval(attrs.tokenInput), options);
        

        var watcher = scope.$watch(attrs.ngModel + '.length', function() {
          if (model.length) {
            for (var i=0; i < model.length; i++) {
              elem.tokenInput("add", model[i]); 
            }
            watcher();
          };
        });
      }
    };
  }
]);
