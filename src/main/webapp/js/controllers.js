'use strict';
/* Controllers */

function MainCtrl($scope, $http, $location, $window) {
	$scope.user = {};
	$scope.alerts = [];
	$scope.recentProject = [];
	$scope.recentUsers = [];

	$scope.isMobile = false;
	$scope.contextMenuType = "right";
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
		$scope.isMobile = true;
		$scope.contextMenuType = "left";
	}

	$scope.closeAlert = function(index) {
	    $scope.alerts.splice(index, 1);
	};

	$scope.isCanvasSupported = function () {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    }

	var userInfo = function() {
		$http.post('rest/get-user', {}).success(
			function(data, status, headers, config) {
				$scope.checkSession(data);
				if (!data.errors.length) {
					$scope.loggedUser = data.user;
					$scope.loggedUser.isAdmin = (data.user.roles.indexOf("ROLE_ADMIN") !== -1);
					$scope.loggedUser.isManager = (data.user.roles.indexOf("ROLE_MANAGER") !== -1);
					$scope.loggedUser.isWorker = (data.user.roles.indexOf("ROLE_WORKER") !== -1);
		            
					$scope.loggedUser.isAssignee = function(task) {
		                for (var i = 0 ; i < task.assignedTo.length ; i++) {
		                    if (task.assignedTo[i].assignee.id == this.id) {
		                        return true;
		                    }
		                }
		                return false;
		            };

		            $scope.loggedUser.isCreator = function(task) {
	                    return (task.createdBy && task.createdBy.id == this.id);
	                };

	                $scope.$broadcast('userLoaded', $scope.loggedUser);
	                
				} 
			}
		);
	}();

	$scope.checkSession = function (data) {
		if (typeof data !== 'object') {
			$window.location.href = 'login';
		}
	};
	
	$scope.sliceArray = function(arr, len) {
        var newArr = arr.slice(0, len);
        if (newArr.length < arr.length) {
            arr.hasMore = true;
            arr.length = 0;
            for (var i = 0; i < newArr.length; i++) {
                arr.push(newArr[i]);
            }
        }
        return arr;
    };
    
    $scope.loadRecentUsers = function(fetchRecentUsers) {    	
    	if(fetchRecentUsers){
    		$scope.recentUsers = [];
    	}
    	$http.post('rest/get-users', {roles:["ROLE_WORKER"], excludeCurrentUser: false, fetchRecentUsers: fetchRecentUsers }).success(
			function(data, status, headers, config) {
				$scope.checkSession(data);
				if (!data.errors.length) {
					if(fetchRecentUsers){
						$scope.recentUsers = data.users;
					} else {
						$scope.users = data.users;
					}
				}
			}
		);
	};


    $scope.loadProjects = function(fetchPrivateProjects, fetchPublicProjects, fetchRecentProjects, type) {    	
    	if(fetchRecentProjects){
    		$scope.recentProjects = [];
    	}
    	$scope.projects = [];
		$http.post('rest/get-projects', {fetchPrivateProjects: fetchPrivateProjects, fetchPublicProjects: fetchPublicProjects, fetchRecentProjects: fetchRecentProjects}).success(
			function(data, status, headers, config) {
				$scope.checkSession(data);
				if (!data.errors.length) {
					if(!fetchRecentProjects){
						if (type == 'Private') {						
							//$scope.recentProjects = data.privateProjects;
							$scope.projects = data.privateProjects;
						} else {
							//$scope.recentProjects = data.publicProjects;
							$scope.projects = data.publicProjects;
						} 
						
					} else {
						$scope.recentProjects = data.publicProjects;						
					}
				}
			}
		);
		//return $scope.recentProjects;
	};

}

function HomeCtrl($scope, $http, $location, $window) {
    $scope.$on('userLoaded', function(event, user) {
        if (user.isWorker) {
            $location.path('/user-tasks/' + user.id);
        }
    });
    
    if ($scope.loggedUser) {
        if ($scope.loggedUser.isWorker) {
            $location.path('/user-tasks/' + $scope.loggedUser.id);
        }
    }
}

function ProfileCtrl($scope, $http, $window, $filter, $timeout, $location) {
	$scope.alerts.length= 0;
	
	$scope.user = angular.copy($scope.loggedUser);

	$scope.update = function() {
		$scope.alerts.length= 0;
		if ($scope.form.name.$valid) {
			$http.post('rest/save-user', {"id" : $scope.user.id, "name" : $scope.user.name}).success(
				function(data, status, headers, config) {
					$scope.checkSession(data);
					if (!data.errors.length) {
						$scope.alerts.push({ type: 'success', msg: 'Profile updated successfully.'});
						$scope.loggedUser.name = data.user.name;						
					}
				}
			);
		} 
	};
}

