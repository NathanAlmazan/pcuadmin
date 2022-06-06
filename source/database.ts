import { PrismaClient } from "@prisma/client";

const dataPool = new PrismaClient();

export async function LoginStudent(serial: string, temperature: number | undefined): Promise<number> {
    const today = new Date();

    //check if student exist in the database
    const student = await dataPool.student.findUnique({ where: { serial: serial }, select: { student_id: true }});

    if (!student) return -1;
    
    //check if student already logged in
    const studentLogs = await dataPool.attendace.findFirst({
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
    })

    //save attendance
    if (!studentLogs) {
        await dataPool.attendace.create({
            data: {
                student_id: student.student_id,
                login_time: new Date(),
                temperature: temperature
            },
            select: {
                attend_id: true
            }
        })

        return 1;
    }

    return 0;
}

export async function LogoutStudent(serial: string): Promise<number> {
    //check if student exist in the database
    const student = await dataPool.student.findUnique({ where: { serial: serial }, select: { student_id: true }});

    if (!student) return -1;
    
    //check if student already logged in
    const studentLogs = await dataPool.attendace.findFirst({
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
    })

    //save attendance
    if (studentLogs) {
        const data = await dataPool.attendace.update({
            where: {
                attend_id: studentLogs.attend_id
            },
            data: {
                logout_time: new Date()
            }
        })

        return data.student_id;
    }

    return 0;
}

export async function GetAllLogs() {
    const logs = await dataPool.attendace.findMany({
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
            logout_time: true,
            temperature: true
        },
        orderBy: {
            login_time: 'desc'
        }
    })

    return logs
}

export async function GetStudent(serial: string) {
    const student = await dataPool.student.findUnique({
        where: {
            serial: serial
        },
        select: {
            student_id: true
        }
    })

    if (student) return 1;
    return -1;
}

type StudentRecord = {
    stud_number: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    section: string;
    serial: string;
}

export async function CreateStudent(student: StudentRecord) {
    const newStudent = await dataPool.student.create({
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
}

export async function SaveSubscription(endpoint: string, pub: string, auth: string) {
    const subscription = await dataPool.subscription.findFirst({
        where: {
            AND: {
                public_key: pub,
                key_auth: auth
            }
        }
    })

    if (!subscription) {
        await dataPool.subscription.create({
            data: {
                endpoint: endpoint,
                key_auth: auth,
                public_key: pub
            }
        })

        return 1;
    }

    return -1;
}

export async function GetSubscription() {
    return await dataPool.subscription.findFirst();
}

export async function UpdateStudentRecord(serial: string, firstName: string, middleName: string, lastName: string, course: string) {
    const updated = await dataPool.student.update({
        where: {
            serial: serial,
        },
        data: {
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            section: course
        }
    })
}

export async function DeleteStudentRecord(serial: string) {
    const deleted = await dataPool.student.delete({
        where: {
            serial: serial
        }
    })

    if (!deleted) return -1;
    else return deleted.student_id;
}

export async function GetAllStudents() {
    const allStudents = await dataPool.student.findMany({
        orderBy: {
            stud_number: 'desc'
        }
    });

    return allStudents;
}