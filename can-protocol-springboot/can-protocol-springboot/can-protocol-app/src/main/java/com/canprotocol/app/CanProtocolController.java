package com.canprotocol.app;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;

@Controller
public class CanProtocolController {

    private static final String UPLOAD_DIR = "uploads/";
    private static final String PPT_FILENAME = "can-protocol-presentation.pptx";

    @GetMapping("/")
    public String home(Model model) {
        Path pptPath = Paths.get(UPLOAD_DIR + PPT_FILENAME);
        model.addAttribute("pptAvailable", Files.exists(pptPath));
        return "index";
    }

    @PostMapping("/upload-ppt")
    public String uploadPpt(@RequestParam("file") MultipartFile file,
                            RedirectAttributes redirectAttributes) {
        if (file.isEmpty()) {
            redirectAttributes.addFlashAttribute("uploadMsg", "Please select a file.");
            redirectAttributes.addFlashAttribute("msgType", "error");
            return "redirect:/";
        }
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
            Path filePath = uploadPath.resolve(PPT_FILENAME);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            redirectAttributes.addFlashAttribute("uploadMsg", "Presentation uploaded successfully!");
            redirectAttributes.addFlashAttribute("msgType", "success");
        } catch (IOException e) {
            redirectAttributes.addFlashAttribute("uploadMsg", "Upload failed: " + e.getMessage());
            redirectAttributes.addFlashAttribute("msgType", "error");
        }
        return "redirect:/#presentation";
    }

    @GetMapping("/presentation")
    public ResponseEntity<Resource> viewPresentation() throws MalformedURLException {
        Path filePath = Paths.get(UPLOAD_DIR + PPT_FILENAME);
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.presentationml.presentation"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + PPT_FILENAME + "\"")
                .body(resource);
    }
}
