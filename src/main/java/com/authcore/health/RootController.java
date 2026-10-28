package com.authcore.health;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class RootController {

    @GetMapping("/")
    public String root() {
        return "redirect:/swagger-ui/index.html";
    }

    @GetMapping("/guide")
    public String guide() {
        return "redirect:/guide.html";
    }
}