function TaskCtrl($scope, $http, $q, $routeParams, $filter, $timeout, $location, $window, Task, Users, Workers) {
	$scope.id = $routeParams.id || 0;
	$scope.projectId = $routeParams.projectId || 0;
	$scope.priorityList = [0,1,2,3,4,5];
	$scope.statusList = [0,2,3,4,5];
	$scope.workers = [];
	$scope.users = [];
	$scope.assignedTo = [];
    $scope.files = [];
	$scope.alerts.length= 0;
	$scope.notify = !$scope.id;
    $scope.showNotify = false;   
    $scope.ccList = [];
    $scope.fileInfo = '';

    var updateUploadManagerText = function() {
        var fileText = ($scope.files.length == 1 ? 'file' : 'files');
        if ($scope.isCanvasSupported()) {
            if ($scope.files && $scope.files.length) {
                $scope.fileInfo = 'Total ' + $scope.files.length + ' ' + fileText + '.';
                $scope.uploadManagerBtnText = 'Drag anywhere to add more files.';
            } else {
                $scope.fileInfo = '';
                $scope.uploadManagerBtnText = 'Drag anywhere to add files';
            }
        } else {
            if ($scope.files && $scope.files.length) {
                $scope.fileInfo = 'Total ' + $scope.files.length + ' ' + fileText + '.';
                $scope.uploadManagerBtnText = 'Click here to add more files.';
            } else {
                $scope.fileInfo = '';
                $scope.uploadManagerBtnText = 'Click here to add files';
            }
        }
    }

    $scope.keyPressed = function(e) {
        if (e.keyCode == 27) {
            $window.history.back();
        }
    };

	var tsToDate = function(ts) {
		var r = ts;
		if (r) {
			r = new Date(ts);
		}
		return r;
	};

	var dateToTs = function(dt) {
		var r = dt;
		if (r) {
			r = r.getTime();
		}
		return r;
	};

	$scope.showEstimatedCompletionDate = function() {
	    if ($scope.task && $scope.task.taskStatus == 2) {
	        return true;
	    }
	    else {
	        return false;
	    }
	}

	$scope.setPriority = function(priority) {
	    $scope.task.priority = priority;
	};

	$scope.setStatus = function(status) {
	    $scope.task.taskStatus = status;
	};

	$scope.dateOptions = {
	    format: 'dd/mm/yyyy'
    };

	$scope.getFileUrl = function(file) {
	    if (file.taskId && file.id) {
            return '../rest/download_file?taskId=' + file.taskId + '&fileId=' + file.id;
	    } else if (file.id) {
            return '../rest/download_file?fileId=' + file.id;
        } else {
            return false;
        }
	};

	$scope.removeFile = function(file) {
		for(var i=0; i < $scope.files.length; i++) {
		    if (file.id == $scope.files[i].id) {
		        $scope.files.splice(i, 1);
		        break;
		    }
		}
        updateUploadManagerText();
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    }

	$scope.addFile = function(file) {
        $scope.files.push(file);
        updateUploadManagerText();
        if (!$scope.$$phase) {
            $scope.$apply();
        }
	}

	$scope.loadTask = function() {
		if ($scope.id) {
            $scope.checkSession(Task);
            if (!Task.errors.length) {
                $scope.task = Task.task;
                $scope.project = Task.task.project;
                $scope.showNotify = ($scope.project && $scope.project.share && $scope.task.createdBy && $scope.loggedUser.id == $scope.task.createdBy.id);
                $scope.excludeFromChangeLog = Task.task.excludeFromChangeLog;
                $scope.task.dateDue = tsToDate(Task.task.dateDue);
                $scope.task.dateCompleted = tsToDate(Task.task.dateCompleted);

                for (var i = 0; i < Task.ccList.length; i++) {
                    var user = Task.ccList[i];
                    $scope.ccList.push(user);
                }
                for (var i = 0; i < Task.task.assignedTo.length; i++) {
                    var taskUser = Task.task.assignedTo[i];
                    $scope.assignedTo.push(taskUser.assignee);
                }

                for (var i = 0; i < Task.task.files.length; i++) {
                    var file = Task.task.files[i].file;
                    file.size = file.datafile.size;
                    file.taskId = $scope.id;
                    $scope.files.push(file);
                }

                $window.uploader.preloadFiles = $scope.files;
                updateUploadManagerText();

                $scope.isAssignee = $scope.loggedUser.isAssignee(Task.task);
                $scope.isCreator = $scope.loggedUser.isCreator(Task.task);
                if ($scope.isAssignee && !$scope.loggedUser.isManager && !$scope.loggedUser.isAdmin && !$scope.isCreator){
                      $scope.alerts.push({ type: 'info', msg: 'You can only modify the <b>Status</b> and <b>Due Date</b> field.'});
                }
            }
		} else {
            $scope.checkSession(Task);
            if (!Task.errors.length) {
                $scope.project = Task.project;

                for (var i = 0; i < Task.ccList.length; i++) {
                    var user = Task.ccList[i];
                    $scope.ccList.push(user);
                }
                $scope.task = {project:Task.project, priority:5};
                $scope.showNotify = ($scope.project && $scope.project.share);
            }
            updateUploadManagerText();
		}
	}();
	
	var loadWorkers = function() {
        $scope.checkSession(Workers);
        if (!Workers.errors.length) {
            var items = Workers.users;
            for (var i = 0; i < items.length; i++) {
                $scope.workers.push(items[i]);
            }
        }
	}();
	
	var loadUsers = function() {
        $scope.checkSession(Users);
        if (!Users.errors.length) {
            var items = Users.users;
            for (var i = 0; i < items.length; i++) {
                $scope.users.push(items[i]);
            }
        }
	}();

	$scope.save = function() {
		var data = {};
		data.id = $scope.id;
		data.projectId = $scope.projectId;
		data.priority = $scope.task.priority;
		data.taskStatus = $scope.task.taskStatus;
		data.minor = $scope.task.minor;
		data.urgent = $scope.task.urgent;
		data.summary = $scope.task.summary;
		data.description = $scope.task.description;
		data.assignedTo = [];
        data.files = [];
		data.cc = "";
		data.excludeFromChangeLog = $scope.task.excludeFromChangeLog;

		for(var i=0; i < $scope.assignedTo.length; i++) {
			data.assignedTo.push($scope.assignedTo[i].id);
		}

		for(var i=0; i < $scope.files.length; i++) {
			data.files.push($scope.files[i].id);
		}

		for(var j = 0; j < $scope.ccList.length; j++){
			data.cc += $scope.ccList[j].id + ",";
		}

		data.dateDue = dateToTs($scope.task.dateDue);
		data.notify = $scope.showNotify && $scope.notify;

		$http.post('rest/save-task', data).success(
			function(data, status, headers, config) {
				$scope.checkSession(data);
				if (!data.errors.length) {
					$window.history.back();
				} else {
					for (var i = 0; i < data.errors.length; i++) {
						$scope.alerts.push({ type: 'error', msg: data.errors[i].message});
					}
				}
			}
		);
	};
}

TaskCtrl.resolve = {
    Task:function ($q, $route, $timeout, $http) {
        var deferred = $q.defer();
	    var id = $route.current.params.id || 0;
    	var projectId = $route.current.params.projectId || 0;

        if (id) {
            $http.post('rest/get-task', {"id": id, loadCcList: true}).success(
                function(data, status, headers, config) {
                    deferred.resolve(data);
                }
            );
        } else {
            $http.post('rest/get-project', {"id": projectId, loadCcList: true}).success(
                function(data, status, headers, config) {
                    deferred.resolve(data);
                }
            );
        }

        return deferred.promise;
    },
    Users:function ($q, $route, $timeout, $http) {
        var deferred = $q.defer();
        $http.post('rest/get-users', {roles:[]}).success(
            function(data, status, headers, config) {
                deferred.resolve(data);
            }
        )

        return deferred.promise;
    },
    Workers:function ($q, $route, $timeout, $http) {
        var deferred = $q.defer();
        $http.post('rest/get-users', {roles:["ROLE_WORKER"]}).success(
            function(data, status, headers, config) {
                deferred.resolve(data);
            }
        )

        return deferred.promise;
    }
}


function ProjectsCtrl($scope, $http, $routeParams, $filter, $timeout, $location, $window) {
	$scope.fetchPublicProjects = false;
	$scope.fetchPrivateProjects = false;
	$scope.fetchRecentProjects = false;
	if ($routeParams.ptype == 'pr') {
		$scope.type = 'Private';	
		$scope.fetchPrivateProjects = true;
	} else {
		if($routeParams.ptype == null){
			$scope.fetchRecentProjects = true;
		}
		$scope.type = 'Public';
		$scope.fetchPublicProjects = true;
	}
	
	$scope.loadProjects($scope.fetchPrivateProjects, $scope.fetchPublicProjects, $scope.fetchRecentProjects, $scope.type);	
}

function GroupsCtrl($scope, $http, $routeParams, $filter, $timeout, $location, $window) {
    $scope.groups = [];
    $scope.pageSize = 20;
    $scope.page = 1;
    $scope.searchText = "";
    $scope.busy = false;
	$scope.fetchPublicGroups = false;
	$scope.fetchPrivateGroups = false;
    $scope.alerts.length= 0;
    $scope.tempName= [];

	if ($routeParams.gtype == 'pr') {
		$scope.type = 'Private';
		$scope.fetchPrivateGroups = true;
	} else {
		$scope.type = 'Public';
		$scope.fetchPublicGroups = true;
	}

    $scope.loadGroups = function() {
        if ($scope.busy) return;
        $scope.busy = true;
        $http.post('rest/get-groups', {fetchPrivateGroups: $scope.fetchPrivateGroups, fetchPublicGroups: $scope.fetchPublicGroups, "pageSize": $scope.pageSize , "page": $scope.page, "searchText": $scope.searchText}).success(
            function(data, status, headers, config) {
                $scope.checkSession(data);
                if (!data.errors.length) {
                    if ($scope.type == 'Private') {
                        $scope.groups = data.privateGroups;
                        $scope.totalItems = data.totalItems;
                    } else {
                        $scope.groups = data.publicGroups;
                        $scope.totalItems = data.totalItems;
                    }
                    $scope.page ++;
                    $scope.busy = false;
                }
            }
        );
    };


    $scope.search = function() {
        $scope.searchText = this.text;
        $scope.page = 1;
        $scope.groups.length = 0;
        $scope.loadGroups();
    };

    $scope.menuClick = function(data) {
        $scope.selectedGroup = data;
        $scope.tempName = data.groupUsers[0].member.id;
    };

    $scope.viewOngoingTask = function() {
        $location.path('/group-user-task/' + $scope.selectedGroup.id );
    }

    $scope.editGroup = function() {
        $location.path('/group/' + $scope.selectedGroup.id);
    };

    $scope.deleteGroup = function() {
        $location.path('/delete-group/' + $scope.selectedGroup.id);
    };
}

