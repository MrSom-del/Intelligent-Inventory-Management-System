package com.example.inventory.controller;

import com.example.inventory.model.Product;
import com.example.inventory.repository.ProductRepository;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:3000")
public class DashboardController {

    private final ProductRepository productRepository;

    public DashboardController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        List<Product> products = productRepository.findAll();
        int totalProducts = products.size();
        long lowStock = products.stream().filter(p -> p.getQuantity() <= 5).count();
        long outOfStock = products.stream().filter(p -> p.getQuantity() == 0).count();
        double totalValue = products.stream()
                .mapToDouble(p -> p.getPrice() * p.getQuantity())
                .sum();

        Map<String, Object> data = new HashMap<>();
        data.put("totalProducts", totalProducts);
        data.put("lowStock", lowStock);
        data.put("outOfStock", outOfStock);
        data.put("totalValue", totalValue);

        return data;
    }
}
