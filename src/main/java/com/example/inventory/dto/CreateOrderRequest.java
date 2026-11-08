package com.example.inventory.dto;

import java.util.List;

public class CreateOrderRequest {
    public String customerName;
    public List<Item> items;

    public static class Item {
        public Long productId;
        public Integer quantity;
    }
}
