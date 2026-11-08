package com.example.inventory.controller;

import com.example.inventory.client.ForecastClient;
import com.example.inventory.dto.ForecastPoint;
import com.example.inventory.model.Forecast;
import com.example.inventory.model.Product;
import com.example.inventory.repository.ForecastRepository;
import com.example.inventory.repository.ProductRepository;
import com.example.inventory.service.SalesAggregationService;
import com.example.inventory.service.ReorderCalculationService;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/forecast")
@CrossOrigin(origins = "http://localhost:3000")
public class ForecastController {

    private final SalesAggregationService salesAggregationService;
    private final ProductRepository productRepository;
    private final ForecastClient forecastClient;
    private final ForecastRepository forecastRepository;
    private final ReorderCalculationService reorderCalculationService;

    public ForecastController(SalesAggregationService salesAggregationService,
                              ProductRepository productRepository,
                              ForecastClient forecastClient,
                              ForecastRepository forecastRepository,
                              ReorderCalculationService reorderCalculationService) {
        this.salesAggregationService = salesAggregationService;
        this.productRepository = productRepository;
        this.forecastClient = forecastClient;
        this.forecastRepository = forecastRepository;
        this.reorderCalculationService = reorderCalculationService;
    }

    @PostMapping("/aggregate")
    public int aggregate() {
        return salesAggregationService.aggregate();
    }

    @PostMapping("/{productId}/run")
    @Transactional
    public Map<String, Object> run(@PathVariable Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found: " + productId));
        List<ForecastPoint> points = forecastClient.callPredict(productId);

        forecastRepository.deleteByProductId(productId);
        List<Forecast> savedForecasts = new ArrayList<>();
        for (ForecastPoint point : points) {
            Forecast forecast = new Forecast();
            forecast.setProductId(productId);
            forecast.setForecastDate(point.date());
            forecast.setPredictedDemand(point.predictedQuantity());
            forecast.setGeneratedAt(LocalDateTime.now());
            savedForecasts.add(forecastRepository.save(forecast));
        }

        int reorderPoint = reorderCalculationService.calculate(product, savedForecasts);
        return forecastResponse(product, savedForecasts, reorderPoint);
    }

    @GetMapping("/{productId}")
    public Map<String, Object> get(@PathVariable Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found: " + productId));
        List<Forecast> forecasts = forecastRepository
                .findByProductIdOrderByForecastDateAsc(productId);
        return forecastResponse(product, forecasts, product.getReorderPoint());
    }

    @GetMapping("/alerts")
    public List<Map<String, Object>> alerts() {
        return productRepository.findAll().stream()
                .filter(reorderCalculationService::needsReorder)
                .map(product -> {
                    Map<String, Object> alert = new LinkedHashMap<>();
                    alert.put("id", product.getId());
                    alert.put("name", product.getName());
                    alert.put("quantity", product.getQuantity());
                    alert.put("reorderPoint", product.getReorderPoint());
                    return alert;
                })
                .toList();
    }

    private Map<String, Object> forecastResponse(Product product,
                                                  List<Forecast> forecasts,
                                                  int reorderPoint) {
        List<Map<String, Object>> values = forecasts.stream()
                .map(forecast -> {
                    Map<String, Object> value = new LinkedHashMap<>();
                    value.put("date", forecast.getForecastDate());
                    value.put("predictedQuantity", forecast.getPredictedDemand());
                    return value;
                })
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("productId", product.getId());
        response.put("forecast", values);
        response.put("reorderPoint", reorderPoint);
        response.put("quantity", product.getQuantity());
        response.put("needsReorder", reorderCalculationService.needsReorder(product));
        return response;
    }
}
