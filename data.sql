USE Clinic_Management;

-- Sample data for Patient table
INSERT INTO Patient (patient_id, name, phone) VALUES
(1, 'John Doe', '123-456-7890'),
(2, 'Jane Smith', '987-654-3210'),
(3, 'Michael Johnson', '555-123-4567'),
(4, 'Emily Brown', '222-333-4444'),
(5, 'Sarah Wilson', '777-888-9999');

-- Sample data for Schedule table
INSERT INTO Schedule (schedule_id, weekday_start, weekday_end, saturday_start, saturday_end, sunday_start, sunday_end, public_holiday_start, public_holiday_end) VALUES
(1, '08:00:00', '17:00:00', '08:00:00', '12:00:00', '09:00:00', '13:00:00', '10:00:00', '15:00:00'),
(2, '09:00:00', '18:00:00', '09:00:00', '13:00:00', '10:00:00', '14:00:00', '11:00:00', '16:00:00');

-- Sample data for Specialty table
INSERT INTO Specialty (specialty_id, name) VALUES
(1, 'Cardiology'),
(2, 'Dermatology'),
(3, 'Orthopedics');

-- Sample data for Appointment_Type table
INSERT INTO Appointment_Type (appt_type_id, name) VALUES
(1, 'Follow-up'),
(2, 'Consultation'),
(3, 'Procedure');

-- Sample data for Clinic table
INSERT INTO Clinic (clinic_id, name, block, road, unit, postal_code, phone, email, schedule_id) VALUES
(1, 'City Hospital Clinic', '123', 'Main Street', 'A1', '12345', '555-123-4567', 'clinic@example.com', 1),
(2, 'Community Medical Center', '456', 'Oak Avenue', 'B2', '54321', '555-987-6543', 'medcenter@example.com', 2);

-- Sample data for Doctor table
INSERT INTO Doctor (doctor_id, name, clinic_id) VALUES
(1, 'Dr. David Johnson', 1),
(2, 'Dr. Emily Lee', 2),
(3, 'Dr. Michael Brown', 1),
(4, 'Dr. Sarah Smith', 2);

-- Sample data for Appointment table
INSERT INTO Appointment (appointment_id, datetime, patient_id, doctor_id, appt_type_id) VALUES
(1, '2024-03-20 10:00:00', 1, 1, 2),
(2, '2024-03-21 14:30:00', 2, 2, 1),
(3, '2024-03-22 09:15:00', 3, 3, 3),
(4, '2024-03-23 11:00:00', 4, 4, 2),
(5, '2024-03-24 15:45:00', 5, 1, 1);

-- Sample data for DoctorSpecialty table
INSERT INTO DoctorSpecialty (doctor_id, specialty_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 1);