function WorksheetsCtrl($scope, $http, $routeParams, $filter, $timeout, $location) {	
	$scope.alerts.length= 0;
	$scope.fetchRecentUsers = false;
	if($routeParams.wtype == null){
		$scope.fetchRecentUsers = true;
	}		
	
    $scope.$on('userUpdated', function(event, user) {
        loadWorkers();
    });
    
    $scope.loadRecentUsers($scope.fetchRecentUsers);
}

function ProjectTasksCtrl($scope, $http, $routeParams, $filter, $timeout, $location, $dialog, $window) {
	$scope.id = $routeParams.id || 0;
	$scope.items = [];
	$scope.pageSize = 20;
	$scope.page = 1;
	$scope.taskType = $routeParams.taskType || 'pending_high';
	$scope.orderBy = $routeParams.orderBy || 2;
	$scope.orderDir = $routeParams.orderDir || 'desc';
	$scope.searchText = $routeParams.searchText || "";
	$scope.text = $scope.searchText;
	$scope.busy = false;
	$scope.alerts.length= 0;
	
	$scope.loadPage = function() {
		if ($scope.busy) return;
		$scope.busy = true;
		$http.post('rest/get-project-tasks', {"projectId" : $scope.id, "pageSize": $scope.pageSize, "page" : $scope.page, "searchText" : $scope.searchText, "taskType": $scope.taskType, "orderBy": $scope.orderBy, "orderDir": $scope.orderDir}).success(
			function(data) {
				$scope.checkSession(data);
				if (!data.errors.length) {
					$scope.project = data.project;
					if (data.project.share) {
						$scope.project.canEditProject = ($scope.loggedUser.isAdmin || $scope.loggedUser.isManager);
					} else {
						$scope.project.canEditProject = ($scope.loggedUser.isAdmin || $scope.loggedUser.isManager || (data.project.createdBy && data.project.createdBy.id == $scope.loggedUser.id));
					}
					
					$scope.totalItems = data.totalItems;
					var items = data.projectTasks;
					for (var i = 0; i < items.length; i++) {
						$scope.items.push(items[i]);
					}
					$scope.page ++;
					$scope.busy = false;
					$scope.loadProjects(false, true, true, 'Public');
				}
			}
		);
	};
	
	$scope.keyPressed = function(e) {
	    if (e.keyCode == 13) {
	    	$location.path('/task/' + $scope.project.id + '/');
	    } 
	};
	
	$scope.scrollDisabled = function() {
		return ($scope.busy || $scope.items.length >= $scope.totalItems);
	};

	$scope.switchToSortType = function(orderBy) {
	    if (orderBy != $scope.orderBy) {
	        $scope.orderDir = 'desc'
	    }
        $location.path('/project-tasks/' + $scope.project.id + '/' + $scope.taskType + '/' + orderBy + '/' + $scope.orderDir + '/' +$scope.text + '/');
	}

	$scope.switchToType = function(type) {
		$location.path('/project-tasks/' + $scope.project.id + '/' + type + '/' + $scope.orderBy + '/' + $scope.orderDir + '/' + $scope.text + '/');
	};  	

	$scope.search = function() {				
		$location.path('/project-tasks/' + $scope.project.id + '/' + $scope.taskType + '/' + $scope.orderBy + '/' + $scope.orderDir + '/' + $scope.text + '/');
    };

	$scope.refresh = function() {
	  	$scope.searchText = this.text;
		$scope.alerts.length = 0;
	  	$scope.page = 1;
		$scope.items.length = 0;
		$scope.loadPage();
    };

    $scope.toggleSort = function() {
        $scope.searchText = this.text;
    	$scope.alerts.length = 0;
    	$scope.page = 1;
    	$scope.items.length = 0;
    	if ($scope.orderDir == 'asc') {
    	    $scope.orderDir = 'desc';
    	} else {
    	    $scope.orderDir = 'asc';
    	}
        $scope.switchToSortType($scope.orderBy);
    };

    $scope.sortClass = function() {
        if ($scope.orderDir == 'desc') {
            return "icon-arrow-up";
        }
        else {
            return "icon-arrow-down";
        }
    };
    
	$scope.editTask = function(idx) {
		if (angular.isDefined(idx)) {
			$scope.selectedTask = $scope.items[idx];
		}
		$location.path('/task/' + $scope.selectedTask.project.id + '/' + $scope.selectedTask.id);
    };

	$scope.deleteTask = function(idx) {
		if (angular.isDefined(idx)) {
			$scope.selectedTask = $scope.items[idx];
		}
	    var title = 'Delete this task?';
	    var msg = $scope.selectedTask.summary;
	    var btns = [{result:'no', label: 'No'}, {result:'yes', label: 'Yes', cssClass: 'btn-primary'}];

	    $dialog.messageBox(title, msg, btns).open().then(function(result) {
			if (result == 'yes') {
				$http.post('rest/delete-task', {"id" : $scope.selectedTask.id}).success(
					function(data) {
						$scope.checkSession(data);
						if (data.errors.length) {
							for (var i = 0; i < data.errors.length; i++) {
								if (data.errors[i].errorCode == -10) {
									$scope.alerts.push({ type: 'error', msg: 'You do not have permission to delete task # ' + $scope.selectedTask.id});
								} else {
									$scope.alerts.push({ type: 'error', msg: data.errors[i].message});
								}
							}
						} else {
							var idx = _.indexOf($scope.items, $scope.selectedTask);
							$scope.items.splice(idx, 1);
							$scope.totalItems --;
							$scope.alerts.push({ type: 'success', msg: 'Task # ' + $scope.selectedTask.id + ' was deleted.'});					
						}
						$window.scrollTo(0, 0);
					}
				);
			}
		});
	};	

	$scope.menuClick = function(data) {
		$scope.selectedTask = data;
	    $scope.isCreator = $scope.loggedUser.isCreator(data);
	    $scope.isAssignee = $scope.loggedUser.isAssignee(data);
	    
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };
    
    $scope.opts = {
	    backdrop: true,
	    dialogClass: 'modal task-view-dialog',
	    keyboard: true,
	    backdropClick: true,
		backdropFade: true,
	    templateUrl:  'partials/task-view.html', 
	    controller: 'TaskDialogController',
	    resolve: {
	        task: function() { 
	        	return $scope.selectedTask;
	        }
    	}
  	};
}

