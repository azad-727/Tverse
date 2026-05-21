package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepo extends JpaRepository<Staff,Long> {

    List<Staff> findByIsActiveTrue();

    Optional<Staff> findById(Long staffId);
}
