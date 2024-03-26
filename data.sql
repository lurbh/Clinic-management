USE Clinic_Management;

-- Inserting sample data into the Specialty table
INSERT INTO Specialty (name) VALUES
('Cardiology'),
('Dermatology'),
('Orthopedics'),
('Pediatrics');

-- Inserting sample data into the Schedule table
INSERT INTO Schedule (weekday_start, weekday_end, saturday_start, saturday_end, sunday_start, sunday_end, public_holiday_start, public_holiday_end) VALUES
('08:00:00', '17:00:00', '09:00:00', '14:00:00', '10:00:00', '13:00:00', '10:00:00', '15:00:00'),
('09:00:00', '18:00:00', '10:00:00', '15:00:00', '11:00:00', '14:00:00', '11:00:00', '16:00:00');

-- Inserting sample data into the Clinic table
INSERT INTO Clinic (name, block, road, unit, postal_code, phone, email, schedule_id) VALUES
('City Hospital Clinic', '123', 'Main Street', 'A1', '12345', '555-123-4567', 'clinic@example.com', 1),
('Community Medical Center', '456', 'Oak Avenue', 'B2', '54321', '555-987-6543', 'medcenter@example.com', 2);

-- Inserting sample data into the Doctor table
INSERT INTO Doctor (name, clinic_id) VALUES
('Dr. David Johnson', 1),
('Dr. Emily Lee', 2),
('Dr. Michael Brown', 1),
('Dr. Sarah Smith', 2);

-- Inserting sample data into the Patient table
INSERT INTO Patient (name, phone, email) VALUES
('John Doe', '123-456-7890', 'john.doe@example.com'),
('Jane Smith', '987-654-3210', 'jane.smith@example.com'),
('Michael Johnson', '555-123-4567', 'michael.johnson@example.com'),
('Emily Brown', '222-333-4444', 'emily.brown@example.com'),
('Sarah Wilson', '777-888-9999', 'sarah.wilson@example.com');

-- Inserting sample data into the Appointment_Type table
INSERT INTO Appointment_Type (name) VALUES
('Follow-up'),
('Consultation'),
('Procedure');

-- Inserting sample data into the DoctorSpecialty table
INSERT INTO DoctorSpecialty (doctor_id, specialty_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 1);

-- Inserting sample data into the Appointment table
INSERT INTO Appointment (datetime, patient_id, doctor_id, appt_type_id) VALUES
('2024-03-20 10:00:00', 1, 1, 2),
('2024-03-21 14:30:00', 2, 2, 1),
('2024-03-22 09:15:00', 3, 3, 3),
('2024-03-23 11:00:00', 4, 4, 2),
('2024-03-24 15:45:00', 5, 1, 1);
