"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./database");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.post('/login', (req, res) => {
    const serial = req.body.serial;
    (0, database_1.LoginStudent)(serial).then(data => {
        if (data == -1)
            res.status(404).json({ message: "Student not found." });
        else if (data == 0)
            res.status(400).json({ message: "Student already logged in today." });
        else
            res.status(200).json({ message: "Student logged in successfully." });
    }).catch(err => {
        res.status(500).json({ message: "Internal Error: " + err.message });
    });
});
app.post('/logout', (req, res) => {
    const serial = req.body.serial;
    (0, database_1.LogoutStudent)(serial).then(data => {
        if (data == -1)
            res.status(404).json({ message: "Student not found." });
        else if (data == 0)
            res.status(400).json({ message: "Student did not logged in today." });
        else
            res.status(200).json({ message: "Student logged out successfully." });
    }).catch(err => {
        res.status(500).json({ message: "Internal Error: " + err.message });
    });
});
app.get('/logs', (req, res) => {
    (0, database_1.GetAllLogs)().then(logs => {
        let logData = [];
        logs.forEach(log => logData.push({
            login_time: log.login_time,
            logout_time: log.logout_time,
            student: {
                first_name: log.student.first_name,
                last_name: log.student.last_name,
                section: log.student.section,
                stud_number: log.student.stud_number.toString()
            }
        }));
        res.status(200).json(logData);
    })
        .catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
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
        .catch(err => res.status(500).json({ message: "Internal Error: " + err.message }));
});
//express listen
app.listen(port, () => {
    console.log("Listening on port ", port);
}).on("error", (err) => {
    console.log("Error", err.message);
});
//# sourceMappingURL=app.js.map