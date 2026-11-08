package com.example.inventory.client;

import com.example.inventory.dto.ForecastPoint;
import com.example.inventory.exception.MlServiceUnavailableException;
import com.example.inventory.model.SalesHistory;
import com.example.inventory.repository.SalesHistoryRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;

import java.time.Duration;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;

@Component
public class ForecastClient {

    private static final Logger logger = LoggerFactory.getLogger(ForecastClient.class);

    private final WebClient webClient;
    private final SalesHistoryRepository salesHistoryRepository;
    private final ObjectMapper objectMapper;

    public ForecastClient(WebClient.Builder webClientBuilder,
                          @Value("${ml.service.base-url}") String baseUrl,
                          SalesHistoryRepository salesHistoryRepository,
                          ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
        this.salesHistoryRepository = salesHistoryRepository;
        this.objectMapper = objectMapper;
    }

    public List<ForecastPoint> callPredict(Long productId) {
        List<SalesHistory> history = salesHistoryRepository
                .findByProductIdOrderBySaleDateAsc(productId);
        if (history.isEmpty()) {
            throw new IllegalArgumentException("No sales history for product " + productId);
        }

        Map<String, Object> request = new HashMap<>();
        request.put("product_id", productId);
        request.put("sales_history", history.stream()
                .map(this::toHistoryPoint)
                .toList());

        try {
            String response = webClient.post()
                    .uri("/predict")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block(Duration.ofSeconds(10));

            Map<String, Object> responseBody = objectMapper.readValue(
                    response, new TypeReference<>() {});
            List<Map<String, Object>> forecast =
                    (List<Map<String, Object>>) responseBody.get("forecast");

            return forecast.stream()
                    .map(point -> new ForecastPoint(
                            LocalDate.parse((String) point.get("date")),
                            ((Number) point.get("predicted_quantity")).doubleValue()))
                    .toList();
        } catch (WebClientRequestException e) {
            logger.error("Forecasting service is not reachable for product {}", productId, e);
            throw new MlServiceUnavailableException("Forecasting service is not reachable");
        } catch (RuntimeException e) {
            if (hasTimeoutCause(e)) {
                logger.error("Forecasting service timed out for product {}", productId, e);
                throw new MlServiceUnavailableException("Forecasting service is not reachable");
            }
            throw e;
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Invalid response from forecasting service", e);
        }
    }

    private Map<String, Object> toHistoryPoint(SalesHistory history) {
        Map<String, Object> point = new HashMap<>();
        point.put("date", history.getSaleDate().toString());
        point.put("quantity_sold", history.getQuantitySold());
        return point;
    }

    private boolean hasTimeoutCause(Throwable error) {
        Throwable cause = error;
        while (cause != null) {
            if (cause instanceof TimeoutException) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }
}
