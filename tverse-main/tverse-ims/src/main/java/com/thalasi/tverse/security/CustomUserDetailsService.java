package com.thalasi.tverse.security;

import com.thalasi.tverse.model.Staff;
import com.thalasi.tverse.repository.StaffRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired
    private StaffRepo staffRepo;

    @Override
    public UserDetails loadUserByUsername(String phoneNumberStr) throws UsernameNotFoundException {
        try {
            Long phoneNumber = Long.parseLong(phoneNumberStr.trim());
            Staff staff = staffRepo.findByPhoneNumber(phoneNumber)
                    .orElseThrow(() -> new UsernameNotFoundException("Staff not found with phone: " + phoneNumberStr));

            if (!staff.isActive()) {
                throw new RuntimeException("This staff account has been deactivated.");
            }

            // Maps your role string (e.g., ADMIN) into a standard GrantedAuthority object
            SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + staff.getRole().toUpperCase());

            return new User(
                    String.valueOf(staff.getPhoneNumber()),
                    staff.getSecurityPin(), // Encrypted or plain database pin comparison point
                    Collections.singletonList(authority)
            );
        } catch (NumberFormatException e) {
            throw new UsernameNotFoundException("Invalid phone number formatting pattern context error.");
        }

    }
}
