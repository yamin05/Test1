/* ========================================================
 * bootstrap-uploader.js v1.0.0
 * ======================================================== */
;

(function ($) {

    "use strict"; // jshint ;_;

    var statusZone, globalInfo, globalSecondsRemainingText,
        globalSpeedText, bytesRemaining, totalBytes,
        filesRemaining, fileQueue = [];
    var SPEED_SMOOTHING_FACTOR = 0.005;
    var SPEED_INTERVAL = 300;

    var isCanvasSupported = function () {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    }

    var notifyParent = function () {
        if (window.parent.uploader.onProgress) {
            window.parent.uploader.onProgress(filesRemaining, fileQueue.length, globalSpeedText, globalSecondsRemainingText, totalBytes, bytesRemaining);
        }
    }

    var getParams = function (file, path) {
    	if (window.parent.uploader.getParams) {
    		return window.parent.uploader.getParams(file, path)
    	} else {
    		return {};
    	}
    }

    var html5DisabledCallback = function () {
    	if (window.parent.uploader.html5DisabledCallback) {
    		window.parent.uploader.html5DisabledCallback();
    	}
    }

    var getFolderInfo = function (file, path) {
    	if (window.parent.uploader.getFolderInfo) {
    		return window.parent.uploader.getFolderInfo(file, path);    	
    	} else {
    		return {'info':'', 'tooltip':''};
    	}
    }

    var onUploadSuccess = function (file, response) {
        if (window.parent.uploader.onUploadSuccess) {
            return window.parent.uploader.onUploadSuccess(file, response);
        }
    }

    var processPreloadFiles = function (file) {
        if (window.parent.uploader.preloadFiles) {
            return preloadAll(window.parent.uploader.preloadFiles);
        }
    }

    var getHeaderText = function () {
        var r = 'Uploads';
        if (window.parent.uploader.headerText) {
            r = window.parent.uploader.headerText;
        }
        return r;
    }

    var getFileUrl = function (file) {
        if (window.parent.uploader.getFileUrl) {
            return window.parent.uploader.getFileUrl(file);
        }
    }

    var onFileRemove = function (file) {
        if (window.parent.uploader.onFileRemove) {
            return window.parent.uploader.onFileRemove(file);
        }
    }

    var isHideClearButton = function () {
        var r = false;
        if (window.parent.uploader.hideClearButton) {
            r = window.parent.uploader.hideClearButton;
        }
        return r;
    }

    var getDoneButtonCallback = function () {
        var r = false;
        if (window.parent.uploader.doneButtonCallback) {
            r = window.parent.uploader.doneButtonCallback;
        }
        return r;
    }

    var timeString = function (seconds) {
        if (seconds < 1) {
            return '';
        }

        var txt = {
            weeks: ['week', 'weeks'],
            days: ['day', 'days'],
            hours: ['hour', 'hours'],
            minutes: ['min', 'mins'],
            seconds: ['sec', 'secs']
        };

        var units = {
            weeks: 7 * 24 * 60 * 60,
            days: 24 * 60 * 60,
            hours: 60 * 60,
            minutes: 60,
            seconds: 1
        };

        var returnArray = [];
        var value, unit, secondsConverted;
        for (unit in units) {
            value = units[unit];
            if (seconds / value >= 1 || unit == 'seconds') {
                secondsConverted = Math.floor(seconds / value);
                var txtUnit = txt[unit][secondsConverted == 1 ? 0 : 1];
                returnArray.push(secondsConverted + ' ' + txtUnit);
                seconds -= secondsConverted * value;
                break;
            }
        };

        return returnArray.join(', ') + ' left';
    };

    function FileRow(fileinfo, folderinfo, file) {
        var self = this;
        this.fileinfo = fileinfo;
        this.folderinfo = folderinfo || '';        
        var t = "<li>" +
            "	<div class=\"msg\">" +
            "		<div class=\"filename\">" + fileinfo + "<\/div>" +
            "		<div class=\"foldername\" title=\"" + folderinfo.tooltip + "\">" + folderinfo.info + "<\/div>" +            
            "		<div class=\"spinner success-icon error-icon remove-icon\"><\/div>" +
            "		<div class=\"info\"><\/div>" +
            "	<\/div>" +
            "	<div class=\"bg\" style=\"width: 0%;\"><\/div>" +
            "<\/li>";
        this.li = $(t);
        this.li.appendTo(statusZone);
        this.info = "";
        this.error = undefined;
        this.progress = 0;
        this.file = file;
        
        this.li.find('.filename, .foldername').each(function( key, value ) {
        	var width = $(this).width() || $(this).css('min-width');
        	$(this).css({
	        	'white-space':'nowrap',
	        	'max-width':$(this).width(),
	        	'overflow':'hidden', 
	        	'text-overflow':'ellipsis'
        	});
        	var title = $(this).attr('title');
        	if (!title) {
        		$(this).attr('title', $(this).text());
        	}
        });

        this.li.find('.success-icon').click(function () {
            removeRow(self.li);
            onFileRemove(self.file);
        });

        if (this.file) {
            this.bytesUploaded = 0;
            this.previousBytesUploaded = 0;
            this.timeElasped = 0;
            this.previousTimeElasped = 0;

            this.bytesTotal = this.file.size;
            this.speed = 0;
            this.speedText = '';
            this.secondsRemaining = -1;
            this.secondsRemainingText = '';
        }

        jQuery.data(this.li[0], 'filerow', this);
    }

    FileRow.prototype = {
        setProgress: function (val) {
            this.progress = val;
            this.li.find(".bg").width(val + '%');
        },
        setError: function (val) {
            this.error = val;
            if (val) {
                this.li.find('.error-icon').attr('title', val);
            }
        },
        setInfo: function (val) {
            this.info = val;
            if (val) {
                this.li.find(".info").html(val);
            }
        },
        toggleStatus: function (from, to) {
            if (from) {
                this.li.removeClass(from)
            }
            if (to) {
                this.li.addClass(to);
            }
        },
        start: function () {
            this.toggleStatus(false, 'status-pending');
            if (this.file) {
                var self = this;
                this.timer = setInterval(function () {
                    updateSpeed(self);
                }, SPEED_INTERVAL);
            }
        },
        setUrl: function (url) {
            if (url) {
                this.li.find('.filename').html('<a href="' + url + '">' + this.fileinfo + '</a>');
            }
        },
        stop: function () {
            this.setInfo('');
            this.setProgress(100);
            if (this.file) {
                clearInterval(this.timer);
                bytesRemaining -= (this.bytesTotal - this.previousBytesUploaded);
            }
        }
    };

    var updateSpeed = function (fr) {
        var cb = fr.bytesUploaded;
        var previousSpeed = 0;
        bytesRemaining -= (fr.bytesUploaded - fr.previousBytesUploaded);
        fr.timeElasped += SPEED_INTERVAL;
        if (fr.previousBytesUploaded) {
            previousSpeed = fr.previousBytesUploaded * 1000.0 / fr.previousTimeElasped;
        }
        var speed = 0;
        if (fr.bytesUploaded) {
            speed = fr.bytesUploaded * 1000.0 / fr.timeElasped;
        }
        fr.previousTimeElasped = fr.timeElasped;
        fr.speed = SPEED_SMOOTHING_FACTOR * previousSpeed + (1 - SPEED_SMOOTHING_FACTOR) * speed;
        fr.previousBytesUploaded = cb;

        var bytesRem = fr.bytesTotal - fr.previousBytesUploaded;
        fr.secondsRemaining = bytesRem / fr.speed;
        fr.secondsRemainingText = timeString(fr.secondsRemaining);

        // update speed info
        fr.speedText = fr.speed.toString() + ' bytes/s';
        if (fr.speed > 1024 * 1024) {
            fr.speedText = (Math.round(fr.speed / (1024 * 1024))).toString() + ' MB/s';
        } else if (fr.speed > 1024) {
            fr.speedText = (Math.round(fr.speed / 1024)).toString() + ' KB/s';
        }
        if (fr.speed > 0 && fr.secondsRemainingText) {
            fr.setInfo(fr.secondsRemainingText);
        }

        var globalSecondsRemaining = bytesRemaining / fr.speed;
        globalSecondsRemainingText = timeString(globalSecondsRemaining);
        globalSpeedText = fr.speedText;

        if (fr.speed > 0 && fr.speedText && globalSecondsRemainingText) {
            globalInfo.html("<small><i class='icon-time'></i> " + globalSpeedText + ", " + globalSecondsRemainingText + "</small>");
        }

        notifyParent();
    };

    var errToStr = function (errors) {
        var r = '';
        if (errors.length == 1) {
            r = errors[0];
        } else {
            for (var i = 0, len = errors.length; i < len; i++) {
                r += '-' + errors[i] + '\r\n';
            }
        }
        return r;
    }

    var formatFileSize = function (bytes) {
        if (typeof bytes !== 'number') {
            return '';
        }
        if (bytes >= 1000000000) {
            return (bytes / 1000000000).toFixed(2) + ' gb';
        }
        if (bytes >= 1000000) {
            return (bytes / 1000000).toFixed(2) + ' mb';
        }
        return (bytes / 1000).toFixed(2) + ' kb';
    }

    var preload = function (file, path) {
    	showStatusZone();
        var name = file.name + ' - ' + formatFileSize(file.size);
        var folderinfo = getFolderInfo(file, path);
        var fr = new FileRow(name, folderinfo, file);
        fr.setUrl(getFileUrl(file));
        fr.toggleStatus('status-pending', 'status-success');
        fr.stop();
        $.data(file, fr);
    }

    var preloadAll = function (files) {
        for (var i = 0; i < files.length; i++) {
        	preload(files[i]);
        }
    }

    var upload = function (file, path) {
    	showStatusZone();
        file.postParams = getParams(file, path);
        var name = file.name + ' - ' + formatFileSize(file.size);
        var folderinfo = getFolderInfo(file, path);
        var fr = new FileRow(name, folderinfo, file);
        $.data(file, fr);
        totalBytes += file.size;
        bytesRemaining += file.size;
        fileQueue.push(file);
        filesRemaining++;
        if (!fileQueue.running) {
        	processNextUpload();
        }
    }

    var uploadAll = function (files) {
        for (var i = 0; i < files.length; i++) {
        	upload(files[i]);
        }
    }

    var processNextUpload = function () {
        fileQueue.running = true;
    	if (!fileQueue.length) { // If no items left then stop queue
            globalInfo.html('');
            notifyParent();
            fileQueue.running = false;
            return;
        }
        var file = fileQueue[0]; // Take the first file from queue
        var formData = new FormData();
        formData.append('file', file);
        var p = file.postParams, key;
        for (key in p) {
            formData.append(key, p[key]);
        }

        // now post a new XHR request
        var xhr = new XMLHttpRequest();
        xhr.open('POST', window.parent.uploader.url);
        xhr.onload = function () {
            var fr = this.upload.filerow;
            fr.stop();
            if (this.status === 200) {
                var r = $.parseJSON(this.response);
                if (r.errors.length) {
                    fr.toggleStatus('status-pending', 'status-error');
                    fr.setError(errToStr(r.errors));
                } else {
                    fr.toggleStatus('status-pending', 'status-success');
                    fr.setUrl(getFileUrl(r));
                    onUploadSuccess(fr.file, r);
                }
            } else {
                fr.toggleStatus('status-pending', 'status-error');
                fr.setError('Unexpected error occured.');
            }
            // Remove processed file from queue
            fileQueue.shift();
            processNextUpload()
        };

        var fr = $.data(file);
        xhr.upload.filerow = fr;
        xhr.upload.onprogress = function (event) {
            if (event.lengthComputable) {
                var complete = (event.loaded / event.total * 100 | 0);
                this.filerow.bytesUploaded = event.loaded;
                var fr = $.data(this.filerow.file); 
                fr.setProgress(complete);
                if (complete >= 100) {
                	fr.setInfo("processing");
                }
            }
        };

        fr.start();
        xhr.send(formData);
    }

    var uploadFolder = function (path) {
        var formData = new FormData();
        var p = getParams(false, path), key;
        for (key in p) {
            formData.append(key, p[key]);
        }
        
        if (!p['path']) {
            formData.append('path', path);
        }

        // now post a new XHR request
        var xhr = new XMLHttpRequest();
        xhr.open('POST', window.parent.uploader.url);
        xhr.onload = function () {
            var fr = this.upload.filerow;
            if (this.status === 200) {
                var r = $.parseJSON(this.response);
                if (r.errors.length) {
                    alert(errToStr(r.errors));
                }
            }
        };

        xhr.send(formData);
    }

    var traverseFileTree = function (item, path) {
        path = path || "";
        if (item.isFile) {
            // Get file
            item.file(function (file) {
                upload(file, path);
            });
        } else if (item.isDirectory) {
            // Get folder contents
            var dirReader = item.createReader();
            dirReader.readEntries(function (entries) {
                if (entries.length) {
                    for (var i = 0; i < entries.length; i++) {
                        traverseFileTree(entries[i], path + item.name + "/");
                    }
                } else {
                    uploadFolder(path + item.name + "/");
                }
            });
        }
    }
    
    var hideStatusZone = function () {
    	statusZone.hide();
    }

    var showStatusZone = function () {
    	statusZone.show();
    }

    var removeRow = function(li) {
        var fr = jQuery.data(li[0], 'filerow');
        if (fr.file) {
            $.removeData(fr.file);
        }
        li.remove();
        if (!statusZone.children().length) {
            hideStatusZone();
        }
    }

    var adjustHeight = function () {
    	$('#statusZoneContainer').css('height', ($(window).height() - 122) + 'px');
    }

    $(function () {
        $("#headerLabel").text(getHeaderText());
        adjustHeight();
        statusZone = $("#statusZone");
        hideStatusZone(); 
        globalInfo = $("#globalInfo");
        globalSecondsRemainingText = "";
        bytesRemaining = 0;
        totalBytes = 0;
        filesRemaining = 0;

        $(window).resize(adjustHeight);

        if (isHideClearButton()) {
            $('.clearBtn').hide();
        } else {
            $('.clearBtn').click(function () {
                statusZone.children('li.status-success, li.status-error').each(function () {
                    var li = $(this);
                    removeRow(li);
                });
            });
        }

        processPreloadFiles();

        var doneButtonCallback = getDoneButtonCallback();
        if (doneButtonCallback) {
            $('.doneBtn').click(doneButtonCallback);
        }

        if (isCanvasSupported()) {
            $('#html5-input-file').change(function () {
                var files = $(this).prop('files');
                uploadAll(files);
            });

            var ondragover = function () {
                return false;
            };
            var ondrop = function (event) {
                event.preventDefault();

                var items = event.dataTransfer.items;
                if (items) {
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];

                        if (item.webkitGetAsEntry) { //WebKit implementation of HTML5 API.
                            item = item.webkitGetAsEntry();
                        } else if (item.getAsEntry) { //Standard HTML5 API
                            item = item.getAsEntry();
                        }

                        if (item) {
                            traverseFileTree(item);
                        }
                    }
                } else { // No dnd folder support
                    var files = event.dataTransfer.files;
                    uploadAll(files);
                }
            };

            var doc = document.documentElement;
            doc.ondragover = ondragover;
            doc.ondrop = ondrop;

            if (window.parent) {
                var parentDoc = window.parent.document.documentElement;
                parentDoc.ondragover = ondragover;
                parentDoc.ondrop = ondrop;
            }
        } else {
            html5DisabledCallback();
            $('#html5-uploader').hide();
            var form = $('#uploader');
            form.show();
            $('#input-file').change(function () {
            	showStatusZone();
                var path = $(this).val();
                if (path) {
                    var name = path.split('\\').pop();
                    var folderinfo = getFolderInfo();
                    var fr = new FileRow(name, folderinfo);
                    fr.start();
                    fr.setProgress(100);
                    form.prop("action", window.parent.uploader.url);
                    form.prop('target', 'upload_iframe');
                    var p = getParams(),
                        key;
                    for (key in p) {
                        $('<input>').attr({
                            type: 'hidden',
                            name: key,
                            value: p[key]
                        }).appendTo(form);
                    }
                    form.submit();
                }
            });

            $("#upload_iframe").load(function () {
                var doc = $(this).prop('contentDocument') || $(this).prop('contentWindow').document;
                var li = statusZone.children().last();
                var fr = jQuery.data(li[0], 'filerow');
                try {
	                var r = $.parseJSON(doc.body.innerHTML);
	                if (r.errors.length > 0) {
	                    fr.toggleStatus('status-pending', 'status-error');
	                    fr.setError(errToStr(r.errors));
	                } else {
	                    fr.toggleStatus('status-pending', 'status-success');
	                }
                } catch (err) {
                    fr.toggleStatus('status-pending', 'status-error');
                    fr.setError('Unexpected error occured.');
                }
            });
        }
    });
})(jQuery);