package com.thalasi.tverse.service;

import com.thalasi.tverse.model.AttendanceLog;
import com.thalasi.tverse.model.Staff;
import com.thalasi.tverse.repository.AttendanceRepo;
import com.thalasi.tverse.repository.StaffRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AttendanceService {
    private static final LocalTime OFFICE_OPEN = LocalTime.of(8, 30);
    private static final LocalTime PUNCH_IN_LIMIT = LocalTime.of(8, 45);
    private static final LocalTime PUNCH_OUT_START = LocalTime.of(17, 30); // 5:30 PM
    private static final LocalTime PUNCH_OUT_END = LocalTime.of(17, 50);

    @Autowired
    private StaffRepo staffRepo;

    @Autowired
    private AttendanceRepo attendanceRepo;

    // --- DASHBOARD DATA: WHO IS HERE? ---
    // This merges the Staff List with Today's Logs so the UI knows which color to show
    public List<Map<String, Object>> getTodayDashboard() {
        List<Staff> allStaff = staffRepo.findByIsActiveTrue();
        LocalDate today = LocalDate.now();
        List<AttendanceLog> todayLogs = attendanceRepo.findByDate(today);

        // Convert Logs to a Map for fast lookup (Staff ID -> Log)
        Map<Long, AttendanceLog> logMap = new HashMap<>();
        for (AttendanceLog log : todayLogs) {
            logMap.put(log.getStaff().getId(), log);
        }

        // Build the result list
        List<Map<String, Object>> dashboard = new ArrayList<>();

        for (Staff staff : allStaff) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("staffId", staff.getId());
            entry.put("name", staff.getFullName());
            entry.put("role", staff.getRole());

            if (logMap.containsKey(staff.getId())) {
                AttendanceLog log = logMap.get(staff.getId());
                entry.put("status", log.getStatus()); // WORKING or COMPLETED
                entry.put("checkIn", log.getCheckInTime());
                entry.put("checkOut", log.getCheckOutTime());
                entry.put("hours", log.getWorkedHours());
            } else {
                entry.put("status", "ABSENT"); // Not arrived yet
                entry.put("checkIn", null);
            }

            dashboard.add(entry);
        }

        return dashboard;
    }
    @Transactional
    public String toggleAttendance(Long staffId,String pin,String photoUrl){
        Staff staff=staffRepo.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        if(staff.getSecurityPin()==null||!staff.getSecurityPin().equals(pin)){
            throw new RuntimeException("Inavlid PIN Code!");
        }
        LocalDate today=LocalDate.now();
        LocalTime now=LocalTime.now();
        DayOfWeek todayDay=today.getDayOfWeek();

        // 3.
        Optional<AttendanceLog> logOpt=attendanceRepo.findByStaffIdAndDate(staffId,today);

        if(logOpt.isEmpty()){
            if(now.isBefore(OFFICE_OPEN)){
                throw new RuntimeException("Wait! Office opens at 08:30 AM.");
            }
            if(now.isAfter(PUNCH_IN_LIMIT)){
                throw new RuntimeException("LOCKED:You are late (After 8:45). Contact Manager. ");
            }
            AttendanceLog newLog=new AttendanceLog();
            newLog.setStaff(staff);
            newLog.setDate(today);
            newLog.setCheckInTime(LocalDateTime.now());
            newLog.setStatus("WORKING");
            newLog.setPunchPhotoUrl(photoUrl);
            newLog.setLate(now.isAfter(PUNCH_IN_LIMIT));

            if(staff.getWeeklyOffDay()!=null && staff.getWeeklyOffDay()==todayDay){
                newLog.setShiftType("SUNDAY_OT");
            }else{
                newLog.setShiftType("REGULAR");
            }
            attendanceRepo.save(newLog);
            return "Welcome"+staff.getFullName()+(newLog.isLate()?" (Marked Late)":"");
        }
        else{
            AttendanceLog existing=logOpt.get();
//            if(existing.getCheckInTime()!=null){
//                throw new RuntimeException("Shift already completed.");
//            }

//            if(now.isAfter(PUNCH_OUT_END)){
//                throw new RuntimeException("LOCKED: Punch out time (5:50 PM) exceeded");
//            }
            existing.setCheckOutTime(LocalDateTime.now());
            existing.setStatus("COMPLETED");

            long minutes=Duration.between(existing.getCheckInTime(), existing.getCheckOutTime()).toMinutes();
            double hours=minutes/60.0;
            existing.setWorkedHours(hours);
            attendanceRepo.save(existing);
            return "GoodBye "+ staff.getFullName();

        }
    }
}