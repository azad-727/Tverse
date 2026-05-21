package com.thalasi.tverse.service;

import com.thalasi.tverse.model.ProductBundle;
import com.thalasi.tverse.model.SkuMapping;
import com.thalasi.tverse.repository.ProductBundleRepo;
import com.thalasi.tverse.repository.SkuMappingRepo;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.swing.text.DateFormatter;
import java.io.IOException;
import java.util.*;

@Service
public class MappingService {

    @Autowired
    private SkuMappingRepo mappingRepo;
    @Autowired
    private ProductBundleRepo bundleRepo;

    public Map<String,Integer> resolveSku(String incomingSku, int orderQty){
        Map<String,Integer> result=new HashMap<>();
        String resolveSku = mappingRepo.findByChannelSku(incomingSku)
                .map(SkuMapping::getMasterSku)
                .orElse(incomingSku);

        List<ProductBundle> components = bundleRepo.findByComboSku(resolveSku);

        if(!components.isEmpty()){
            for(ProductBundle component:components){
                result.put(component.getComponentSku(),component.getQty()*orderQty);
            }
        }
        else{
            result.put(resolveSku,orderQty);
        }
        return result;
    }
    public void  processBulkMapping(MultipartFile file,String type) throws IOException {
        DataFormatter formatter=new DataFormatter();
        Set<String> existingAlias=new HashSet<>();
        //Getting all Existing Alias
        if(type.equals("alias")){
            List<SkuMapping>all=mappingRepo.findAll();
            for(SkuMapping m:all){
                existingAlias.add(m.getChannelSku()+"::"+m.getChannel());
            }
        }
        try(Workbook workbook = new XSSFWorkbook(file.getInputStream())){
            Sheet sheet=workbook.getSheetAt(0);
            for(Row row:sheet){
                if(row.getRowNum() == 0)continue;
                if(type.equals("alias")){

                    String channel=formatter.formatCellValue(row.getCell(0));
                    String wrongSku=formatter.formatCellValue(row.getCell(1));
                    String rightSku=formatter.formatCellValue(row.getCell(2));
                    if(existingAlias.contains(wrongSku+"::"+channel)){
                        System.out.println("Duplicate Sku "+wrongSku+" in Channel "+channel);
                        continue;
                    }
                    if(!wrongSku.isEmpty() && !rightSku.isEmpty()){
                        SkuMapping mapping=new SkuMapping();
                        mapping.setChannel(channel);
                        mapping.setChannelSku(wrongSku);
                        mapping.setMasterSku(rightSku);
                        mappingRepo.save(mapping);
                    }
                }
                else if(type.equals("bundle")){
                    String comboSku=formatter.formatCellValue(row.getCell(0));
                    String compSku=formatter.formatCellValue(row.getCell(1));
                    String qtyStr=formatter.formatCellValue(row.getCell(2));

                    if(!comboSku.isEmpty() && !comboSku.isEmpty()){
                        ProductBundle bundle=new ProductBundle();
                        bundle.setComboSku(comboSku);
                        bundle.setComponentSku(compSku);
                        try{
                            bundle.setQty(Integer.parseInt(qtyStr));
                        } catch(Exception e){
                            bundle.setQty(1);
                        }
                        bundleRepo.save(bundle);
                    }
                }
            }
        }

    }
}
