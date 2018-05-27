'use strict';
// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'ui.bootstrap', 'infinite-scroll', 'context-menu', 'token-input', 'ngSanitize', 'ajax-spinner', 'ui.date']).
config(function($routeProvider) {
	$routeProvider.when('/', {templateUrl: 'partials/home.html?version='+version, controller: HomeCtrl});
	$routeProvider.when('/project-tasks/:id', {templateUrl: 'partials/project-tasks.html?version='+version, controller: ProjectTasksCtrl});
	$routeProvider.when('/project-tasks/:id/:taskType/:orderBy/:orderDir/:searchText', {templateUrl: 'partials/project-tasks.html?version='+version, controller: ProjectTasksCtrl});
	$routeProvider.when('/user-tasks/:id', {templateUrl: 'partials/user-tasks.html?version='+version, controller: UserTasksCtrl});
	$routeProvider.when('/user-tasks/:id/:searchTaskId', {templateUrl: 'partials/user-tasks.html?version='+version, controller: UserTasksCtrl});
	$routeProvider.when('/task/:projectId/:id', {templateUrl: 'partials/task.html?version='+version, controller: TaskCtrl, resolve:TaskCtrl.resolve});
	$routeProvider.when('/version/:projectId/:id', {templateUrl: 'partials/version.html?version='+version, controller: VersionCtrl, resolve:VersionCtrl.resolve});
	$routeProvider.when('/view-version/:projectId/:id/:q', {templateUrl: 'partials/view-version.html?version='+version, controller: VersionCtrl, resolve: VersionCtrl.resolve});
	$routeProvider.when('/versions/:projectId', {templateUrl: 'partials/versions.html?version='+version, controller: VersionsCtrl});
    $routeProvider.when('/users', {templateUrl: 'partials/users.html?version='+version, controller: UsersCtrl});
    $routeProvider.when('/users/:orderBy/:orderDir', {templateUrl: 'partials/users.html?version='+version, controller: UsersCtrl});
    $routeProvider.when('/user/:id', {templateUrl: 'partials/user.html?version='+version, controller: UserCtrl, resolve:UserCtrl.resolve});
    $routeProvider.when('/delete-user/:id', {templateUrl: 'partials/delete-user.html?version='+version, controller: DeleteUserCtrl, resolve: DeleteUserCtrl.resolve});
	$routeProvider.when('/profile', {templateUrl: 'partials/profile.html?version='+version, controller: ProfileCtrl});
	$routeProvider.when('/projects/:ptype', {templateUrl: 'partials/projects.html?version='+version, controller: ProjectsCtrl});
    $routeProvider.when('/project/:id', {templateUrl: 'partials/project.html?version='+version, controller: ProjectCtrl, resolve: ProjectCtrl.resolve});
	$routeProvider.when('/worksheets/:wtype', {templateUrl: 'partials/worksheets.html?version='+version, controller: WorksheetsCtrl});
	$routeProvider.when('/groups/:gtype', {templateUrl: 'partials/groups.html?version='+version, controller: GroupsCtrl});
	$routeProvider.when('/current-group-task', {templateUrl: 'partials/current-group-task.html?version='+version, controller: CurrentGroupTaskCtrl});
	$routeProvider.when('/group/:id', {templateUrl: 'partials/group.html?version='+version, controller: GroupCtrl, resolve: GroupCtrl.resolve});
	$routeProvider.when('/group', {templateUrl: 'partials/group.html?version='+version, controller: GroupCtrl, resolve: GroupCtrl.resolve});
	$routeProvider.when('/delete-group/:id', {templateUrl: 'partials/delete-group.html?version='+version, controller: DeleteGroupCtrl, resolve: DeleteGroupCtrl.resolve});
	$routeProvider.when('/group-user-task/:id', {templateUrl: 'partials/group-user-task.html?version='+version, controller: GroupUserTaskCtrl, resolve: GroupUserTaskCtrl.resolve});

	$routeProvider.otherwise({redirectTo: '/'});
});


// Common Utility Methods
function preg_quote( str ) {
    // http://kevin.vanzonneveld.net
    // +   original by: booeyOH
    // +   improved by: Ates Goral (http://magnetiq.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // *     example 1: preg_quote("$40");
    // *     returns 1: '\$40'
    // *     example 2: preg_quote("*RRRING* Hello?");
    // *     returns 2: '\*RRRING\* Hello\?'
    // *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
    // *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'

    return (str+'').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
}