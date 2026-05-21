package com.thalasi.tverse.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name="attendance_log")
@Data
public class AttendanceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name="staff_id",nullable=false)
    private Staff staff;

    private LocalDate date;

    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;

    private double workedHours;
    private String status;

    private String remarks;
    private String shiftType;
    @Column(name = "punch_photo_url", columnDefinition = "TEXT")
    private String punchPhotoUrl;
    private boolean isLate;

}
