package com.thalasi.tverse.repository;

import com.thalasi.tverse.model.AttendanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepo extends JpaRepository<AttendanceLog,Long> {
Optional<AttendanceLog> findByStaffIdAndDate(Long staffId, LocalDate date);
List<AttendanceLog> findByDate(LocalDate date);
List<AttendanceLog> findByDateBetweenOrderByDateDesc(LocalDate startDate, LocalDate endDate);
List<AttendanceLog> findByStaffIdAndDateBetweenOrderByDateDesc(Long staffId, LocalDate startDate, LocalDate endDate);

}