function UserTasksCtrl($scope, $http, $routeParams, $filter, $timeout, $location, $dialog, $window) {
	$scope.id = $routeParams.id || 0;
	$scope.items = [];
	$scope.pageSize = 20;
	$scope.page = 1;
	$scope.busy = false;
	$scope.alerts.length= 0;
	$scope.searchedTaskId = parseInt($routeParams.searchTaskId);

	$scope.loadPage = function() {
		if ($scope.busy) return;
		$scope.busy = true;
		$http.post('rest/get-project-tasks', {"assigneeId" : $scope.id, "pageSize": $scope.pageSize, "page" : $scope.page, "searchText" : $scope.searchText}).success(
			function(data) {
				$scope.checkSession(data);
				if (!data.errors.length) {
					$scope.assignee = data.assignee;
					$scope.totalItems = data.totalItems;
					var items = data.projectTasks;
					for (var i = 0; i < items.length; i++) {
						$scope.items.push(items[i]);
					}
					$scope.page ++;
					$scope.busy = false;
					$scope.loadRecentUsers(true);
				}
			}
		);
	};

	$scope.totalItemsText = function() {
		var r = "";
		if ($scope.totalItems == 1) {
			r = $scope.totalItems + " task";
		} else if ($scope.totalItems > 1) {
			r = $scope.totalItems + " tasks";
		} 
		return r;
	};  	
	
	$scope.scrollDisabled = function() {
		return ($scope.busy || $scope.items.length >= $scope.totalItems);
	};  	

	$scope.editTask = function(idx) {
		if (angular.isDefined(idx)) {
			$scope.selectedTask = $scope.items[idx];
		}
		
		$location.path('/task/' + $scope.selectedTask.project.id + '/' + $scope.selectedTask.id);
    };

	
	$scope.reorder = function(idx) {
		if (angular.isDefined(idx)) {
			$scope.selectedIndex = idx;
		}

		$scope.moveIndex = $scope.selectedIndex;
    };

    $scope.placeHere = function(idx) {
		if (angular.isDefined(idx)) {
			$scope.selectedIndex = idx;
		}
		
		if (angular.isDefined($scope.moveIndex) && $scope.moveIndex != $scope.selectedIndex) {
			swap($scope.moveIndex, $scope.selectedIndex);
			$scope.moveIndex = undefined;
		} 
	};
	
    $scope.moveHereVisible = function(idx) {
		if (!$scope.loggedUser.isManager || $scope.moveIndex == undefined) {
			return false;
		}
		
    	var task1 = $scope.items[$scope.moveIndex];
    	var task2 = $scope.items[idx];
    	
		return task1 != task2 && task1.priority == task2.priority;
	}; 
    
    $scope.moveHereVisibleInContext = function() {
    	return $scope.moveHereVisible($scope.selectedIndex);
	}; 

	$scope.findTaskUser = function(task) {
    	for(var i=0; i <task.assignedTo.length; i++) {
    		var taskUser = task.assignedTo[i];
    		if (taskUser.assignee.id == $scope.id) {
    			return taskUser;
    		}
    	}
    	return null;
    };

    
    var swap = function(idx, newIdx) {
    	var task1 = $scope.items[idx];
    	var task2 = $scope.items[newIdx];
    	
		if (task1.priority != task2.priority) {
			$scope.moveIndex = undefined;
			$scope.alerts.push({ type: 'warning', msg: 'Task priorities must match to change order.'});
			$window.scrollTo(0, 0);
			return;
		}

		var taskUser = $scope.findTaskUser(task1);
        var order;
    	
        if (newIdx > idx) {
            var taskUser1 = $scope.findTaskUser($scope.items[newIdx]);
            var taskUser2;
        	if (newIdx + 1 < $scope.items.length) {
        	    taskUser2 = $scope.findTaskUser($scope.items[newIdx + 1]);
        	    order = taskUser1.taskOrder + (taskUser2.taskOrder - taskUser1.taskOrder) / 2.0;  
        	} else {
        	    order = taskUser1.taskOrder + 1; 
        	}
        } else {
            var taskUser1;
            var taskUser2 = $scope.findTaskUser($scope.items[newIdx]);
            if (newIdx - 1 >= 0) {
                taskUser1 = $scope.findTaskUser($scope.items[newIdx - 1]);
                order = taskUser1.taskOrder + (taskUser2.taskOrder - taskUser1.taskOrder) / 2.0;  
            } else {
                order = taskUser2.taskOrder - 1; 
            }
        }
		$http.post('rest/change-task-order', {"taskUserId" : taskUser.id, "order": order}).success(
			function(data) {
				$scope.checkSession(data);
				if (!data.errors.length) {
					taskUser.taskOrder = order;
				    if (newIdx < idx) {
	                    $scope.items.splice(newIdx, 0, task1);
				        idx ++;
	                    $scope.items.splice(idx, 1);
				    } else {
                        newIdx ++;
                        $scope.items.splice(newIdx, 0, task1);
                        $scope.items.splice(idx, 1);
				    } 
				}
			}
		);
    };
    
	$scope.deleteTask = function(idx) {
		if (angular.isDefined(idx)) {
			$scope.selectedTask = $scope.items[idx];
		}
		
	    var title = 'Delete this task?';
	    var msg = $scope.selectedTask.summary;
	    var btns = [{result:'no', label: 'No'}, {result:'yes', label: 'Yes', cssClass: 'btn-primary'}];

	    $dialog.messageBox(title, msg, btns).open().then(function(result) {
			if (result == 'yes') {
				$http.post('rest/delete-task', {"id" : $scope.selectedTask.id}).success(
					function(data) {
						$scope.checkSession(data);
						if (data.errors.length) {
							for (var i = 0; i < data.errors.length; i++) {
								if (data.errors[i].errorCode == -10) {
									$scope.alerts.push({ type: 'error', msg: 'You do not have permission to delete task # ' + $scope.selectedTask.id});
								} else {
									$scope.alerts.push({ type: 'error', msg: data.errors[i].message});
								}
							}
						} else {
							var idx = _.indexOf($scope.items, $scope.selectedTask);
							$scope.items.splice(idx, 1);
							$scope.totalItems --;
							$scope.alerts.push({ type: 'success', msg: 'Task # ' + $scope.selectedTask.id + ' was deleted.'});					
						}
						$window.scrollTo(0, 0);
					}
				);
			}
		});
	};	

	$scope.menuClick = function(idx) {
		$scope.selectedTask = $scope.items[idx];
		$scope.selectedIndex = idx;
		$scope.myIndex = idx;

        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };

    $scope.opts = {
	    backdrop: true,
	    dialogClass: 'modal task-view-dialog',
	    keyboard: true,
	    backdropClick: true,
	    backdropFade: true,
	    templateUrl:  'partials/task-view.html', 
	    controller: 'TaskDialogController',
	    resolve: {
	        task: function() { 
	        	return $scope.selectedTask;
	        }
    	}
  	};
}

