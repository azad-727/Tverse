package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface brandRepo extends JpaRepository<brand,Long>{
    Optional<brand> findByName(String name);

}
