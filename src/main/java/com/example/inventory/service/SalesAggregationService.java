package com.example.inventory.service;

import com.example.inventory.model.Order;
import com.example.inventory.model.OrderItem;
import com.example.inventory.model.OrderStatus;
import com.example.inventory.model.SalesHistory;
import com.example.inventory.repository.OrderRepository;
import com.example.inventory.repository.SalesHistoryRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Service
public class SalesAggregationService {

    private final OrderRepository orderRepository;
    private final SalesHistoryRepository salesHistoryRepository;

    public SalesAggregationService(OrderRepository orderRepository,
                                   SalesHistoryRepository salesHistoryRepository) {
        this.orderRepository = orderRepository;
        this.salesHistoryRepository = salesHistoryRepository;
    }

    @Transactional
    public int aggregate() {
        Map<SalesKey, Integer> quantities = new HashMap<>();

        for (Order order : orderRepository.findAll()) {
            if (order.getStatus() == OrderStatus.CANCELLED || order.getCreatedAt() == null
                    || order.getItems() == null) {
                continue;
            }

            LocalDate saleDate = order.getCreatedAt().toLocalDate();
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() == null || item.getProduct().getId() == null) {
                    continue;
                }

                SalesKey key = new SalesKey(item.getProduct().getId(), saleDate);
                quantities.merge(key, item.getQuantity(), Integer::sum);
            }
        }

        for (Map.Entry<SalesKey, Integer> entry : quantities.entrySet()) {
            SalesKey key = entry.getKey();
            SalesHistory history = salesHistoryRepository
                    .findByProductIdAndSaleDate(key.productId(), key.saleDate())
                    .orElseGet(SalesHistory::new);
            history.setProductId(key.productId());
            history.setSaleDate(key.saleDate());
            history.setQuantitySold(entry.getValue());
            salesHistoryRepository.save(history);
        }

        return quantities.size();
    }

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void aggregateDaily() {
        aggregate();
    }

    private record SalesKey(Long productId, LocalDate saleDate) {
    }
}
