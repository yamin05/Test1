var mod;

mod = angular.module('context-menu', []);

mod.directive('contextMenu', ['$rootScope', '$window', '$timeout', function($rootScope, $window, $timeout) {
    return {
        link: function(scope, elem, attrs) {
            var ul = $('#' + attrs.contextMenu), last = null;
            var type = scope.$eval(attrs.contextMenuType);

            ul.css({
                'display': 'none'
            });
            
            var handler = function(event) {
                scope.$eval(attrs.contextMenuClick);
                var show = (attrs.contextMenuShow ? scope.$eval(attrs.contextMenuShow) : true);
                event.preventDefault();
                if (show) {
                    ul.css({
                        position: "fixed",
                        display: "block",
                        left: event.clientX + 'px',
                        top: event.clientY + 'px'
                    });
                    last = event.timeStamp;
                } else {
                    ul.css({
                        'display': 'none'
                    });
                } 
                return false;
            };

            if (type && type.toLowerCase() === 'left') {
            	elem.bind('click', handler);
            } else {
            	elem.bind('contextmenu', handler);	
            }

            $(document).click(function(event) {
                var target = $(event.target);
                if (!target.is(".popover") && !target.parents().is(".popover")) {
                    if (last === event.timeStamp) return;
                    ul.css({
                        'display': 'none'
                    });
                }
            });
        }
    };
}]);