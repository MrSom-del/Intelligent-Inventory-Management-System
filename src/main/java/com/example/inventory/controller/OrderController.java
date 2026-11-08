package com.example.inventory.controller;

import com.example.inventory.model.Order;
import com.example.inventory.model.OrderItem;
import com.example.inventory.model.Product;
import com.example.inventory.repository.OrderRepository;
import com.example.inventory.repository.ProductRepository;
import com.example.inventory.dto.CreateOrderRequest;
import com.example.inventory.exception.InsufficientStockException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;
import com.example.inventory.model.OrderStatus;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:3000")
public class OrderController {

    private final OrderRepository orderRepo;
    private final ProductRepository productRepo;
    private final TransactionTemplate transactionTemplate;

    public OrderController(OrderRepository orderRepo, ProductRepository productRepo,
                           PlatformTransactionManager transactionManager) {
        this.orderRepo = orderRepo;
        this.productRepo = productRepo;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @GetMapping
    public Page<Order> list(Pageable pageable) {
        return orderRepo.findAll(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> get(@PathVariable Long id) {
        return orderRepo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    // Create order: validate stock and deduct atomically
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateOrderRequest req) {
        if (req == null || req.items == null || req.items.isEmpty()) {
            return ResponseEntity.badRequest().body("Empty order");
        }

        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                return transactionTemplate.execute(status -> createOrderAttempt(req));
            } catch (ObjectOptimisticLockingFailureException exception) {
                if (attempt == 3) {
                    return ResponseEntity.status(409).body("High demand, please try again");
                }
            }
        }

        return ResponseEntity.status(409).body("High demand, please try again");
    }

    private ResponseEntity<?> createOrderAttempt(CreateOrderRequest req) {
        // collect product IDs
        List<Long> pids = req.items.stream().map(i -> i.productId).collect(Collectors.toList());
        List<Product> products = productRepo.findAllById(pids);

        // map id->product
        Map<Long, Product> prodMap = new HashMap<>();
        for (Product p : products) prodMap.put(p.getId(), p);

        // Validate existence and stock
        for (CreateOrderRequest.Item it : req.items) {
            Product p = prodMap.get(it.productId);
            if (p == null) return ResponseEntity.badRequest().body("Product not found: " + it.productId);
            if (p.getQuantity() <= 0) p.setQuantity(0);
            if (it.quantity == null || it.quantity <= 0) return ResponseEntity.badRequest().body("Invalid qty for product " + p.getName());
            if (p.getQuantity() < it.quantity) {
                throw new InsufficientStockException("Insufficient stock for product " + p.getName());
            }
        }

        // Build order and deduct stock
        Order order = new Order();
        order.setCustomerName(req.customerName == null ? "Walk-in" : req.customerName);
        List<OrderItem> items = new ArrayList<>();
        double total = 0.0;

        // Build order items and deduct stock in-memory; persist products in bulk for fewer DB calls
        List<Product> updatedProducts = new ArrayList<>();
        for (CreateOrderRequest.Item it : req.items) {
            Product p = prodMap.get(it.productId);
            OrderItem oi = new OrderItem();
            oi.setProduct(p);
            oi.setQuantity(it.quantity);
            oi.setPrice(p.getPrice());
            oi.setOrder(order);
            items.add(oi);

            total += p.getPrice() * it.quantity;

            // deduct stock (in-memory)
            p.setQuantity(p.getQuantity() - it.quantity);
            updatedProducts.add(p);
        }
        // save all modified products in one call
        productRepo.saveAll(updatedProducts);

        order.setItems(items);
        order.setTotal(total);
        Order saved = orderRepo.save(order);

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    @Transactional
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {

        return orderRepo.findById(id).map(order -> {

            // If cancelling, restore stock
            if (status == OrderStatus.CANCELLED &&
                    order.getStatus() != OrderStatus.CANCELLED) {

                List<Product> toRestore = new ArrayList<>();
                for (OrderItem item : order.getItems()) {
                    Product p = item.getProduct();
                    p.setQuantity(p.getQuantity() + item.getQuantity());
                    toRestore.add(p);
                }
                productRepo.saveAll(toRestore);
            }

            order.setStatus(status);
            orderRepo.save(order);

            return ResponseEntity.ok(order);

        }).orElse(ResponseEntity.notFound().build());
    }


    // Delete order: restore stock (simple approach) and delete
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return orderRepo.findById(id).map(order -> {
            // restore product qty
            if (order.getItems() != null) {
                List<Product> restored = new ArrayList<>();
                for (OrderItem it : order.getItems()) {
                    Product p = it.getProduct();
                    if (p != null) {
                        p.setQuantity(p.getQuantity() + it.getQuantity());
                        restored.add(p);
                    }
                }
                if (!restored.isEmpty()) productRepo.saveAll(restored);
            }
            orderRepo.delete(order);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
