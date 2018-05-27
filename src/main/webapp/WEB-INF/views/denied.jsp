<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form" %>
<%@ page session="false"%>
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
		You do not have permission to access this page. Contact your administrator and try again.
		<br/>
		<br/>
		<a class="btn btn-primary" href="<c:url value="j_spring_security_logout" />" > Logout</a>  
	</div>
<%@ include file="/WEB-INF/jsp/footer.jsp" %>