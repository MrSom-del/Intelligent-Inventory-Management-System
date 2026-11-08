package com.example.inventory.repository;

import com.example.inventory.model.Forecast;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ForecastRepository extends JpaRepository<Forecast, Long> {
    List<Forecast> findByProductIdOrderByForecastDateAsc(Long productId);

    void deleteByProductId(Long productId);
}
