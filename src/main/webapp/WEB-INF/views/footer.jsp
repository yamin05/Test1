<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form" %>
<%@ page import="com.cyanice.opt.util.Utils" %>
<%@ page session="false"%>
		<hr>
		<footer>
			<p class="pull-left">&copy; 2013 Nilavo Technologies. All Rights Reserved.</p>
			<p class="pull-right">Version: <%= Utils.APP_VERSION %></p>
		</footer>
	</div>
	<!--/.fluid-container-->
	</body>
</html>