function VersionCtrl($scope, $http, $q, $routeParams, $filter, $timeout, $location, $window, $dialog, Version) {
    $scope.searchText = $routeParams.q || '';
	$scope.id = $routeParams.id || 0;
	$scope.items = [];
	$scope.projectId = $routeParams.projectId || 0;
	$scope.excludeTaskId = false;
	$scope.version = {};
	$scope.alerts.length= 0;

	var tsToDate = function(ts) {
        var r = ts;
              if (r) {
                  r = new Date(ts);
              }
              return r;
    };

	$scope.loadVersion = function() {
        $scope.checkSession(Version);
        if (!Version.errors.length) {
            $scope.version = Version.version;
            $scope.project = Version.project;
            $scope.version.versionDate = tsToDate(Version.version.versionDate);
        }
	}();
	
    $scope.$watch("version.versionDate", function(newValue, oldValue) {
    	if ($scope.version && $scope.version.versionDate) {
        	$scope.loadTasks();
    	} 
    });
	

	$scope.loadTasks = function() {
		var date = dateToTs($scope.version.versionDate);
		$http.post('rest/get-changelog', {"projectId" : $scope.projectId, "date": date}).success(
			function(data) {
				$scope.checkSession(data);
				if (!data.errors.length) {
					var items = data.projectTasks;
					$scope.items.length = 0;
					for (var i = 0; i < items.length; i++) {
						var task = items[i];
						$scope.items.push(task);
					}
					$scope.generateChangelog(); 
				}
			}
		);
	};
	
    $scope.$watch("excludeTaskId", function(newValue, oldValue) {
    	$scope.generateChangelog();
    });
	
	$scope.generateChangelog = function () {
		var changelog = "";
		for (var i = 0; i < $scope.items.length; i++) {
			var task = $scope.items[i];
			changelog += (i+1) + ". " + task.summary;
			if (!$scope.excludeTaskId) {
				changelog += " (Task # " + task.id + ")";	
			}
			changelog += "\r\n";
		}
		$scope.version.changelog = changelog; 
	};
	


	var dateToTs = function(dt) {
		var r = dt;
		if (r) {
			r = r.getTime();			
		}
		return r;
	};

	$scope.dateOptions = {
	        dateFormat: 'dd M yy'
    };

	$scope.errorText = function(error) {
		if (error.required) {
			return "Required field";
		} else {
			return null;
		}
	};
	
	$scope.save = function() {
		var data = {}
		data.id = $scope.id;
		data.projectId = $scope.projectId;
		data.name = $scope.version.name;
		data.versionDate = dateToTs($scope.version.versionDate);
		data.changelog = $scope.version.changelog;

		$http.post('rest/save-version', data).success(
			function(data, status, headers, config) {
				$scope.checkSession(data);
				if (!data.errors.length) {
					$window.history.back();
				} else {
					for (var i = 0; i < data.errors.length; i++) {
						$scope.alerts.push({ type: 'error', msg: data.errors[i].message});
					}
				}
			}
		);
	};
}
VersionCtrl.resolve = {
    Version:function ($q, $route, $timeout, $http) {
        var deferred = $q.defer();
	    var id = $route.current.params.id || 0;
    	var projectId = $route.current.params.projectId || 0;
        $http.post('rest/get-version', {id: id, projectId: projectId , addIfNotFound:true}).success(
        	function(data, status, headers, config) {
        	    deferred.resolve(data);
        	}
        )
        return deferred.promise;
    }
}

function VersionsCtrl($scope, $http, $routeParams, $filter, $timeout, $location, $dialog, $window) {
	$scope.projectId = $routeParams.projectId || 0;
	$scope.items = [];
	$scope.pageSize = 20;
	$scope.page = 1;
	$scope.searchText = "";
	$scope.busy = false;
	$scope.alerts.length= 0;
	
	$scope.loadPage = function() {
		if ($scope.busy) return;
		$scope.busy = true;
		$http.post('rest/get-versions', {"projectId" : $scope.projectId, "pageSize": $scope.pageSize, "page" : $scope.page, "searchText" : $scope.searchText}).success(
			function(data) {
				$scope.checkSession(data);
				if (!data.errors.length) {
					$scope.project = data.project;
					$scope.totalItems = data.totalItems;
					var items = data.versions;
					for (var i = 0; i < items.length; i++) {
						$scope.items.push(items[i]);
					}
					$scope.page ++;
					$scope.busy = false;
				}
			}
		);
	};
	
	$scope.scrollDisabled = function() {
		return ($scope.busy || $scope.items.length >= $scope.totalItems);
	};  	

	$scope.search = function() {
	  	$scope.searchText = this.text;
	  	$scope.page = 1;
		$scope.items.length = 0;
		$scope.loadPage();
    };

	$scope.editVersion = function() {
		$location.path('/version/' + $scope.selectedVersion.project.id + '/' + $scope.selectedVersion.id);
    };

	$scope.menuClick = function(data) {
		$scope.selectedVersion = data;
    };

  	$scope.viewVersion= function(idx) {
		if (angular.isDefined(idx)) {
			$scope.selectedVersion = $scope.items[idx];
		}
        $location.path('/view-version/' + $scope.selectedVersion.project.id + '/' + $scope.selectedVersion.id + '/' + $scope.searchText);
  	};    
}

function UsersCtrl($scope, $http, $routeParams, $filter, $timeout, $location, $dialog, $window) {
    $scope.items = [];
    $scope.pageSize = 20;
    $scope.page = 1;
    $scope.searchText = "";
    $scope.busy = false;
	$scope.alerts.length= 0;
    $scope.orderBy = $routeParams.orderBy || 2;
    $scope.orderDir = $routeParams.orderDir || 'desc';
    
    $scope.loadPage = function() {
        if ($scope.busy) return;
        $scope.busy = true;
        $http.post('rest/get-users-ext', {"pageSize": $scope.pageSize, "page" : $scope.page, "searchText" : $scope.searchText, "orderBy": $scope.orderBy, "orderDir": $scope.orderDir}).success(
            function(data) {
                $scope.checkSession(data);
                if (!data.errors.length) {
                    $scope.totalItems = data.totalItems;
                    var items = data.users;
                    for (var i = 0; i < items.length; i++) {
                        var user = items[i];
                        
                        user.isAdmin = (user.roles.indexOf("ROLE_ADMIN") !== -1);
                        user.isManager = (user.roles.indexOf("ROLE_MANAGER") !== -1);
                        user.isWorker = (user.roles.indexOf("ROLE_WORKER") !== -1);

                        $scope.items.push(user);
                    }
                    $scope.page ++;
                    $scope.busy = false;
                }
            }
        );
    };
    
    $scope.scrollDisabled = function() {
        return ($scope.busy || $scope.items.length >= $scope.totalItems);
    };      

	$scope.switchToSortType = function(orderBy) {
	    if (orderBy != $scope.orderBy) {
	        $scope.orderDir = 'desc'
	    }
        $location.path('/users/' + orderBy + '/' + $scope.orderDir + '/');
	}

    $scope.toggleSort = function() {
        $scope.searchText = this.text;
    	$scope.alerts.length = 0;
    	$scope.page = 1;
    	$scope.items.length = 0;
    	if ($scope.orderDir == 'asc') {
    	    $scope.orderDir = 'desc';
    	} else {
    	    $scope.orderDir = 'asc';
    	}
        $scope.switchToSortType($scope.orderBy);
    };

    $scope.sortClass = function() {
        if ($scope.orderDir == 'desc') {
            return "icon-arrow-up";
        }
        else {
            return "icon-arrow-down";
        }
    };

    $scope.search = function() {
        $scope.searchText = this.text;
        $scope.page = 1;
        $scope.items.length = 0;
        $scope.loadPage();
    };

    $scope.editUser = function() {
        $location.path('/user/' + $scope.selectedUser.id);
    };

    $scope.deleteUser = function() {
        $location.path('/delete-user/' + $scope.selectedUser.id);
    };

    $scope.menuClick = function(data) {
        $scope.selectedUser = data;
    };
}


