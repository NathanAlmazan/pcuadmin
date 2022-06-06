import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import webpush, { PushSubscription } from "web-push";
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';

import { LoginStudent, LogoutStudent, CreateStudent, GetAllLogs, GetStudent, SaveSubscription, GetSubscription, UpdateStudentRecord, DeleteStudentRecord, GetAllStudents } from './database';

const app = express();
const port = process.env.PORT || 4000;
dotenv.config();

webpush.setVapidDetails('mailto:nathan.almazan1004@gmail.com', process.env.PUBLIC_VAPID_KEY as string, process.env.PRIVATE_VAPID_KEY as string);

app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:4000", "https://tracetemp.herokuapp.com"],
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:4000", "https://tracetemp.herokuapp.com"],
        methods: ["GET", "POST"]
    }
});

app.get(["/", "/signin", "/reset", "/dashboard/app"], (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
})

app.post('/login', (req, res) => {
    const serial: string = req.body.serial;
    const temp: number | undefined = req.body.temp;

    LoginStudent(serial, temp).then(data => {
        if (data == -1) {
            const payload = JSON.stringify({
                title: "Student Not Found",
                description: "A student with serial number " + serial + " login without a record.",
                icon: "https://res.cloudinary.com/ddpqji6uq/image/upload/v1654247987/graphql_images/404_kcklr7.png"

            });

            GetSubscription().then(subscription => {
                if (subscription) webpush.sendNotification({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.public_key,
                        auth: subscription.key_auth
                    }
                    }, payload)})
                .catch(err => console.log((err as Error).stack));
            

            io.sockets.to("common").emit("not_found", serial);
            res.status(404).json({ message: "Student not found." });
        }
        else if (data == 0) res.status(400).json({ message: "Student already logged in today." })
        else {
            io.sockets.to("common").emit("update_list");
            res.status(200).json({ message: "Student logged in successfully." });
        }
    }).catch(err => {
        res.status(500).json({ message: "Internal Error: " + err.message });
    })
})

app.get('/logout/:serial', (req, res) => {
    const serial: string = req.params.serial;

    const array = serial.slice(1).split("-");
    const final = `${parseInt(array[0])}-${parseInt(array[1])}-${parseInt(array[2])}-${parseInt(array[3])}`;

    LogoutStudent(final).then(data => {
        if (data == -1) res.status(404).json({ message: "Student not found." });
        else if (data == 0) res.status(400).json({ message: "Student did not logged in today." })
        else {
            io.sockets.to("common").emit("update_list");
            res.status(200).json({ message: "Student logged out successfully." });
        }
    }).catch(err => {
        res.status(500).json({ message: "Internal Error: " + err.message });
    })
})

app.get('/logs', (req, res) => {
    GetAllLogs().then(logs => {

        res.status(200).json(logs.map(log => ({
            ...log,
            student: {
                first_name: log.student.first_name,
                last_name: log.student.last_name,
                middle_name: log.student.middle_name,
                section: log.student.section,
                stud_number: log.student.stud_number.toString()
            }
        })));
    })
    .catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
})

app.get('/student/:serial', (req, res) => {
    const serial = req.params.serial;

    GetStudent(serial).then(student => {
        if (student == 1) res.status(200).json({ message: "Student exists." });
        else res.status(400).json({ message: "Student not found." });
    })
    .catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
})

app.post('/students/update', (req, res) => {
    const first_name: string = req.body.first_name;
    const middle_name: string = req.body.middle_name;
    const last_name: string = req.body.last_name;
    const section: string = req.body.section;
    const serial: string = req.body.serial;

    UpdateStudentRecord(serial, first_name, middle_name, last_name, section).then(() => res.status(200).json({ message: "Student updated successfully." }))
    .catch(err => res.status(400).json({ message: (err as Error).message }));
})

app.get('/students', (req, res) => {
    GetAllStudents().then(students => res.status(200).json(students.map(stud => ({
        ...stud,
        stud_number: stud.stud_number.toString()
    }))))
    .catch(err => res.status(400).json({ message: (err as Error).message }));
})

app.post('/students/delete', (req, res) => {
    const serial: string = req.body.serial;

    DeleteStudentRecord(serial).then(result => {
        if (result > 0) res.status(200).json({ message: "Deleted student successfully." })
        else res.status(404).json({ message: "Student not found." })
    })
    .catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
})

app.post('/create', (req, res) => {
    const first_name: string = req.body.first_name;
    const middle_name: string = req.body.middle_name;
    const last_name: string = req.body.last_name;
    const stud_number: string = req.body.stud_number;
    const section: string = req.body.section;
    const serial: string = req.body.serial;
    
    CreateStudent({ first_name, middle_name, last_name, stud_number, section, serial })
    .then(() => res.status(200).json({ message: "Student created successfully." }))
    .catch(err => {
        console.log(err.message);
        res.status(500).json({ message: "Internal Error: " + err.message })
    });
})

app.post('/subscribe', (req, res) => {
    const subscription: PushSubscription = req.body;

    // const payload = JSON.stringify({ 
    //     title: "Notification Test",
    //     description: "A notification test for Trace Temp App",
    //     icon: "http://image.ibb.co/frY0Fd/tmlogo.png"

    // });

    // console.log(subscription);
    // webpush.sendNotification(subscription, payload).catch(err => console.log((err as Error).stack));

    SaveSubscription(subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth).then(() => res.status(201).json({ message: "Resource created successfully." }))
    .catch(err => console.log((err as Error).stack));
})

io.on("connection", (socket) => {
    // Join room
    socket.on("join_room", (room: string) => {
        socket.join(room);
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    });
})

//express listen
server.listen(port, () => {
    console.log("Listening on port ",  port);
}).on("error", (err:Error) => {
    console.log("Error", err.message);
});



