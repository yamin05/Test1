package com.Yamin.Test1.Configurations;

import com.Yamin.Test1.Configurations.Filter.CORSFilter;
import org.springframework.web.servlet.support.AbstractAnnotationConfigDispatcherServletInitializer;

import javax.servlet.Filter;

public class SpringInitialiser extends AbstractAnnotationConfigDispatcherServletInitializer {

        @Override
        protected Class<?>[] getRootConfigClasses() {
            return new Class[] { MainConfiguration.class };
        }

        @Override
        protected Class<?>[] getServletConfigClasses() {
            return null;
        }

        @Override
        protected String[] getServletMappings() {
            return new String[] { "/" };
        }

        @Override
        protected Filter[] getServletFilters() {
            Filter [] singleton = { new CORSFilter() };
            return singleton;
        }
}
