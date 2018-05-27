<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form" %>
<%@ taglib uri="http://www.springframework.org/tags" prefix="spring" %>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/jsp/header.jsp" %>
<body>
<div class="navbar navbar-inverse navbar-fixed-top">
	<div class="navbar-inner">
		<div class="container-fluid">
			<button type="button" class="btn btn-navbar" data-toggle="collapse"
				data-target=".nav-collapse">
				<span class="icon-bar"></span> <span class="icon-bar"></span> <span
					class="icon-bar"></span>
			</button>
			<a class="brand" href="#">Nilavo Technologies</a>
		</div>
	</div>
</div>
<div class="container-fluid">
	<div class="row-fluid offset3">
	  Welcome to task management for Nilavo Technologies. It features everything you need and nothing you don't.
	  <br/>
	  <br/>
	  <c:url var="openIDLoginUrl" value="/j_spring_openid_security_check" />
	  <form action="${openIDLoginUrl}" method="post">
	  	<input name="openid_identifier" type="hidden" value="https://www.google.com/accounts/o8/id"/>
	  	<input class="btn btn-primary" type="submit" type="submit" value="Google Sign In"/>
	  </form>
	</div>
<%@ include file="/WEB-INF/jsp/footer.jsp" %>