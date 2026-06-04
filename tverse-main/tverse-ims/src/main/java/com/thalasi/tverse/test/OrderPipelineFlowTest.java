package com.thalasi.tverse;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.http.RequestEntity.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.web.servlet.function.ServerResponse.status;

@SpringBootTest
@AutoConfigureMockMvc
public class OrderPipelineFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "kiosk-operator", roles = {"EMPLOYEE"})
    public void employee_RequestDashboardCounts_ShouldSucceed() throws Exception {
        mockMvc.perform(get("/api/orders/flow/counts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approved").exists()); // Employees can read pipeline metrics securely
    }

    @Test
    @WithMockUser(username = "kiosk-operator", roles = {"EMPLOYEE"})
    public void employee_AttemptOrderCancellation_ShouldBeForbidden() throws Exception {
        String payload = "{\"ids\": [101, 102]}";

        mockMvc.perform(post("/api/orders/flow/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden()); // Standard floor employees are blocked from cancellations
    }

    @Test
    @WithMockUser(username = "admin-manager", roles = {"ADMIN"})
    public void admin_ExecuteOrderCancellation_ShouldSucceed() throws Exception {
        String payload = "{\"ids\": [1, 2]}";

        mockMvc.perform(post("/api/orders/flow/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk()); // Admin role clears permissions and processes the cancellation loop
    }
}