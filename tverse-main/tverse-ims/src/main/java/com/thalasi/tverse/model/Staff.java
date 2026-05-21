package com.thalasi.tverse.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.DayOfWeek;
import java.time.LocalDate;

@Entity
@Table(name="staff_members")
@Data
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    @Column(nullable=false)
    private String fullName;
    private String role;
    @Column(unique=true)
    private Long phoneNumber;
    private Long hourlyWage;
    @Column(length = 4)
    private String securityPin;
    private double dailyWage;
    private String workPolicy;
    @Enumerated(EnumType.STRING)
    private DayOfWeek weeklyOffDay;
    private double overtimeRate;
    private boolean isActive=true;
    @CreationTimestamp
    private LocalDate joiningDate;

}
