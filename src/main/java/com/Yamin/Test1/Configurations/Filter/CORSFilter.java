package com.Yamin.Test1.Configurations.Filter;

import javax.servlet.*;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.InetAddress;

public class CORSFilter implements Filter {

    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
        System.out.println("Filtering on...........................................................");
        InetAddress IP=InetAddress.getLocalHost();
        System.out.println("IP of my system is := " + IP.getHostAddress());
        System.out.println("Request from remote:= " + req.getRemoteAddr() + " - port - " + req.getRemotePort());
        HttpServletResponse response = (HttpServletResponse) res;
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, OPTIONS, DELETE");
        response.setHeader("Access-Control-Max-Age", "3600");
        response.setHeader("Access-Control-Allow-Headers", "X-requested-with, Content-Type");
        chain.doFilter(req, res);
    }

    public void init(FilterConfig filterConfig) {}

    public void destroy() {}
}