function UserCtrl($scope, $routeParams, $http, $window, $filter, $timeout, $location, User) {
    $scope.id = $routeParams.id || 0;
	$scope.alerts.length= 0;

    var userInfo = function() {
        if ($scope.id) {
            $scope.checkSession(User);
            if (!User.errors.length) {
                $scope.user = User.user;
                $scope.user.isAdmin = (User.user.roles.indexOf("ROLE_ADMIN") !== -1);
                $scope.user.isManager = (User.user.roles.indexOf("ROLE_MANAGER") !== -1);
                $scope.user.isWorker = (User.user.roles.indexOf("ROLE_WORKER") !== -1);
            }
        }
    }();

    $scope.update = function() {
        $scope.alerts = [];
        
        var roles = [];
        
        if ($scope.user.isWorker) {
            roles.push('ROLE_WORKER');
        }
        if ($scope.user.isManager) {
            roles.push('ROLE_MANAGER');
        }
        if ($scope.user.isAdmin) {
            roles.push('ROLE_ADMIN');
        }
        
        if ($scope.form.name.$valid) {
            $http.post('rest/save-user', {id : $scope.user.id, name : $scope.user.name, email : $scope.user.email, roles: roles.join(), active:$scope.user.active }).success(
                function(data, status, headers, config) {
                    $scope.checkSession(data);
                    if (!data.errors.length) {
                        $scope.$broadcast('userUpdated', data.user);
                        $window.history.back();                        
                    } else {
                        for (var i = 0; i < data.errors.length; i++) {
                            $scope.alerts.push({ type: 'error', msg: data.errors[i].message});
                        }
                    }
                }
            );
        } 
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };
}
UserCtrl.resolve = {
    User:function ($q, $route, $timeout, $http) {
        var deferred = $q.defer();
	    var id = $route.current.params.id || 0;
        $http.post('rest/ get-user', {id: id}).success(
            function(data, status, headers, config) {
        	    deferred.resolve(data);
        	}
        )
        return deferred.promise;
    }
}

function DeleteGroupCtrl($scope, $routeParams, $http, $window, $filter, $timeout, $location, Group) {
    $scope.id = $routeParams.id || 0;
    $scope.alerts.length= 0;
    $scope.groupUser = [];

    $scope.loadGroup = function() {
        if ($scope.id) {
            $scope.checkSession(Group);
            if (!Group.errors.length) {
                $scope.group = Group.group;
                $scope.group.name = Group.group.name;
                $scope.totalUser = Group.group.groupUsers.length;

                for (var i = 0; i< Group.group.groupUsers.length; i++ ) {
                    var user = Group.group.groupUsers[i].member;
                    $scope.groupUser.push(user);
                }
            }
        }
    }();

    $scope.deleteGroup = function() {
        $scope.alerts = [];
        $http.post('rest/delete-group', {id: $scope.group.id}).success(
            function(data, status, headers, config) {
                $scope.checkSession(data);
                if (!data.errors.length) {
                    $window.history.back();
                } else {
                    for (var i = 0; i < data.errors.length; i++) {
                        $scope.alerts.push({ type: 'error', msg: data.errors[i].message});
                    }
                }
            }
        );
    };

}
DeleteGroupCtrl.resolve = {
    Group:function ($q, $route, $timeout, $http) {
        var deferred = $q.defer();
	    var id = $route.current.params.id || 0;
        $http.post('rest/get-group', {"id": id}).success(
            function(data, status, headers, config) {
        	    deferred.resolve(data);
        	}
        )
        return deferred.promise;
    }
}

function DeleteUserCtrl($scope, $routeParams, $http, $window, $filter, $timeout, $location, User) {
    $scope.id = $routeParams.id || 0;
    $scope.alerts.length= 0;
    $scope.users = [];

    var loadUsers = function() {
        $http.post('rest/get-users', {}).success(
            function(data, status, headers, config) {
                $scope.checkSession(data);
                if (!data.errors.length) {
                    $scope.users = data.users;
                }
            }
        );
    };

    
    var userInfo = function() {
        $scope.checkSession(User);
        if (!User.errors.length) {
            $scope.user = User.user;
            loadUsers();
        }
    }();
    
    $scope.select = function(u) {
        $scope.replacementUser = u;
    }
    
    $scope.isDifferent = function(u) {
        var r = $scope.user.id != u.id; 
        if (r && !$scope.replacementUser) {
            $scope.replacementUser = u;
        }
        return r;
    }
    
    $scope.deleteUser = function(u) {
        $http.post('rest/delete-user', {id: $scope.user.id, replacementUserId: $scope.replacementUser.id}).success(
            function(data, status, headers, config) {
                $scope.checkSession(data);
                if (!data.errors.length) {
                    $window.history.back();
                } else {
                    for (var i = 0; i < data.errors.length; i++) {
                        $scope.alerts.push({ type: 'error', msg: data.errors[i].message});
                    }
                }
            }
        );
    };
}
DeleteUserCtrl.resolve = {
    User:function ($q, $route, $timeout, $http) {
        var deferred = $q.defer();
	    var id = $route.current.params.id || 0;
        $http.post('rest/get-user', {id: id}).success(
            function(data, status, headers, config) {
        	    deferred.resolve(data);
        	}
        )
        return deferred.promise;
    }
}

function ProjectCtrl($scope, $http, $q, $routeParams, $filter, $timeout, $location, $window, $dialog, Project, Users) {
	$scope.id = $routeParams.id || 0;
	$scope.project = {};
	$scope.alerts.length= 0;
	$scope.users = [];
	$scope.ccList = [];
   
	var loadProject = function() {
        $scope.checkSession(Project);
        if (!Project.errors.length) {
            $scope.project = Project.project;
            for (var i = 0; i < Project.ccList.length; i++) {
                var user = Project.ccList[i];
                $scope.ccList.push(user);
            }
        }
	}();
	
	var loadUsers = function() {
        $scope.checkSession(Users);
        if (!Users.errors.length) {
            var items = Users.users;
            for (var i = 0; i < items.length; i++) {
                $scope.users.push(items[i]);
            }
        }
	}();

	$scope.save = function() {
		var data = {};
		data.id = $scope.id;
		data.title = $scope.project.title;
		data.share = $scope.project.share;		
		data.cc = ""; 	
				
		for(var i=0; i < $scope.ccList.length; i++) {
			data.cc += $scope.ccList[i].id + ",";
		}
		
		$http.post('rest/save-project', data).success(
			function(data, status, headers, config) {
				$scope.checkSession(data);				
				if (!data.errors.length) {
					if ($scope.id) {
						$window.history.back();					
					} else {
						if (data.project.share) {
							$location.path('/projects/pb');
						} else {
							$location.path('/projects/pr');						
						}
					}
				} else {
					for (var i = 0; i < data.errors.length; i++) {
						$scope.alerts.push({ type: 'error', msg: data.errors[i].message});
					}
				}
			}
		);
	};
}
ProjectCtrl.resolve = {
    Project:function ($q, $route, $timeout, $http) {
        var deferred = $q.defer();
	    var id = $route.current.params.id || 0;
        $http.post('rest/get-project', {id: id, loadCcList: true}).success(
        	function(data, status, headers, config) {
        	    deferred.resolve(data);
        	}
        )
        return deferred.promise;
    },
    Users:function ($q, $route, $timeout, $http) {
        var deferred = $q.defer();
        var id = $route.current.params.id || 0;
        $http.post('rest/get-users', {roles:[]}).success(
        	function(data, status, headers, config) {
                deferred.resolve(data);
            }
        )
        return deferred.promise;
    }
}

