package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.Staff;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StaffRepository {

    List<Staff> findByIsActiveTrue();
}
