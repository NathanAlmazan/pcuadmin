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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAllSubscriptions = exports.SaveSubscription = exports.CreateStudent = exports.GetStudent = exports.GetAllLogs = exports.LogoutStudent = exports.LoginStudent = void 0;
const client_1 = require("@prisma/client");
const dataPool = new client_1.PrismaClient();
function LoginStudent(serial) {
    return __awaiter(this, void 0, void 0, function* () {
        const today = new Date();
        //check if student exist in the database
        const student = yield dataPool.student.findUnique({ where: { serial: serial }, select: { student_id: true } });
        if (!student)
            return -1;
        //check if student already logged in
        const studentLogs = yield dataPool.attendace.findFirst({
            where: {
                AND: {
                    student: {
                        serial: serial
                    },
                    login_time: today
                }
            },
            select: {
                student_id: true
            }
        });
        //save attendance
        if (!studentLogs) {
            yield dataPool.attendace.create({
                data: {
                    student_id: student.student_id,
                    login_time: new Date(),
                },
                select: {
                    attend_id: true
                }
            });
            return 1;
        }
        return 0;
    });
}
exports.LoginStudent = LoginStudent;
function LogoutStudent(serial) {
    return __awaiter(this, void 0, void 0, function* () {
        //check if student exist in the database
        const student = yield dataPool.student.findUnique({ where: { serial: serial }, select: { student_id: true } });
        if (!student)
            return -1;
        //check if student already logged in
        const studentLogs = yield dataPool.attendace.findFirst({
            where: {
                AND: {
                    student: {
                        serial: serial
                    },
                    logout_time: null
                }
            },
            select: {
                student_id: true,
                attend_id: true
            }
        });
        //save attendance
        if (studentLogs) {
            const data = yield dataPool.attendace.update({
                where: {
                    attend_id: studentLogs.attend_id
                },
                data: {
                    logout_time: new Date()
                }
            });
            return data.student_id;
        }
        return 0;
    });
}
exports.LogoutStudent = LogoutStudent;
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
                login_time: true,
                logout_time: true
            },
            orderBy: {
                login_time: 'desc'
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
            },
            select: {
                student_id: true
            }
        });
        if (student)
            return 1;
        return -1;
    });
}
exports.GetStudent = GetStudent;
function CreateStudent(student) {
    return __awaiter(this, void 0, void 0, function* () {
        const newStudent = yield dataPool.student.create({
            data: {
                first_name: student.first_name,
                middle_name: student.middle_name,
                last_name: student.last_name,
                stud_number: parseInt(student.stud_number),
                section: student.section,
                serial: student.serial
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
function GetAllSubscriptions() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield dataPool.subscription.findMany();
    });
}
exports.GetAllSubscriptions = GetAllSubscriptions;
//# sourceMappingURL=database.js.map