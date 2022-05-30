import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import { LoginStudent, LogoutStudent, CreateStudent, GetAllLogs } from './database';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/login', (req, res) => {
    const serial: string = req.body.serial;

    LoginStudent(serial).then(data => {
        if (data == -1) res.status(404).json({ message: "Student not found." });
        else if (data == 0) res.status(400).json({ message: "Student already logged in today." })
        else res.status(200).json({ message: "Student logged in successfully." });
    }).catch(err => {
        res.status(500).json({ message: "Internal Error: " + err.message });
    })
})

app.post('/logout', (req, res) => {
    const serial: string = req.body.serial;

    LogoutStudent(serial).then(data => {
        if (data == -1) res.status(404).json({ message: "Student not found." });
        else if (data == 0) res.status(400).json({ message: "Student did not logged in today." })
        else res.status(200).json({ message: "Student logged out successfully." });
    }).catch(err => {
        res.status(500).json({ message: "Internal Error: " + err.message });
    })
})

app.get('/logs', (req, res) => {
    GetAllLogs().then(logs => res.status(200).json(logs))
    .catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
})

app.post('/create', (req, res) => {
    const first_name: string = req.body.first_name;
    const middle_name: string = req.body.middle_name;
    const last_name: string = req.body.last_name;
    const stud_number: number = req.body.stud_number;
    const section: string = req.body.section;
    const serial: string = req.body.serial;
    
    CreateStudent({ first_name, middle_name, last_name, stud_number, section, serial })
    .then(() => res.status(200).json({ message: "Student created successfully." }))
    .catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
})

//express listen
app.listen(port, () => {
    console.log("Listening on port ",  port);
}).on("error", (err:Error) => {
    console.log("Error", err.message);
});