function GroupCtrl($scope, $http, $routeParams, $filter, $timeout, $location, $dialog, $window, Group, Users){
    $scope.id = $routeParams.id || 0;
    $scope.users = [];
    $scope.groupUser = [];
    $scope.totalUser = 0;

    $scope.loadGroup = function() {
        if ($scope.id) {
            $scope.checkSession(Group);
            if (!Group.errors.length) {
                $scope.group = Group.group;
                $scope.group.name = Group.group.name;
                $scope.totalUser = Group.group.groupUsers.length;

                for (var i = 0; i< Group.group.groupUsers.length; i++ ) {
                    var user = Group.group.groupUsers[i].member;
                    $scope.groupUser.push(user);
                }
            }
        }
    }();

    var loadUsers = function() {
        $scope.checkSession(Users);
        if (!Users.errors.length) {
            var items = Users.users;
            for (var i = 0; i < items.length; i++) {
                $scope.users.push(items[i]);
            }
        }
    }();

    $scope.save = function() {
    	$scope.alerts = [];
        var data = {};
        data.groupUser = [];

        data.id = $scope.id;
        data.name = $scope.group.name;

        for(var i=0; i<$scope.groupUser.length; i++) {
            data.groupUser.push($scope.groupUser[i].id);
        }

        $http.post('rest/save-group', data).success(
            function(data, status, headers, config) {
                $scope.checkSession(data);
                if (!data.errors.length) {
                    $window.history.back();
                } else {
                    for (var i = 0; i < data.errors.length; i++) {
                        $scope.alerts.push({ type: 'error', msg: data.errors[i].message});
                    }
                }
            }
        );
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };
}
GroupCtrl.resolve = {
    Group:function ($q, $route, $timeout, $http) {
        var deferred = $q.defer();
	    var id = $route.current.params.id || 0;
        $http.post('rest/get-group', {"id": id}).success(
        	function(data, status, headers, config) {
        	    deferred.resolve(data);
        	}
        )
        return deferred.promise;
    },
    Users:function ($q, $route, $timeout, $http) {
        var deferred = $q.defer();
        var id = $route.current.params.id || 0;
        $http.post('rest/get-users', {roles:[]}).success(
            function(data, status, headers, config) {
                deferred.resolve(data);
            }
        )
        return deferred.promise;
    }
}


function GroupUserTaskCtrl($scope, $http, $routeParams, $filter, $timeout, $location, $dialog, $window, Group, GroupProjectTasks){
    $scope.id = $routeParams.id || 0;
    $scope.users = [];
    $scope.groupUser = [];
    $scope.totalUser = 0;
    $scope.busy = false;
    $scope.items = [];
    $scope.alerts.length= 0;



    $scope.loadPage = function() {
        if ($scope.busy) return;
        $scope.busy = true;

        if ($scope.id) {
            $scope.checkSession(Group);
            if (!Group.errors.length) {
                $scope.group = Group.group;
                $scope.group.name = Group.group.name;
                $scope.totalUser = Group.group.groupUsers.length;

                for (var i = 0; i< Group.group.groupUsers.length; i++ ) {
                    var user = Group.group.groupUsers[i].member;
                    $scope.assigneeId = Group.group.groupUsers[0].member.id;
                    $scope.groupUser.push(user);
                }
            }
        }

        $scope.checkSession(GroupProjectTasks);
        if (!GroupProjectTasks.errors.length) {
            $scope.assignee = GroupProjectTasks.assignee;
            $scope.totalItems = GroupProjectTasks.totalItems;
            var items = GroupProjectTasks.projectTasks;
            for (var i = 0; i < items.length; i++) {
                $scope.items.push(items[i]);
            }

            $scope.page ++;
            $scope.busy = false;
            $scope.loadRecentUsers(true);
        }
    }();


    $scope.totalItemsText = function() {
        var r = "";
        if ($scope.totalItems == 1) {
            r = $scope.totalItems + " task" + " on going";
        } else if ($scope.totalItems > 1) {
            r = $scope.totalItems + " tasks" + " on going";
        }
        return r;
    };

    $scope.scrollDisabled = function() {
        return ($scope.busy || $scope.items.length >= $scope.totalItems);
    };

	$scope.editTask = function(idx) {
		if (angular.isDefined(idx)) {
			$scope.selectedTask = $scope.items[idx];
		}

		$location.path('/task/' + $scope.selectedTask.project.id + '/' + $scope.selectedTask.id);
    };

	$scope.findTaskUser = function(task) {
    	for(var i=0; i <task.assignedTo.length; i++) {
    		var taskUser = task.assignedTo[i];
    		if (taskUser.assignee.id == $scope.id) {
    			return taskUser;
    		}
    	}
    	return null;
    };


	$scope.deleteTask = function(idx) {
		if (angular.isDefined(idx)) {
			$scope.selectedTask = $scope.items[idx];
		}

	    var title = 'Delete this task?';
	    var msg = $scope.selectedTask.summary;
	    var btns = [{result:'no', label: 'No'}, {result:'yes', label: 'Yes', cssClass: 'btn-primary'}];

	    $dialog.messageBox(title, msg, btns).open().then(function(result) {
			if (result == 'yes') {
				$http.post('rest/delete-task', {"id" : $scope.selectedTask.id}).success(
					function(data) {
						$scope.checkSession(data);
						if (data.errors.length) {
							for (var i = 0; i < data.errors.length; i++) {
								if (data.errors[i].errorCode == -10) {
									$scope.alerts.push({ type: 'error', msg: 'You do not have permission to delete task # ' + $scope.selectedTask.id});
								} else {
									$scope.alerts.push({ type: 'error', msg: data.errors[i].message});
								}
							}
						} else {
							var idx = _.indexOf($scope.items, $scope.selectedTask);
							$scope.items.splice(idx, 1);
							$scope.totalItems --;
							$scope.alerts.push({ type: 'success', msg: 'Task # ' + $scope.selectedTask.id + ' was deleted.'});
						}
						$window.scrollTo(0, 0);
					}
				);
			}
		});
	};

	$scope.menuClick = function(idx) {
		$scope.selectedTask = $scope.items[idx];
		$scope.selectedIndex = idx;
		$scope.myIndex = idx;

        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };

    $scope.opts = {
	    backdrop: true,
	    dialogClass: 'modal task-view-dialog',
	    keyboard: true,
	    backdropClick: true,
	    backdropFade: true,
	    templateUrl:  'partials/task-view.html',
	    controller: 'TaskDialogController',
	    resolve: {
	        task: function() {
	        	return $scope.selectedTask;
	        }
    	}
  	};
}
GroupUserTaskCtrl.resolve = {
    Group:function ($q, $route, $timeout, $http) {
        var deferred = $q.defer();
	    var id = $route.current.params.id || 0;
        $http.post('rest/get-group', {"id": id}).success(
             function(data, status, headers, config) {
        	    deferred.resolve(data);
        	}
        )
        return deferred.promise;
    },
    GroupProjectTasks:function ($q, $route, $timeout, $http) {
        var deferred = $q.defer();
        var id = $route.current.params.id || 0;
        var pageSize = 20;
        var page = 1;
        var searchText = "";
        $http.post('rest/get-group-project-tasks', {"groupId" : id, "pageSize": pageSize, "page" : page, "searchText" : searchText}).success(
            function(data) {
                deferred.resolve(data);
            }
        )
        return deferred.promise;
    }
}



