package com.example.inventory.dto;

import java.time.LocalDate;

public record ForecastPoint(LocalDate date, double predictedQuantity) {
}
