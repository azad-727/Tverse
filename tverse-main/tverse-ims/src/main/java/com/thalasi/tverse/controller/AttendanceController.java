package com.thalasi.tverse.controller;

import com.thalasi.tverse.model.AttendanceLog;
import com.thalasi.tverse.model.Staff;
import com.thalasi.tverse.repository.AttendanceRepo;
import com.thalasi.tverse.repository.StaffRepo;
import com.thalasi.tverse.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private StaffRepo staffRepo;
    @Autowired
    private AttendanceRepo attendanceRepo;

    // --- 1. SETUP: ADD NEW STAFF ---
    // Use this to populate your team first
    @PostMapping("/staff/add")
    public ResponseEntity<?> addStaff(@RequestBody Staff staff) {
        try {
            staff.setActive(true);
            if(staff.getSecurityPin()==null||staff.getSecurityPin().isEmpty());
            return ResponseEntity.ok(staffRepo.save(staff));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error adding staff: " + e.getMessage());
        }
    }

    // --- 2. DASHBOARD: GET TODAY'S STATUS ---
    // Returns list of all staff with their current status (WORKING/ABSENT/COMPLETED)
    @GetMapping("/today")
    public ResponseEntity<List<Map<String, Object>>> getTodayDashboard() {
        return ResponseEntity.ok(attendanceService.getTodayDashboard());
    }

    public static class PunchRequest {
        public String pin;
        public String photo;
    }
    @GetMapping("/history")
    public ResponseEntity<List<AttendanceLog>> getAttendanceHistory(
            @RequestParam(required = false) Long staffId,
            @RequestParam String from,
            @RequestParam String to
    ) {
        LocalDate start = LocalDate.parse(from);
        LocalDate end = LocalDate.parse(to);

        if (staffId != null) {
            return ResponseEntity.ok(attendanceRepo.findByStaffIdAndDateBetweenOrderByDateDesc(staffId, start, end));
        }
        return ResponseEntity.ok(attendanceRepo.findByDateBetweenOrderByDateDesc(start, end));
    }
    @PutMapping("/staff/update/{id}")
    public ResponseEntity<?> updateStaff(@PathVariable Long id, @RequestBody Staff updatedInfo) {
        return staffRepo.findById(id).map(staff -> {
            staff.setFullName(updatedInfo.getFullName());
            staff.setRole(updatedInfo.getRole());
            staff.setPhoneNumber(updatedInfo.getPhoneNumber());
            staff.setDailyWage(updatedInfo.getDailyWage()); // Ensure Staff entity has this
            staff.setWorkPolicy(updatedInfo.getWorkPolicy()); // Ensure Staff entity has this
            return ResponseEntity.ok(staffRepo.save(staff));
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- 6. GET ALL STAFF (For Admin List) ---
    @GetMapping("/staff/all")
    public List<Staff> getAllStaff() {
        return staffRepo.findAll();
    }
    // --- 3. ACTION: PUNCH IN / OUT ---
    @PostMapping("/punch/{staffId}")
    public ResponseEntity<String> toggleAttendance(@PathVariable Long staffId,
    @RequestBody(required=false) PunchRequest request) {
        try {
            String pin=(request !=null)?request.pin:null;
            String photo=(request !=null)?request.photo:null;

            return ResponseEntity.ok(attendanceService.toggleAttendance(staffId,pin,photo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}