function CurrentGroupTaskCtrl($scope, $http, $routeParams, $filter, $timeout, $location, $dialog, $window){
    $scope.users = [];
    $scope.groupUser = [];
    $scope.totalUser = 0;
    $scope.busy = false;
    $scope.items = [];
    $scope.alerts.length= 0;
    $scope.groups = [];
    $scope.onLoadGroupId = 0;

    //loading all private groups
    var loadGroups = function() {
        $scope.busy = true;
        $http.post('rest/get-groups', {fetchPrivateGroups: true, fetchPublicGroups: false}).success(
            function(data, status, headers, config) {
                $scope.checkSession(data);
                if (!data.errors.length && data.totalItems > 0) {
                    $scope.groups = data.privateGroups;
                    $scope.onLoadGroupId = $scope.groups[0].id;
                    $scope.busy = false;
                    loadPage();
                } else {
                    $scope.busy = false;
                    return;
                }
            }
        );
    }();

    var loadPage = function() {
        $scope.busy = true;
        $http.post('rest/get-user', {id: $scope.loggedUser.id}).success(
            function(data, status, headers, config) {
                $scope.checkSession(data);
                if (!data.errors.length) {
                    $scope.user = data.user;
                    $scope.id = data.user.watchGroupId;  // last accessed group id

                    if ($scope.id) {
                        $scope.busy = true;
                        $scope.items.length = 0;
                        $http.post('rest/get-group', {"id": $scope.id}).success(
                            function(data, status, headers, config) {
                                $scope.checkSession(data);
                                if (!data.errors.length) {
                                    $scope.group = data.group;
                                    $scope.group.name = data.group.name;
                                    $scope.totalUser = data.group.groupUsers.length;
                                    $scope.selectedGroup = data.group;
                                    for (var i = 0; i< data.group.groupUsers.length; i++ ) {
                                        var user = data.group.groupUsers[i].member;
                                        $scope.assigneeId = data.group.groupUsers[0].member.id;
                                        $scope.groupUser.push(user);
                                    }
                                }
                            }
                        );

                        $http.post('rest/get-group-project-tasks', {"groupId" : $scope.id, "pageSize": $scope.pageSize, "page" : $scope.page, "searchText" : $scope.searchText, updateWatchGroupId : false}).success(
                            function(data) {
                                $scope.checkSession(data);
                                if (!data.errors.length) {
                                    $scope.assignee = data.assignee;
                                    $scope.totalItems = data.totalItems;
                                    var items = data.projectTasks;
                                    for (var i = 0; i < items.length; i++) {
                                        $scope.items.push(items[i]);
                                    }

                                    $scope.page ++;
                                    $scope.busy = false;
                                    $scope.loadRecentUsers(true);
                                }
                            }
                        );

                    } else {
                        if (($scope.items.length == 0 && $scope.onLoadGroupId == 0)) {
                            return;
                        }
                        $scope.busy = true;
                        $scope.items.length = 0;
                        $http.post('rest/get-group', {"id": $scope.onLoadGroupId}).success(
                            function(data, status, headers, config) {
                                $scope.checkSession(data);
                                if (!data.errors.length) {
                                    $scope.group = data.group;
                                    $scope.group.name = data.group.name;
                                    $scope.totalUser = data.group.groupUsers.length;
                                    $scope.selectedGroup = data.group;
                                    for (var i = 0; i< data.group.groupUsers.length; i++ ) {
                                        var user = data.group.groupUsers[i].member;
                                        $scope.assigneeId = data.group.groupUsers[0].member.id;
                                        $scope.groupUser.push(user);
                                    }
                                }
                            }
                        );




                        $http.post('rest/get-group-project-tasks', {"groupId" : $scope.onLoadGroupId, "pageSize": $scope.pageSize, "page" : $scope.page, "searchText" : $scope.searchText, updateWatchGroupId : true}).success(
                            function(data) {
                                $scope.checkSession(data);
                                if (!data.errors.length) {
                                    $scope.assignee = data.assignee;
                                    $scope.totalItems = data.totalItems;
                                    var items = data.projectTasks;
                                    for (var i = 0; i < items.length; i++) {
                                        $scope.items.push(items[i]);
                                    }

                                    $scope.page ++;
                                    $scope.busy = false;
                                    $scope.loadRecentUsers(true);
                                }
                            }
                        );

                    }
                }
            }
        );


    };

    $scope.select = function(g) {
        $scope.selectedGroup = g;
        $scope.items.length = 0;

        $http.post('rest/get-group', {"id": $scope.selectedGroup.id}).success(
            function(data, status, headers, config) {
                $scope.checkSession(data);
                if (!data.errors.length) {
                    $scope.group = data.group;
                    $scope.group.name = data.group.name;
                    $scope.totalUser = data.group.groupUsers.length;
                    $scope.selectedGroup = data.group;
                    for (var i = 0; i< data.group.groupUsers.length; i++ ) {
                        var user = data.group.groupUsers[i].member;
                        $scope.assigneeId = data.group.groupUsers[0].member.id;
                        $scope.groupUser.push(user);
                    }
                }
            }
        );

        $http.post('rest/get-group-project-tasks', {"groupId" : $scope.selectedGroup.id, "pageSize": $scope.pageSize, "page" : $scope.page, "searchText" : $scope.searchText, updateWatchGroupId : true}).success(
            function(data) {
                $scope.checkSession(data);
                if (!data.errors.length) {
                    $scope.assignee = data.assignee;
                    $scope.totalItems = data.totalItems;
                    var items = data.projectTasks;
                    for (var i = 0; i < items.length; i++) {
                        $scope.items.push(items[i]);
                    }

                    $scope.page ++;
                    $scope.busy = false;
                    $scope.loadRecentUsers(true);
                }
            }
        );
    }


    $scope.totalItemsText = function() {
        var r = "";
        if ($scope.totalItems == 1) {
            r = $scope.totalItems + " task" + " on going";
        } else if ($scope.totalItems > 1) {
            r = $scope.totalItems + " tasks" + " on going";
        }
        return r;
    };

    $scope.scrollDisabled = function() {
        return ($scope.busy || $scope.items.length >= $scope.totalItems);
    };

	$scope.editTask = function(idx) {
		if (angular.isDefined(idx)) {
			$scope.selectedTask = $scope.items[idx];
		}

		$location.path('/task/' + $scope.selectedTask.project.id + '/' + $scope.selectedTask.id);
    };

	$scope.findTaskUser = function(task) {
    	for(var i=0; i <task.assignedTo.length; i++) {
    		var taskUser = task.assignedTo[i];
    		if (taskUser.assignee.id == $scope.id) {
    			return taskUser;
    		}
    	}
    	return null;
    };


	$scope.deleteTask = function(idx) {
		if (angular.isDefined(idx)) {
			$scope.selectedTask = $scope.items[idx];
		}

	    var title = 'Delete this task?';
	    var msg = $scope.selectedTask.summary;
	    var btns = [{result:'no', label: 'No'}, {result:'yes', label: 'Yes', cssClass: 'btn-primary'}];

	    $dialog.messageBox(title, msg, btns).open().then(function(result) {
			if (result == 'yes') {
				$http.post('rest/delete-task', {"id" : $scope.selectedTask.id}).success(
					function(data) {
						$scope.checkSession(data);
						if (data.errors.length) {
							for (var i = 0; i < data.errors.length; i++) {
								if (data.errors[i].errorCode == -10) {
									$scope.alerts.push({ type: 'error', msg: 'You do not have permission to delete task # ' + $scope.selectedTask.id});
								} else {
									$scope.alerts.push({ type: 'error', msg: data.errors[i].message});
								}
							}
						} else {
							var idx = _.indexOf($scope.items, $scope.selectedTask);
							$scope.items.splice(idx, 1);
							$scope.totalItems --;
							$scope.alerts.push({ type: 'success', msg: 'Task # ' + $scope.selectedTask.id + ' was deleted.'});
						}
						$window.scrollTo(0, 0);
					}
				);
			}
		});
	};

	$scope.menuClick = function(idx) {
		$scope.selectedTask = $scope.items[idx];
		$scope.selectedIndex = idx;
		$scope.myIndex = idx;

        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };

    $scope.opts = {
	    backdrop: true,
	    dialogClass: 'modal task-view-dialog',
	    keyboard: true,
	    backdropClick: true,
	    backdropFade: true,
	    templateUrl:  'partials/task-view.html',
	    controller: 'TaskDialogController',
	    resolve: {
	        task: function() {
	        	return $scope.selectedTask;
	        }
    	}
  	};

}






