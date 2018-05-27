<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form" %>
<%@ page import="com.cyanice.opt.util.Utils" %>
<%@ page session="false"%>
<!doctype html>
<!--[if lt IE 7 ]> <html lang="en" class="ie6"> <![endif]-->
<!--[if IE 7 ]>    <html lang="en" class="ie7"> <![endif]-->
<!--[if IE 8 ]>    <html lang="en" class="ie8"> <![endif]-->
<!--[if IE 9 ]>    <html lang="en" class="ie9"> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!-->
<html lang="en">
<!--<![endif]-->
<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

<title>Nilavo Technologies</title>
<meta name="description" content="">
<meta name="author" content="">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<script src="lib/jquery/jquery-1.9.1.js"></script>
<script src="lib/jquery/jquery.tokeninput.js"></script>
<script src="lib/angular/angular.js"></script>
<script src="lib/angular/angular-sanitize-1.0.1.js"></script>	
<script src="lib/angular/ng-infinite-scroll.js"></script>
<script> var version= '<%= Utils.APP_VERSION %>';</script>
<script src="<%= Utils.includeWithVersion("js/app.js") %>"></script>
<script src="<%= Utils.includeWithVersion("js/services.js") %>"></script>
<script src="<%= Utils.includeWithVersion("js/controllers.js") %>"></script>
<script src="<%= Utils.includeWithVersion("js/filters.js") %>"></script>
<script src="<%= Utils.includeWithVersion("js/directives.js") %>"></script>
<script src="lib/moment.min.js"></script>
<script src="lib/underscore.js"></script>
<script src="lib/bootstrap/ui-bootstrap-tpls-0.2.0.min.js"></script>
<script src="lib/bootstrap/bootstrap-collapse.js"></script>
<script src="lib/bootstrap/bootstrap-modal.js"></script>
<script src="lib/bootstrap/bootstrap-datepicker.js"></script>
<script src="lib/angular/ng-context-menu.js"></script>
<script src="lib/angular/ng-token-input.js"></script>
<script src="lib/angular/ng-ajax-spinner.js"></script>
<script src="lib/angular/ng-bootstrap-datepicker.js"></script> 
<link rel="shortcut icon" href="img/favicon.ico">
<link rel="apple-touch-icon" href="img/apple-touch-icon.png">
<link href="css/bootstrap.min.css" rel="stylesheet" media="screen" />
<link href="css/bootstrap-responsive.min.css" rel="stylesheet"/>
<link href="css/datepicker.css" rel="stylesheet"/>
<link rel="stylesheet" href="css/table-fixed-header.css">
<link rel="stylesheet" href="css/token-input.css">
<link rel="stylesheet" href="css/token-input-facebook.css">
<link rel="stylesheet" href="<%= Utils.includeWithVersion("css/docs.css") %>"/>
<link rel="stylesheet" href="<%= Utils.includeWithVersion("css/app.css") %>"/>
<!-- HTML5 shim, for IE6-8 support of HTML5 elements -->
<!--[if lt IE 9]>
    <script src="lib/html5shiv.js"></script>
  <![endif]-->

<!--[if lt IE 9]>
  <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
  <![endif]-->
  
<!--[if lt IE 8]>
     <script src="libs/json3.min.js"></script>
   <![endif]--> 
</head>


