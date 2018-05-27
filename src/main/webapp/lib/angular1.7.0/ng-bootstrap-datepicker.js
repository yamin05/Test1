/*global angular */
/*
 jQuery UI Datepicker plugin wrapper

 @note If ≤ IE8 make sure you have a polyfill for Date.toISOString()
 @param [ui-date] {object} Options to pass to $.fn.datepicker() merged onto uiDateConfig
 */

angular.module('ui.date', [])

.constant('uiDateConfig', {})

.directive('uiDate', ['uiDateConfig', '$timeout', function (uiDateConfig, $timeout) {
  'use strict';
  var options;
  options = {};
  angular.extend(options, uiDateConfig);
  return {
    require:'?ngModel',
    link:function (scope, element, attrs, controller) {
      var getOptions = function () {
        return angular.extend({}, uiDateConfig, scope.$eval(attrs.uiDate));
      };
      var initDateWidget = function () {
        var opts = getOptions();

        // If we have a controller (i.e. ngModelController) then wire it up
        if (controller) {
          // Override ngModelController's $setViewValue
          // so that we can ensure that a Date object is being pass down the $parsers
          // This is to handle the case where the user types directly into the input box
          var _$setViewValue = controller.$setViewValue;
          var settingValue = false;
          controller.$setViewValue = function (value) {
            if ( !settingValue ) {
              settingValue = true;
              element.datepicker("setValue", value);
              _$setViewValue.call(controller, value);
              $timeout(function() {settingValue = false;});
            }
          };

          // Set the view value in a $apply block when users selects
          // (calling directive user's function too if provided)
          var _onChange = function (ev) {
            scope.$apply(function() {
              controller.$setViewValue(ev.date);
              element.datepicker('hide');
            });
          };

          // Update the date picker when the model changes
          controller.$render = function () {
            var date = controller.$viewValue || null;
            if ( angular.isDefined(date) && date !== null && !angular.isDate(date) ) {
              throw new Error('ng-Model value must be a Date object - currently it is a ' + typeof date + ' - use ui-date-format to convert it from a string');
            }
        	if (!date) {
        		element.val('');
          	} else {
            	element.datepicker("setValue", date);
          	}
          };
        }
        // Create the new datepicker widget
        var dp = element.datepicker(opts);
        dp.on('changeDate', _onChange);
        
        if ( controller ) {
          // Force a render to override whatever is in the input text box
          controller.$render();
        }
      };
      // Watch for changes to the directives options
      scope.$watch(getOptions, initDateWidget, true);
    }
  };
}
]);
