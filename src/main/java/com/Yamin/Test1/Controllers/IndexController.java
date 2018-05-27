package com.Yamin.Test1.Controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/")
public class IndexController {
    @RequestMapping(value = {"", "/", "home"}, method = RequestMethod.GET)
    public String getHomePage() {
        return "home";
    }

    @RequestMapping(value = {"/login", "/signin"}, method = RequestMethod.GET)
    public String getLoginPage() {
        return "login";
    }

    @RequestMapping(value = "/index", method = RequestMethod.GET)
    public String getIndexPage() {
        return "index";
    }
}
