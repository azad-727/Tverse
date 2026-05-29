package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrdersReport  {
    interface SalesOrderRepo extends JpaRepository<SalesOrder, Long> {
            }

}

