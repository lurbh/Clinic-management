const express = require('express');
const hbs = require('hbs');
const waxOn = require('wax-on');
const {createConnection} = require('mysql2/promise');
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
    console.log(time);
    let timeofday = " am";
    const stime = time.split(":");
    if(stime[0] >= 12)
    {
        timeofday = " pm"
        if(stime[0] != 12)
            stime[0] -= 12;
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
        // const 
        res.render('clinics/edit');
    });

    app.listen(port, function()
    {
        console.log('Server is running');
    });
}

main();