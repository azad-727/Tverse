package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.DailyDispatch;
import org.springframework.cglib.core.Local;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface DailyDispatchRepo extends JpaRepository<DailyDispatch,Long> {
    long countByStaffNameAndScanTimeBetween(String staffName, LocalDateTime start,LocalDateTime end);


    @Query("SELECT d FROM DailyDispatch d WHERE "+
    "d.scanTime BETWEEN :start AND :end AND "+
    "(:channel IS NULL or d.channel=:channel) AND "+
     "(:courier IS NULL OR d.courierPartner=:courier) AND"+
     "(:staff IS NULL OR d.staffName=:staff) AND "+
     "(:search IS NULL OR d.horizontalBarcode LIKE %:search% OR d.verticalBarcode LIKE %:search%)"+
     "ORDER BY d.scanTime DESC"
    )
    List<DailyDispatch> findLogs(
            @Param("start") LocalDateTime start,
            @Param("end")LocalDateTime end,
            @Param("channel") String channel,
            @Param("courier") String courier,
            @Param("staff") String staff,
            @Param("search") String search
            );
}
