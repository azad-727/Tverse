package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.Fabric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FabricRepo extends JpaRepository<Fabric,Long> {

}
