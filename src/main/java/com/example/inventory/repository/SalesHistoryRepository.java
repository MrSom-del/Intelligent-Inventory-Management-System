package com.example.inventory.repository;

import com.example.inventory.model.SalesHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SalesHistoryRepository extends JpaRepository<SalesHistory, Long> {
    List<SalesHistory> findByProductIdOrderBySaleDateAsc(Long productId);

    Optional<SalesHistory> findByProductIdAndSaleDate(Long productId, LocalDate saleDate);
}
