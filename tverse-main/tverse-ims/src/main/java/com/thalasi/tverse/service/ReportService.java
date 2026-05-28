package com.thalasi.tverse.service;

import com.thalasi.tverse.model.productVariant;
import com.thalasi.tverse.repository.ProductVariantRepo;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@Service
public class ReportService {

    @Autowired
    private ProductVariantRepo productVariantRepo;

    public void generateCatalogListingTemplate(PrintWriter writer,String categoryFilter) throws IOException{
        List<productVariant> variants= productVariantRepo.findAll();

        String[] headers={
                "Variant ID", "SKU", "Parent Product Name", "Category",
                "Size", "Color", "Regular Price", "Sale Price",
                "Procurement Cost", "Stock On Hand", "Warehouse Location"
        };

        try(CSVPrinter csvPrinter=new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader(headers).build())){

            for(productVariant variant:variants){
                String parentName = variant.getProduct() != null ? variant.getProduct().getName() : "N/A";
                String categoryName = (variant.getProduct() != null && variant.getProduct().getCategory() != null)
                        ? variant.getProduct().getCategory().getName() : "Uncategorized";

                // Filter logic (if user selected a specific category in React)
                if (!categoryFilter.equals("ALL") && !categoryName.equalsIgnoreCase(categoryFilter)) {
                    continue;
                }

                // 4. Print the row
                csvPrinter.printRecord(
                        variant.getId(),
                        variant.getSku(),
                        parentName,
                        categoryName,
                        variant.getSize() != null ? variant.getSize() : "",
                        variant.getColor() != null ? variant.getColor() : "",
                        variant.getRegularPrice(),
                        variant.getSalePrice(),
                        variant.getProcurementCost(),
                        variant.getStockOnHand(),
                        variant.getWarehouseLocation() != null ? variant.getWarehouseLocation() : ""
                );
            }
        }

    }
}
