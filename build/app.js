"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const database_1 = require("./database");
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
dotenv_1.default.config();
web_push_1.default.setVapidDetails('mailto:nathan.almazan1004@gmail.com', process.env.PUBLIC_VAPID_KEY, process.env.PRIVATE_VAPID_KEY);
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000", "http://localhost:4000", "https://tracetemp.herokuapp.com", "http://34.72.183.89"],
}));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:4000", "https://tracetemp.herokuapp.com", "http://34.72.183.89"],
        methods: ["GET", "POST"]
    }
});
app.get(["/", "/signin", "/reset", "/dashboard/app"], (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "..", "public", "index.html"));
});
app.get('/log/:serial', (req, res) => {
    const serial = req.params.serial;
    (0, database_1.LoginStudent)(serial).then((data) => __awaiter(void 0, void 0, void 0, function* () {
        if (data == -1) {
            const payload = JSON.stringify({
                title: "Student Not Found",
                description: "A student with serial number " + serial + " login without a record.",
                icon: "https://res.cloudinary.com/ddpqji6uq/image/upload/v1654247987/graphql_images/404_kcklr7.png"
            });
            (0, database_1.GetSubscription)().then(subscription => {
                if (subscription)
                    web_push_1.default.sendNotification({
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: subscription.public_key,
                            auth: subscription.key_auth
                        }
                    }, payload);
            })
                .catch(err => console.log(err.stack));
            io.sockets.to("common").emit("not_found", serial);
            res.status(404).json({ message: "Student not found." });
        }
        else if (data == 0) {
            yield (0, database_1.SendAttendanceEmail)(serial, "out");
            io.sockets.to("common").emit("update_list", serial);
            res.status(200).json({ message: "Student logged out successfully." });
        }
        else {
            yield (0, database_1.SendAttendanceEmail)(serial, "in");
            io.sockets.to("common").emit("update_list", serial);
            res.status(200).json({ message: "Student logged in successfully." });
        }
    })).catch(err => {
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
        if (student) {
            const updatedStudent = Object.assign(Object.assign({}, student), { stud_number: parseInt(student.stud_number.toString()) });
            res.status(200).json(updatedStudent);
        }
        else
            res.status(400).json({ message: "Student not found." });
    })
        .catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
});
app.post('/students/update', (req, res) => {
    const first_name = req.body.first_name;
    const middle_name = req.body.middle_name;
    const last_name = req.body.last_name;
    const section = req.body.section;
    const serial = req.body.serial;
    const photo_url = req.body.photo_url;
    const parent_email = req.body.parent_email;
    (0, database_1.UpdateStudentRecord)(serial, first_name, middle_name, last_name, section, photo_url, parent_email).then(() => res.status(200).json({ message: "Student updated successfully." }))
        .catch(err => res.status(400).json({ message: err.message }));
});
app.get('/students', (req, res) => {
    (0, database_1.GetAllStudents)().then(students => res.status(200).json(students.map(stud => (Object.assign(Object.assign({}, stud), { stud_number: stud.stud_number.toString() })))))
        .catch(err => res.status(400).json({ message: err.message }));
});
app.post('/students/delete', (req, res) => {
    const serial = req.body.serial;
    (0, database_1.DeleteStudentRecord)(serial).then(result => {
        if (result > 0)
            res.status(200).json({ message: "Deleted student successfully." });
        else
            res.status(404).json({ message: "Student not found." });
    })
        .catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
});
app.post('/create', (req, res) => {
    const first_name = req.body.first_name;
    const middle_name = req.body.middle_name;
    const last_name = req.body.last_name;
    const stud_number = req.body.stud_number;
    const photo_url = req.body.photo_url;
    const section = req.body.section;
    const serial = req.body.serial;
    const parent_email = req.body.parent_email;
    (0, database_1.CreateStudent)({ first_name, middle_name, last_name, stud_number, section, photo_url, serial, parent_email })
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
app.post('/admin/create', (req, res) => {
    const firstName = req.body.first_name;
    const lastName = req.body.last_name;
    const email = req.body.email;
    const admin = req.body.admin;
    (0, database_1.CreateAdmin)({ firstName, lastName, email, admin }).then(result => {
        res.status(201).json(result);
    }).catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
});
app.post('/admin/update', (req, res) => {
    const firstName = req.body.first_name;
    const lastName = req.body.last_name;
    const email = req.body.email;
    const admin = req.body.admin;
    (0, database_1.UpdateAdmin)(firstName, lastName, email, admin).then(result => {
        res.status(200).json(result);
    }).catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
});
app.post('/admin/delete', (req, res) => {
    const email = req.body.email;
    (0, database_1.DeleteAdmin)(email).then(result => {
        res.status(200).json(result);
    }).catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
});
app.get('/admin/get/:email', (req, res) => {
    const email = req.params.email;
    (0, database_1.GetAdminAccount)(email).then(result => {
        res.status(200).json(result);
    }).catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
});
app.get('/admin/all', (req, res) => {
    (0, database_1.GetAllAdmin)().then(result => {
        res.status(200).json(result);
    }).catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
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