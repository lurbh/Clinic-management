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
        res.send('Hello World');
    });

    app.get('/clinic', async function(req,res)
    {
        let [clinics] = await connection.execute(`SELECT * FROM Clinic;`);
        res.render('clinics/index', {
            clinics
        });
    });

    app.get('/clinic/schedule/:schedule_id', async function(req,res)
    {
        const {schedule_id} = req.params;
        const [clinics] = await connection.execute(`SELECT * FROM Clinic INNER JOIN Schedule 
            ON Clinic.schedule_id = Schedule.schedule_id WHERE Clinic.schedule_id=?;`, [schedule_id]);
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

    app.get('/clinic/create', async function(req,res)
    {
        res.render('clinics/create');
    });

    app.post('/clinic/create', async function(req,res)
    {
        const {name,block,road,unit,postal_code,phone,email} = req.body;
        const {weekday_start,weekday_end,saturday_start,saturday_end,sunday_start,sunday_end,public_holiday_start,public_holiday_end} = req.body;
        const Schedulequery = `INSERT INTO Schedule (weekday_start, weekday_end, saturday_start, saturday_end, sunday_start, sunday_end, public_holiday_start, public_holiday_end) 
        VALUES(?, ?, ?, ?, ?, ?, ?, ?);`
        const [response] = await connection.execute(Schedulequery, [weekday_start, weekday_end, saturday_start, saturday_end, sunday_start, sunday_end, public_holiday_start, public_holiday_end]);
        insertedID = response.insertId;
        const clinicquery = `INSERT INTO Clinic (name, block, road, unit, postal_code, phone, email, schedule_id) 
        VALUES(?, ?, ?, ?, ?, ?, ?, ?);`;
        await connection.execute(clinicquery,[name,block,road,unit,postal_code,phone,email,insertedID]);
        res.redirect('/clinic');
    });

    app.get('/clinic/edit/:clinic_id', async function(req,res)
    {
        const {clinic_id} = req.params;
        const [clinics] = await connection.execute(`SELECT * FROM Clinic INNER JOIN Schedule 
            ON Clinic.schedule_id = Schedule.schedule_id WHERE Clinic.clinic_id=?;`, [clinic_id]); 
        const clinic = clinics[0];
        res.render('clinics/edit',{
            clinic
        });
    });

    app.post('/clinic/edit/:clinic_id', async function(req,res)
    {
        const {clinic_id} = req.params;
        const {name,block,road,unit,postal_code,phone,email} = req.body;
        const {weekday_start,weekday_end,saturday_start,saturday_end,sunday_start,sunday_end,public_holiday_start,public_holiday_end} = req.body;
        const [clinics] = await connection.execute(`SELECT * FROM Clinic INNER JOIN Schedule 
            ON Clinic.schedule_id = Schedule.schedule_id WHERE Clinic.clinic_id=?;`, [clinic_id]); 
        const clinic = clinics[0];
        const schedule_id = clinic.schedule_id;
        const Schedulequery = `UPDATE Schedule SET
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
        const clinicquery = `UPDATE Clinic SET
        name=?,
        block=?,
        road=?,
        unit=?,
        postal_code=?,
        phone=?,
        email=?
        WHERE clinic_id=?;`;
        await connection.execute(clinicquery,[name,block,road,unit,postal_code,phone,email,clinic_id]);
        res.redirect('/clinic');
    });

    app.get('/clinic/delete/:clinic_id', async function (req,res) 
    {
        const clinic_id = req.params.clinic_id;
        let query = `SELECT * FROM Clinic WHERE clinic_id = ?;`;
        let [clinics] = await connection.execute(query,[clinic_id]);
        const clinicToDelete = clinics[0];
        res.render('clinics/delete', {
            'clinic' : clinicToDelete
        })
    });

    app.post('/clinic/delete/:clinic_id', async function (req,res) 
    {
        const clinic_id = req.params.clinic_id;

        // check if the clinic_id in a relationship with an Doctor
        const checkDoctorQuery = `SELECT * FROM Doctor WHERE clinic_id = ?`;
        const [involved] = await connection.execute(checkDoctorQuery,[clinic_id]);
        if (involved.length > 0) {
            res.send("Unable to delete because the Clinic as doctor is still attached to the clinic");
            return;
        }

        let query = `DELETE FROM Clinic WHERE clinic_id = ?;`;
        await connection.execute(query,[clinic_id]);
        res.redirect('/clinic');
    });

    app.get("/appointments", async function (req,res){
        const [appointments] = await connection.execute(`SELECT appointment_id,Patient.name AS P_name, Doctor.name AS D_name, Appointment_Type.name AS apt_name,
        DATE(datetime) AS date,TIME(datetime) AS time FROM Appointment 
        INNER JOIN Patient ON Appointment.patient_id = Patient.patient_id
        INNER JOIN Doctor ON Appointment.doctor_id = Doctor.doctor_id
        INNER JOIN Appointment_Type ON Appointment.appt_type_id = Appointment_Type.appt_type_id;`);
        for(const apt of appointments)
        {
            apt.time = setAMPMTime(apt.time);
            apt.date = apt.date.toISOString().substring(0, 10);
        }
        res.render("appointments/index", {
            appointments
        });
    });

    app.get("/appointments/create", async function (req,res){
        const [patients] = await connection.execute(`SELECT * FROM Patient;`);
        const [doctors] = await connection.execute(`SELECT * FROM Doctor;`);
        const [appt_types] = await connection.execute(`SELECT * FROM Appointment_Type;`);

        res.render("appointments/create", {
            patients,
            doctors,
            appt_types
        })
    });

    app.post("/appointments/create", async function (req,res){
        const {patient_id,doctor_id,appt_type_id,date,time} = req.body;
        const datetime = date + " " + time;
        const query = `INSERT INTO Appointment (datetime, patient_id, doctor_id, appt_type_id) VALUES(?,?,?,?)`
        const response = await connection.execute(query,[datetime,patient_id,doctor_id,appt_type_id]);
        res.redirect('/appointments');
    });

    app.get("/appointments/edit/:appointment_id", async function (req,res){
        const {appointment_id} = req.params;
        const [patients] = await connection.execute(`SELECT * FROM Patient;`);
        const [doctors] = await connection.execute(`SELECT * FROM Doctor;`);
        const [appt_types] = await connection.execute(`SELECT * FROM Appointment_Type;`);
        const [appointments] = await connection.execute(`SELECT *, DATE(datetime) AS date,TIME(datetime) AS time FROM Appointment 
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
        const query = `UPDATE Appointment SET 
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
        const [appointments] = await connection.execute(`SELECT appointment_id,Patient.name AS P_name, Doctor.name AS D_name, Appointment_Type.name AS apt_name,
        DATE(datetime) AS date,TIME(datetime) AS time FROM Appointment 
        INNER JOIN Patient ON Appointment.patient_id = Patient.patient_id
        INNER JOIN Doctor ON Appointment.doctor_id = Doctor.doctor_id
        INNER JOIN Appointment_Type ON Appointment.appt_type_id = Appointment_Type.appt_type_id 
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
        const query = `DELETE FROM Appointment WHERE appointment_id=?`;
        const response = await connection.execute(query, [appointment_id]);
        res.redirect('/appointments');
    });

    app.listen(port, function()
    {
        console.log('Server is running');
    });
}

main();