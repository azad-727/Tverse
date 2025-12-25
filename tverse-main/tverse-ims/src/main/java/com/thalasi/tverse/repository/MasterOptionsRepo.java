package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.MasterOptions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MasterOptionsRepo  extends JpaRepository<MasterOptions,Long> {
    List<MasterOptions> findByCategory(String category);

}
