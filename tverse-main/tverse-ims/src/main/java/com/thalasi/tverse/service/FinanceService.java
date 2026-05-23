package com.thalasi.tverse.service;

import com.thalasi.tverse.model.SalesOrder;
import com.thalasi.tverse.repository.SalesOrderRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class FinanceService {

    @Autowired
    private SalesOrderRepo salesOrderRepo;

    public String processSettlementCsv(MultipartFile file, String channel) {
        int updatedCount = 0;
        List<SalesOrder> ordersToSave = new ArrayList<>();

        String orderIdHeader = "";
        String payoutHeader = "";

        switch (channel) {
            case "FLIPKART":
                orderIdHeader = "Order ID";
                payoutHeader = "Bank Settlement Value";
                break;
            case "MEESHO":
                orderIdHeader = "Sub Order No";
                payoutHeader = "Final Settlement Amount";
                break;
            case "MYNTRA":
                orderIdHeader = "order_number";
                payoutHeader = "total_settlement_fw";
                break;
            default:
                throw new RuntimeException("Unsupported channel selected: " + channel);
        }

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            int orderIdIndex = -1;
            int payoutIndex = -1;
            boolean headersFound = false;

            while ((line = br.readLine()) != null) {
                String[] columns = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");

                if (!headersFound) {
                    for (int i = 0; i < columns.length; i++) {
                        String col = columns[i].replace("\"", "").trim();
                        if (col.contains(orderIdHeader)) orderIdIndex = i;
                        if (col.contains(payoutHeader)) payoutIndex = i;
                    }
                    if (orderIdIndex != -1 && payoutIndex != -1) {
                        headersFound = true;
                    }
                    continue;
                }

                if (columns.length > Math.max(orderIdIndex, payoutIndex)) {
                    String orderId = columns[orderIdIndex].replace("\"", "").trim();
                    String payoutStr = columns[payoutIndex].replace("\"", "").trim().replace(",", "");

                    if (orderId.isEmpty() || payoutStr.isEmpty()) continue;

                    try {
                        BigDecimal totalPayout = new BigDecimal(payoutStr);

                        // --- THE FIX: Handle Lists Instead of Optional ---
                        List<SalesOrder> matchingOrders = salesOrderRepo.findByOrderId(orderId);

                        if (matchingOrders != null && !matchingOrders.isEmpty()) {
                            int itemCount = matchingOrders.size();

                            // Divide the total payout evenly across the items in the order
                            BigDecimal splitPayout = totalPayout.divide(new BigDecimal(itemCount), 2, java.math.RoundingMode.HALF_UP);

                            for (SalesOrder order : matchingOrders) {
                                order.setActualPayout(splitPayout);

                                // True Profit = Split Payout - Item Cost
                                BigDecimal cost = order.getItemCost() != null ? order.getItemCost() : BigDecimal.ZERO;
                                BigDecimal profit = splitPayout.subtract(cost);

                                order.setTrueProfit(profit);
                                ordersToSave.add(order);
                                updatedCount++;
                            }
                        }
                    } catch (NumberFormatException e) {
                        continue;
                    }
                }
            }

            salesOrderRepo.saveAll(ordersToSave);
            return "Successfully processed " + channel + " settlement. Updated " + updatedCount + " order items.";

        } catch (Exception e) {
            throw new RuntimeException("Failed to process " + channel + " CSV file: " + e.getMessage());
        }
    }
}