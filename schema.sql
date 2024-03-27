CREATE DATABASE Clinic_Management;

USE Clinic_Management;

CREATE TABLE Patients
(
  patient_id INT UNSIGNED AUTO_INCREMENT NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  PRIMARY KEY (patient_id)
);

CREATE TABLE Schedules
(
  schedule_id INT UNSIGNED AUTO_INCREMENT NOT NULL,
  weekday_start TIME NOT NULL,
  weekday_end TIME NOT NULL,
  saturday_start TIME,
  saturday_end TIME,
  sunday_start TIME,
  sunday_end TIME,
  public_holiday_end TIME,
  public_holiday_start TIME,
  PRIMARY KEY (schedule_id)
);

CREATE TABLE Specialties
(
  specialty_id INT UNSIGNED AUTO_INCREMENT NOT NULL,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (specialty_id)
);

CREATE TABLE AppointmentTypes
(
  appt_type_id INT UNSIGNED AUTO_INCREMENT NOT NULL,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (appt_type_id)
);

CREATE TABLE Clinics
(
  clinic_id INT UNSIGNED AUTO_INCREMENT NOT NULL,
  name VARCHAR(255) NOT NULL,
  block VARCHAR(15) NOT NULL,
  road VARCHAR(255) NOT NULL,
  unit VARCHAR(15) NOT NULL,
  postal_code VARCHAR(15) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(155) NOT NULL,
  schedule_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (clinic_id),
  FOREIGN KEY (schedule_id) REFERENCES Schedules(schedule_id)
);

CREATE TABLE Doctors
(
  doctor_id INT UNSIGNED AUTO_INCREMENT NOT NULL,
  name VARCHAR(255) NOT NULL,
  clinic_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (doctor_id),
  FOREIGN KEY (clinic_id) REFERENCES Clinics(clinic_id)
);

CREATE TABLE Appointments
(
  appointment_id INT UNSIGNED AUTO_INCREMENT NOT NULL,
  datetime DATETIME NOT NULL,
  patient_id INT UNSIGNED NOT NULL,
  doctor_id INT UNSIGNED NOT NULL,
  appt_type_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (appointment_id),
  FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
  FOREIGN KEY (doctor_id) REFERENCES Doctors(doctor_id),
  FOREIGN KEY (appt_type_id) REFERENCES AppointmentTypes(appt_type_id)
);

CREATE TABLE Doctors_Specialties
(
  doctor_id INT UNSIGNED NOT NULL,
  specialty_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (doctor_id, specialty_id),
  FOREIGN KEY (doctor_id) REFERENCES Doctors(doctor_id),
  FOREIGN KEY (specialty_id) REFERENCES Specialties(specialty_id)
);