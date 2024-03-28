const express = require('express');
const hbs = require('hbs');
const waxOn = require('wax-on');
const {createConnection} = require('mysql2/promise');
const res = require('express/lib/response');
require('dotenv').config();

let app = express();

app.set('view engine', 'hbs');
app.use(express.static('public'));
app.use(express.urlencoded({extended:false}));

waxOn.on(hbs.handlebars);
waxOn.setLayoutPath('./views/layouts');

require('handlebars-helpers')({
    handlebars: hbs.handlebars
})

let connection;
const port = 6565;

function setAMPMTime(time)
{
    let timeofday = " am";
    const stime = time.split(":");
    if(stime[0] >= 12)
    {
        timeofday = " pm"
        if(stime[0] != 12)
        {
            stime[0] -= 12;
            if(stime[0] < 10)
                stime[0] = "0" + stime[0];
        }
        
    }
    
    const newtimestring = stime.join(":").concat(timeofday);
    return newtimestring;
}

async function main()
{
    connection = await createConnection({
        'host': process.env.DB_HOST,
        'user': process.env.DB_USER,
        'database': process.env.DB_NAME,
        'password': process.env.DB_PASSWORD
    })

    app.get('/', function(req,res) 
    {
        res.render('index');
    });

    app.get('/clinics', async function(req,res)
    {
        const {search} = req.query;
        let [clinics] = !search?await connection.execute(`SELECT * FROM Clinics;`):await connection.execute(`SELECT * FROM Clinics WHERE name LIKE ?;`, [`%${search}%`]);
        res.render('clinics/index', {
            clinics
        });
    });

    app.get('/clinics/schedule/:schedule_id', async function(req,res)
    {
        const {schedule_id} = req.params;
        const [clinics] = await connection.execute(`SELECT * FROM Clinics INNER JOIN Schedules 
            ON Clinics.schedule_id = Schedules.schedule_id WHERE Clinics.schedule_id=?;`, [schedule_id]);
        const clinic = clinics[0];
        clinic.weekday_start = setAMPMTime(clinic.weekday_start);
        clinic.weekday_end = setAMPMTime(clinic.weekday_end);
        clinic.saturday_start = setAMPMTime(clinic.saturday_start);
        clinic.saturday_end = setAMPMTime(clinic.saturday_end);
        clinic.saturday_start = setAMPMTime(clinic.saturday_start);
        clinic.saturday_end = setAMPMTime(clinic.saturday_end);
        clinic.public_holiday_start = setAMPMTime(clinic.public_holiday_start);
        clinic.public_holiday_end = setAMPMTime(clinic.public_holiday_end);
        res.render('clinics/schedule',{
            clinic
        });
    });

    app.get('/clinics/create', async function(req,res)
    {
        res.render('clinics/create');
    });

    app.post('/clinics/create', async function(req,res)
    {
        const {name,block,road,unit,postal_code,phone,email} = req.body;
        const {weekday_start,weekday_end,saturday_start,saturday_end,sunday_start,sunday_end,public_holiday_start,public_holiday_end} = req.body;
        const Schedulequery = `INSERT INTO Schedules (weekday_start, weekday_end, saturday_start, saturday_end, sunday_start, sunday_end, public_holiday_start, public_holiday_end) 
        VALUES(?, ?, ?, ?, ?, ?, ?, ?);`
        const [response] = await connection.execute(Schedulequery, [weekday_start, weekday_end, saturday_start, saturday_end, sunday_start, sunday_end, public_holiday_start, public_holiday_end]);
        insertedID = response.insertId;
        const clinicquery = `INSERT INTO Clinics (name, block, road, unit, postal_code, phone, email, schedule_id) 
        VALUES(?, ?, ?, ?, ?, ?, ?, ?);`;
        await connection.execute(clinicquery,[name,block,road,unit,postal_code,phone,email,insertedID]);
        res.redirect('/clinics');
    });

    app.get('/clinics/edit/:clinic_id', async function(req,res)
    {
        const {clinic_id} = req.params;
        const [clinics] = await connection.execute(`SELECT * FROM Clinics INNER JOIN Schedules 
            ON Clinics.schedule_id = Schedules.schedule_id WHERE Clinics.clinic_id=?;`, [clinic_id]); 
        const clinic = clinics[0];
        res.render('clinics/edit',{
            clinic
        });
    });

    app.post('/clinics/edit/:clinic_id', async function(req,res)
    {
        const {clinic_id} = req.params;
        const {name,block,road,unit,postal_code,phone,email} = req.body;
        const {weekday_start,weekday_end,saturday_start,saturday_end,sunday_start,sunday_end,public_holiday_start,public_holiday_end} = req.body;
        const [clinics] = await connection.execute(`SELECT * FROM Clinics INNER JOIN Schedules 
            ON Clinics.schedule_id = Schedules.schedule_id WHERE Clinics.clinic_id=?;`, [clinic_id]); 
        const clinic = clinics[0];
        const schedule_id = clinic.schedule_id;
        const Schedulequery = `UPDATE Schedules SET
        weekday_start=?,
        weekday_end=?,
        saturday_start=?,
        saturday_end=?,
        sunday_start=?,
        sunday_end=?,
        public_holiday_start=?,
        public_holiday_end=?
        WHERE schedule_id=?;`
        const [response] = await connection.execute(Schedulequery, [weekday_start, weekday_end, saturday_start, saturday_end, sunday_start, sunday_end, public_holiday_start, public_holiday_end, schedule_id]);
        insertedID = response.insertId;
        const clinicquery = `UPDATE Clinics SET
        name=?,
        block=?,
        road=?,
        unit=?,
        postal_code=?,
        phone=?,
        email=?
        WHERE clinic_id=?;`;
        await connection.execute(clinicquery,[name,block,road,unit,postal_code,phone,email,clinic_id]);
        res.redirect('/clinics');
    });

    app.get('/clinics/delete/:clinic_id', async function (req,res) 
    {
        const clinic_id = req.params.clinic_id;
        let query = `SELECT * FROM Clinics WHERE clinic_id = ?;`;
        let [clinics] = await connection.execute(query,[clinic_id]);
        const clinicToDelete = clinics[0];
        res.render('clinics/delete', {
            'clinic' : clinicToDelete
        })
    });

    app.post('/clinics/delete/:clinic_id', async function (req,res) 
    {
        const clinic_id = req.params.clinic_id;

        // check if the clinic_id in a relationship with an Doctor
        const checkDoctorQuery = `SELECT * FROM Doctors WHERE clinic_id = ?`;
        const [involved] = await connection.execute(checkDoctorQuery,[clinic_id]);
        if (involved.length > 0) {
            res.send("Unable to delete because the Clinic as doctor is still attached to the clinic");
            return;
        }

        let query = `DELETE FROM Clinics WHERE clinic_id = ?;`;
        await connection.execute(query,[clinic_id]);
        res.redirect('/clinics');
    });

    app.get("/appointments", async function (req,res){
        const {patient_id,doctor_id,appt_type_id,clinic_id} = req.query;
        let searchquery = `WHERE `;
        let queryArray = [];
        if(patient_id)
            queryArray.push(`Appointments.patient_id = ${patient_id}`);
        if(doctor_id)
            queryArray.push(`Appointments.doctor_id = ${doctor_id}`);
        if(appt_type_id)
            queryArray.push(`Appointments.appt_type_id = ${appt_type_id}`);
        if(clinic_id)
            queryArray.push(`Doctors.clinic_id = ${clinic_id}`);
        for (let index = 0; index < queryArray.length; index++) {
            searchquery = searchquery + queryArray[index];
            if(index != queryArray.length - 1)
                searchquery = searchquery + " AND "
        }
        const [appointments] = !queryArray.length?await connection.execute(`SELECT appointment_id,Patients.name AS P_name, Doctors.name AS D_name, AppointmentTypes.name AS apt_name, Clinics.name AS C_name,
        DATE(datetime) AS date,TIME(datetime) AS time FROM Appointments
        INNER JOIN Patients ON Appointments.patient_id = Patients.patient_id
        INNER JOIN Doctors ON Appointments.doctor_id = Doctors.doctor_id
        INNER JOIN AppointmentTypes ON Appointments.appt_type_id = AppointmentTypes.appt_type_id
        INNER JOIN Clinics on Doctors.clinic_id = Clinics.clinic_id
        ORDER BY date,time;`):await connection.execute(`SELECT appointment_id,Patients.name AS P_name, Doctors.name AS D_name, AppointmentTypes.name AS apt_name, Clinics.name AS C_name,
        DATE(datetime) AS date,TIME(datetime) AS time FROM Appointments 
        INNER JOIN Patients ON Appointments.patient_id = Patients.patient_id
        INNER JOIN Doctors ON Appointments.doctor_id = Doctors.doctor_id
        INNER JOIN AppointmentTypes ON Appointments.appt_type_id = AppointmentTypes.appt_type_id
        INNER JOIN Clinics on Doctors.clinic_id = Clinics.clinic_id ${searchquery} 
        ORDER BY date,time;`);
        const [patients] = await connection.execute(`SELECT * FROM Patients;`);
        const [doctors] = await connection.execute(`SELECT * FROM Doctors;`);
        const [appt_types] = await connection.execute(`SELECT * FROM AppointmentTypes;`);
        const [clinics] = await connection.execute("SELECT * FROM Clinics");
        for(const apt of appointments)
        {
            apt.time = setAMPMTime(apt.time);
            apt.date = apt.date.toISOString().substring(0, 10);
        }
        res.render("appointments/index", {
            appointments,
            patients,
            doctors,
            appt_types,
            clinics
        });
    });

    app.post("/appointments", async function (req,res){
        const {patient_id,doctor_id,appt_type_id,clinic_id} = req.body;
        res.redirect(`/appointments?p_id=${patient_id}&d_id=${doctor_id}&at_id=${appt_type_id}&c_id=${clinic_id}`);
    });

    app.get("/appointments/create", async function (req,res){
        const [patients] = await connection.execute(`SELECT * FROM Patients;`);
        const [doctors] = await connection.execute(`SELECT * FROM Doctors;`);
        const [appt_types] = await connection.execute(`SELECT * FROM AppointmentTypes;`);

        res.render("appointments/create", {
            patients,
            doctors,
            appt_types
        })
    });

    app.post("/appointments/create", async function (req,res){
        const {patient_id,doctor_id,appt_type_id,date,time} = req.body;
        const datetime = date + " " + time;
        const query = `INSERT INTO Appointments (datetime, patient_id, doctor_id, appt_type_id) VALUES(?,?,?,?)`
        const response = await connection.execute(query,[datetime,patient_id,doctor_id,appt_type_id]);
        res.redirect('/appointments');
    });

    app.get("/appointments/edit/:appointment_id", async function (req,res){
        const {appointment_id} = req.params;
        const [patients] = await connection.execute(`SELECT * FROM Patients;`);
        const [doctors] = await connection.execute(`SELECT * FROM Doctors;`);
        const [appt_types] = await connection.execute(`SELECT * FROM AppointmentTypes;`);
        const [appointments] = await connection.execute(`SELECT *, DATE(datetime) AS date,TIME(datetime) AS time FROM Appointments
        WHERE appointment_id=?;`,[appointment_id]);
        const appointment = appointments[0];
        appointment.date = appointment.date.toISOString().substring(0, 10);
        res.render("appointments/edit", {
            patients,
            doctors,
            appt_types,
            appointment
        })
    });

    app.post("/appointments/edit/:appointment_id", async function (req,res){
        const {appointment_id} = req.params;
        const {patient_id,doctor_id,appt_type_id,date,time} = req.body;
        const datetime = date + " " + time;
        const query = `UPDATE Appointments SET 
        datetime=?, 
        patient_id=?, 
        doctor_id=?, 
        appt_type_id=?
        WHERE appointment_id=?`
        const response = await connection.execute(query,[datetime,patient_id,doctor_id,appt_type_id,appointment_id]);
        res.redirect('/appointments');
    });

    app.get("/appointments/delete/:appointment_id", async function (req,res){
        const {appointment_id} = req.params;
        const [appointments] = await connection.execute(`SELECT appointment_id,Patients.name AS P_name, Doctors.name AS D_name, AppointmentTypes.name AS apt_name,
        DATE(datetime) AS date,TIME(datetime) AS time FROM Appointments 
        INNER JOIN Patients ON Appointments.patient_id = Patients.patient_id
        INNER JOIN Doctors ON Appointments.doctor_id = Doctors.doctor_id
        INNER JOIN AppointmentTypes ON Appointments.appt_type_id = AppointmentTypes.appt_type_id 
        WHERE appointment_id=?;`,[appointment_id]);
        const appointment = appointments[0];
        appointment.date = appointment.date.toISOString().substring(0, 10);
        appointment.time = setAMPMTime(appointment.time);
        res.render('appointments/delete',{
            appointment
        })
    });

    app.post("/appointments/delete/:appointment_id", async function (req,res){
        const {appointment_id} = req.params;
        const query = `DELETE FROM Appointments WHERE appointment_id=?`;
        const response = await connection.execute(query, [appointment_id]);
        res.redirect('/appointments');
    });

    app.get("/doctors", async function (req,res){
        const {clinic_id} = req.query;
        const [doctors] = !clinic_id?await connection.execute(`
        SELECT Doctors.doctor_id, Doctors.name as D_name, Clinics.name AS C_name, GROUP_CONCAT(Specialties.name SEPARATOR ', ') AS Specialties FROM Doctors 
        JOIN Clinics ON Doctors.clinic_id = Clinics.clinic_id 
        JOIN Doctors_Specialties ON Doctors.doctor_id = Doctors_Specialties.doctor_id 
        JOIN Specialties ON Doctors_Specialties.specialty_id = Specialties.specialty_id 
        GROUP BY Doctors.doctor_id 
        ORDER BY Clinics.clinic_id;`):await connection.execute(`
        SELECT Doctors.doctor_id, Doctors.name as D_name, Clinics.name AS C_name, GROUP_CONCAT(Specialties.name SEPARATOR ', ') AS Specialties FROM Doctors 
        JOIN Clinics ON Doctors.clinic_id = Clinics.clinic_id 
        JOIN Doctors_Specialties ON Doctors.doctor_id = Doctors_Specialties.doctor_id 
        JOIN Specialties ON Doctors_Specialties.specialty_id = Specialties.specialty_id 
        WHERE Doctors.clinic_id = ? 
        GROUP BY Doctors.doctor_id 
        ORDER BY Clinics.clinic_id;`,[clinic_id]);
        const [clinics] = await connection.execute("SELECT * FROM Clinics");
        res.render("doctors/index", {
            doctors,
            clinics
        });
    });

    app.get("/doctors/specialty", async function (req,res){
        res.render("doctors/specialty");
    });

    app.post("/doctors/specialty", async function (req,res){
        const {name} = req.body;
        const response = await connection.execute(`INSERT INTO Specialties (name) VALUES(?)`,[name]);
        res.redirect("/doctors");
    });

    app.get("/doctors/create", async function (req,res){
        const [clinics] = await connection.execute("SELECT * FROM Clinics");
        const [specialties] = await connection.execute("SELECT * FROM Specialties");
        res.render("doctors/create", {
            clinics,
            specialties
        });
    });

    app.post("/doctors/create", async function (req,res){
        const {name,clinic_id,specialty} = req.body;
        let doctorquery = `INSERT INTO Doctors (name, clinic_id) VALUES(?, ?)`;
        const [response] = await connection.execute(doctorquery,[name, clinic_id]);
        const insertId = response.insertId;
        let specialtyArray = [];
        if(Array.isArray(specialty))
            specialtyArray = specialty;
        else
            specialtyArray.push(specialty)
        for (let sid of specialtyArray)
        {
            let specialtyquery = `INSERT INTO Doctors_Specialties (doctor_id, specialty_id) VALUES(?, ?)`
            await connection.execute(specialtyquery, [insertId, sid])
        }
        res.redirect("/doctors");
    });

    app.get("/doctors/delete/:doctor_id", async function (req,res){
        const {doctor_id} = req.params;
        let query = `SELECT Doctors.*, Clinics.name as C_name FROM Doctors INNER JOIN Clinics ON Doctors.clinic_id = Clinics.clinic_id WHERE doctor_id = ?;`;
        let [doctors] = await connection.execute(query,[doctor_id]);
        const doctor = doctors[0];
        res.render('doctors/delete', {
            doctor
        })
    });

    app.post("/doctors/delete/:doctor_id", async function (req,res){
        const {doctor_id} = req.params;
        await connection.execute("DELETE FROM Doctors_Specialties WHERE doctor_id = ?;",[doctor_id])
        const query = `DELETE FROM Doctors WHERE doctor_id=?`;
        await connection.execute(query, [doctor_id]);
        res.redirect('/doctors');
    });

    app.get("/doctors/edit/:doctor_id", async function (req,res){
        const {doctor_id} = req.params;
        const [clinics] = await connection.execute("SELECT * FROM Clinics");
        const [specialties] = await connection.execute("SELECT * FROM Specialties");
        const [doctors] = await connection.execute("SELECT * FROM Doctors WHERE doctor_id=?;", [doctor_id]);
        const [DoctorSpecialty] = await connection.execute("SELECT * FROM Doctors_Specialties WHERE doctor_id = ?;",[doctor_id])
        const doctor = doctors[0];
        const specialtyIds = [];
        for (let ds of DoctorSpecialty) {
            specialtyIds.push(ds.specialty_id)
        }

        res.render("doctors/edit", {
            doctor,
            clinics,
            specialties,
            specialtyIds
        })
    });

    app.post("/doctors/edit/:doctor_id", async function (req,res){
        const {doctor_id} = req.params;
        const {name,clinic_id,specialty} = req.body;
        let doctorquery = `UPDATE Doctors SET name=?, clinic_id=? WHERE doctor_id=?`;
        const response = await connection.execute(doctorquery,[name, clinic_id, doctor_id]);
        await connection.execute("DELETE FROM Doctors_Specialties WHERE doctor_id = ?;",[doctor_id])
        let specialtyArray = [];
        if(Array.isArray(specialty))
            specialtyArray = specialty;
        else
            specialtyArray.push(specialty)
        for (let sid of specialtyArray)
        {
            let specialtyquery = `INSERT INTO Doctors_Specialties (doctor_id, specialty_id) VALUES(?, ?)`
            await connection.execute(specialtyquery, [doctor_id, sid])
        }
        res.redirect("/doctors")
    });

    app.get("/patients", async function (req,res){
        const {search} = req.query;
        const [patients] = !search?await connection.execute(`SELECT * FROM Patients;`):await connection.execute(`SELECT * FROM Patients WHERE name LIKE ?;`, [`%${search}%`]);
        res.render("patients/index", {
            patients
        });
    });

    app.get("/patients/create", async function (req,res){
        res.render("patients/create");
    });

    app.post("/patients/create", async function (req,res){
        console.log(req.body);
        const {name,phone,email} = req.body;
        let query = `INSERT INTO Patients (name, phone, email) VALUES(?, ?, ?)`;
        const response = await connection.execute(query,[name, phone, email]);
        res.redirect("/patients");
    });

    app.get("/patients/delete/:patient_id", async function (req,res){
        const {patient_id} = req.params;
        let query = `SELECT * FROM Patients WHERE patient_id = ?;`;
        let [patients] = await connection.execute(query,[patient_id]);
        const patient = patients[0];
        res.render('patients/delete', {
            patient
        })
    });

    app.post("/patients/delete/:patient_id", async function (req,res){
        const {patient_id} = req.params;
        await connection.execute("DELETE FROM Appointments WHERE patient_id = ?;",[patient_id])
        const query = `DELETE FROM Patients WHERE patient_id=?`;
        await connection.execute(query, [patient_id]);
        res.redirect('/patients');
    });

    app.get("/patients/edit/:patient_id", async function (req,res){
        const {patient_id} = req.params;
        const [patients] = await connection.execute("SELECT * FROM Patients WHERE patient_id=?;", [patient_id]);
        const patient = patients[0];

        res.render("patients/edit", {
            patient
        })
    });

    app.post("/patients/edit/:patient_id", async function (req,res){
        const {patient_id} = req.params;
        const {name,phone,email} = req.body;
        let query = `UPDATE Patients SET name=?, phone=?, email=? WHERE patient_id=?`;
        const response = await connection.execute(query,[name, phone, email, patient_id]);
        res.redirect("/patients")
    });

    app.listen(port, function()
    {
        console.log('Server is running');
    });
}

main();