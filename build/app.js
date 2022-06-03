"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const web_push_1 = __importDefault(require("web-push"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const database_1 = require("./database");
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
dotenv_1.default.config();
web_push_1.default.setVapidDetails('mailto:nathan.almazan1004@gmail.com', process.env.PUBLIC_VAPID_KEY, process.env.PRIVATE_VAPID_KEY);
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:4000"],
        methods: ["GET", "POST"]
    }
});
app.post('/login', (req, res) => {
    const serial = req.body.serial;
    (0, database_1.LoginStudent)(serial).then(data => {
        if (data == -1) {
            const payload = JSON.stringify({
                title: "Student Not Found",
                description: "A student with serial number " + serial + " login without a record.",
                icon: "https://res.cloudinary.com/ddpqji6uq/image/upload/v1654247987/graphql_images/404_kcklr7.png"
            });
            (0, database_1.GetAllSubscriptions)().then(subs => {
                subs.forEach(subscription => web_push_1.default.sendNotification({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.public_key,
                        auth: subscription.key_auth
                    }
                }, payload).catch(err => console.log(err.stack)));
            });
            io.sockets.to("common").emit("not_found", serial);
            res.status(404).json({ message: "Student not found." });
        }
        else if (data == 0)
            res.status(400).json({ message: "Student already logged in today." });
        else {
            io.sockets.to("common").emit("update_list");
            res.status(200).json({ message: "Student logged in successfully." });
        }
    }).catch(err => {
        res.status(500).json({ message: "Internal Error: " + err.message });
    });
});
app.get('/logout/:serial', (req, res) => {
    const serial = req.params.serial;
    (0, database_1.LogoutStudent)(serial).then(data => {
        if (data == -1)
            res.status(404).json({ message: "Student not found." });
        else if (data == 0)
            res.status(400).json({ message: "Student did not logged in today." });
        else {
            io.sockets.to("common").emit("update_list");
            res.status(200).json({ message: "Student logged out successfully." });
        }
    }).catch(err => {
        res.status(500).json({ message: "Internal Error: " + err.message });
    });
});
app.get('/logs', (req, res) => {
    (0, database_1.GetAllLogs)().then(logs => {
        res.status(200).json(logs.map(log => (Object.assign(Object.assign({}, log), { student: {
                first_name: log.student.first_name,
                last_name: log.student.last_name,
                middle_name: log.student.middle_name,
                section: log.student.section,
                stud_number: log.student.stud_number.toString()
            } }))));
    })
        .catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
});
app.get('/student/:serial', (req, res) => {
    const serial = req.params.serial;
    (0, database_1.GetStudent)(serial).then(student => {
        if (student == 1)
            res.status(200).json({ message: "Student exists." });
        else
            res.status(400).json({ message: "Student not found." });
    });
});
app.post('/create', (req, res) => {
    const first_name = req.body.first_name;
    const middle_name = req.body.middle_name;
    const last_name = req.body.last_name;
    const stud_number = req.body.stud_number;
    const section = req.body.section;
    const serial = req.body.serial;
    (0, database_1.CreateStudent)({ first_name, middle_name, last_name, stud_number, section, serial })
        .then(() => res.status(200).json({ message: "Student created successfully." }))
        .catch(err => {
        console.log(err.message);
        res.status(500).json({ message: "Internal Error: " + err.message });
    });
});
app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    // const payload = JSON.stringify({ 
    //     title: "Notification Test",
    //     description: "A notification test for Trace Temp App",
    //     icon: "http://image.ibb.co/frY0Fd/tmlogo.png"
    // });
    // console.log(subscription);
    // webpush.sendNotification(subscription, payload).catch(err => console.log((err as Error).stack));
    (0, database_1.SaveSubscription)(subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth).then(() => res.status(201).json({ message: "Resource created successfully." }))
        .catch(err => console.log(err.stack));
});
io.on("connection", (socket) => {
    // Join room
    socket.on("join_room", (room) => {
        socket.join(room);
    });
    // Disconnect
    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    });
});
//express listen
server.listen(port, () => {
    console.log("Listening on port ", port);
}).on("error", (err) => {
    console.log("Error", err.message);
});
//# sourceMappingURL=app.js.map