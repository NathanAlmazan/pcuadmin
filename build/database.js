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
exports.DeleteAdmin = exports.UpdateAdmin = exports.CreateAdmin = exports.GetAllAdmin = exports.GetAdminAccount = exports.GetAllStudents = exports.DeleteStudentRecord = exports.UpdateStudentRecord = exports.GetSubscription = exports.SaveSubscription = exports.CreateStudent = exports.SendAttendanceEmail = exports.GetStudent = exports.GetAllLogs = exports.LoginStudent = void 0;
const client_1 = require("@prisma/client");
const emailConfig_1 = __importDefault(require("./emailConfig"));
const dataPool = new client_1.PrismaClient();
function LoginStudent(serial) {
    return __awaiter(this, void 0, void 0, function* () {
        //check if student exist in the database
        const student = yield dataPool.student.findUnique({ where: { serial: serial }, select: { student_id: true } });
        if (!student)
            return -1;
        //check if student already logged in
        const studentLogs = yield dataPool.attendace.findMany({
            where: {
                student: {
                    serial: serial
                }
            },
            select: {
                student_id: true
            }
        });
        //save attendance
        if (studentLogs.length % 2 === 0) {
            yield dataPool.attendace.create({
                data: {
                    student_id: student.student_id,
                    log_type: "IN"
                },
                select: {
                    attend_id: true
                }
            });
            return 1;
        }
        yield dataPool.attendace.create({
            data: {
                student_id: student.student_id,
                log_type: "OUT"
            },
            select: {
                attend_id: true
            }
        });
        return 0;
    });
}
exports.LoginStudent = LoginStudent;
function GetAllLogs() {
    return __awaiter(this, void 0, void 0, function* () {
        const logs = yield dataPool.attendace.findMany({
            select: {
                student: {
                    select: {
                        first_name: true,
                        last_name: true,
                        middle_name: true,
                        section: true,
                        stud_number: true
                    }
                },
                log_datetime: true,
                log_type: true
            },
            orderBy: {
                log_datetime: 'desc'
            }
        });
        return logs;
    });
}
exports.GetAllLogs = GetAllLogs;
function GetStudent(serial) {
    return __awaiter(this, void 0, void 0, function* () {
        const student = yield dataPool.student.findUnique({
            where: {
                serial: serial
            }
        });
        if (student)
            return student;
        return null;
    });
}
exports.GetStudent = GetStudent;
function SendAttendanceEmail(serial, status) {
    return __awaiter(this, void 0, void 0, function* () {
        const student = yield dataPool.student.findUnique({
            where: {
                serial: serial
            }
        });
        if (student) {
            yield (0, emailConfig_1.default)(student.parent_email, `${student.first_name} ${student.last_name} Attendace Report`, `${student.last_name}, ${student.first_name} ${student.middle_name}`, new Date().toLocaleString(), status, student.last_name);
        }
        return null;
    });
}
exports.SendAttendanceEmail = SendAttendanceEmail;
function CreateStudent(student) {
    return __awaiter(this, void 0, void 0, function* () {
        const newStudent = yield dataPool.student.create({
            data: {
                first_name: student.first_name,
                middle_name: student.middle_name,
                last_name: student.last_name,
                stud_number: parseInt(student.stud_number),
                section: student.section,
                serial: student.serial,
                photo_url: student.photo_url,
                parent_email: student.parent_email
            }
        });
        return newStudent;
    });
}
exports.CreateStudent = CreateStudent;
function SaveSubscription(endpoint, pub, auth) {
    return __awaiter(this, void 0, void 0, function* () {
        const subscription = yield dataPool.subscription.findFirst({
            where: {
                AND: {
                    public_key: pub,
                    key_auth: auth
                }
            }
        });
        if (!subscription) {
            yield dataPool.subscription.create({
                data: {
                    endpoint: endpoint,
                    key_auth: auth,
                    public_key: pub
                }
            });
            return 1;
        }
        return -1;
    });
}
exports.SaveSubscription = SaveSubscription;
function GetSubscription() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield dataPool.subscription.findFirst();
    });
}
exports.GetSubscription = GetSubscription;
function UpdateStudentRecord(serial, firstName, middleName, lastName, course) {
    return __awaiter(this, void 0, void 0, function* () {
        const updated = yield dataPool.student.update({
            where: {
                serial: serial,
            },
            data: {
                first_name: firstName,
                last_name: lastName,
                middle_name: middleName,
                section: course
            }
        });
    });
}
exports.UpdateStudentRecord = UpdateStudentRecord;
function DeleteStudentRecord(serial) {
    return __awaiter(this, void 0, void 0, function* () {
        const deleted = yield dataPool.student.delete({
            where: {
                serial: serial
            }
        });
        if (!deleted)
            return -1;
        else
            return deleted.student_id;
    });
}
exports.DeleteStudentRecord = DeleteStudentRecord;
function GetAllStudents() {
    return __awaiter(this, void 0, void 0, function* () {
        const allStudents = yield dataPool.student.findMany({
            orderBy: {
                stud_number: 'desc'
            }
        });
        return allStudents;
    });
}
exports.GetAllStudents = GetAllStudents;
function GetAdminAccount(email) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield dataPool.admin.findUnique({
            where: {
                email: email
            }
        });
    });
}
exports.GetAdminAccount = GetAdminAccount;
function GetAllAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield dataPool.admin.findMany({
            orderBy: {
                last_name: 'asc'
            }
        });
    });
}
exports.GetAllAdmin = GetAllAdmin;
function CreateAdmin(admin) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield dataPool.admin.create({
            data: {
                email: admin.email,
                first_name: admin.firstName,
                last_name: admin.lastName,
                admin: admin.admin
            }
        });
    });
}
exports.CreateAdmin = CreateAdmin;
function UpdateAdmin(firstName, lastName, email, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield dataPool.admin.update({
            where: {
                email: email,
            },
            data: {
                first_name: firstName,
                last_name: lastName,
                admin: admin
            }
        });
    });
}
exports.UpdateAdmin = UpdateAdmin;
function DeleteAdmin(email) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield dataPool.admin.delete({
            where: {
                email: email
            }
        });
    });
}
exports.DeleteAdmin = DeleteAdmin;
//# sourceMappingURL=database.js.map