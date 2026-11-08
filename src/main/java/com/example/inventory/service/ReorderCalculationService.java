package com.example.inventory.service;

import com.example.inventory.model.Forecast;
import com.example.inventory.model.Product;
import com.example.inventory.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReorderCalculationService {

    private final ProductRepository productRepository;

    public ReorderCalculationService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public int calculate(Product product, List<Forecast> forecasts) {
        double avgDailyDemand = forecasts.stream()
                .mapToDouble(Forecast::getPredictedDemand)
                .average()
                .orElse(0);
        double safetyStock = 0.5 * avgDailyDemand;
        int reorderPoint = (int) Math.ceil(
                avgDailyDemand * product.getLeadTimeDays() + safetyStock);

        product.setReorderPoint(reorderPoint);
        productRepository.save(product);
        return reorderPoint;
    }

    public boolean needsReorder(Product product) {
        return product.getReorderPoint() > 0
                && product.getQuantity() <= product.getReorderPoint();
    }
}
