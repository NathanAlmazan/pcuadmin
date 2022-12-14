import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import NodeRSA from "node-rsa";
import webpush, { PushSubscription } from "web-push";
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';

import { SendAttendanceEmail, LoginStudent, CreateStudent, GetAllLogs, GetStudent, SaveSubscription, GetSubscription, UpdateStudentRecord, DeleteStudentRecord, GetAllStudents, CreateAdmin, UpdateAdmin, DeleteAdmin, GetAdminAccount, GetAllAdmin } from './database';

const app = express();
const port = process.env.PORT || 4000;
dotenv.config();

webpush.setVapidDetails('mailto:nathan.almazan1004@gmail.com', process.env.PUBLIC_VAPID_KEY as string, process.env.PRIVATE_VAPID_KEY as string);

app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:4000", "https://tracetemp.herokuapp.com", "http://34.72.183.89"],
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const rsaKey = new NodeRSA(process.env.RSA_PRIVATE_KEY as string)
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:4000", "https://tracetemp.herokuapp.com", "http://34.72.183.89"],
        methods: ["GET", "POST"]
    }
});

app.get(["/", "/signin", "/reset", "/dashboard/app"], (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
})

app.get("/serial/encrypt/:key", (req, res) => {
    return res.status(200).json({ encrypted: rsaKey.encrypt(req.params.key, 'base64') });
})

app.post('/account/log', (req, res) => {
    let serial: string = req.body.serial;

    try {
        serial = rsaKey.decrypt(serial, 'utf8')
    } catch (err) {
        return res.status(400).json({ message: "Invalid serial" })
    }

    LoginStudent(serial).then(async (data) => {
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
        else if (data == 0) {
            await SendAttendanceEmail(serial, "out")
            io.sockets.to("common").emit("update_list", serial);
            res.status(200).json({ message: "Student logged out successfully.", serial: serial });
        }
        else {
            await SendAttendanceEmail(serial, "in")
            io.sockets.to("common").emit("update_list", serial);
            res.status(200).json({ message: "Student logged in successfully.", serial: serial });
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
                isStaff: log.student.isStaff,
                serial: log.student.serial
            }
        })));
    })
    .catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
})

app.get('/student/:serial', (req, res) => {
    const serial = req.params.serial;

    GetStudent(serial).then(student => {
        if (student) res.status(200).json(student);
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
    const photo_url: string = req.body.photo_url;
    const parent_email: string = req.body.parent_email;

    UpdateStudentRecord(serial, first_name, middle_name, last_name, section, photo_url, parent_email).then(() => res.status(200).json({ message: "Student updated successfully." }))
    .catch(err => res.status(400).json({ message: (err as Error).message }));
})

app.get('/students', (req, res) => {
    GetAllStudents().then(students => res.status(200).json(students))
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
    const isStaff: boolean = req.body.isStaff;
    const photo_url: string = req.body.photo_url;
    const section: string = req.body.section;
    const serial: string = req.body.serial;
    const parent_email: string = req.body.parent_email;
    
    CreateStudent({ first_name, middle_name, last_name, isStaff, section, photo_url, serial, parent_email })
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

app.post('/admin/create', (req, res) => {
    const firstName: string = req.body.first_name;
    const lastName: string = req.body.last_name;
    const email: string = req.body.email;
    const admin: boolean | undefined = req.body.admin;

    CreateAdmin({ firstName, lastName, email, admin }).then(result => {
        res.status(201).json(result);
    }).catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
})

app.post('/admin/update', (req, res) => {
    const firstName: string | undefined = req.body.first_name;
    const lastName: string | undefined = req.body.last_name;
    const email: string | undefined = req.body.email;
    const admin: boolean | undefined = req.body.admin;

    UpdateAdmin(firstName, lastName, email, admin).then(result => {
        res.status(200).json(result);
    }).catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
})

app.post('/admin/delete', (req, res) => {
    const email: string = req.body.email;

    DeleteAdmin(email).then(result => {
        res.status(200).json(result);
    }).catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
})

app.get('/admin/get/:email', (req, res) => {
    const email: string = req.params.email;

    GetAdminAccount(email).then(result => {
        res.status(200).json(result);
    }).catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
})

app.get('/admin/all', (req, res) => {
    GetAllAdmin().then(result => {
        res.status(200).json(result);
    }).catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
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



