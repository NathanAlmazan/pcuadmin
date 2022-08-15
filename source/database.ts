import { PrismaClient } from "@prisma/client";

const dataPool = new PrismaClient();

export async function LoginStudent(serial: string): Promise<number> {

    //check if student exist in the database
    const student = await dataPool.student.findUnique({ where: { serial: serial }, select: { student_id: true }});

    if (!student) return -1;
    
    //check if student already logged in
    const studentLogs = await dataPool.attendace.findMany({
        where: {
            student: {
                serial: serial
            }
        },
        select: {
            student_id: true
        }
    })

    //save attendance
    if (studentLogs.length % 2 === 0) {
        await dataPool.attendace.create({
            data: {
                student_id: student.student_id,
                log_type: "IN"
            },
            select: {
                attend_id: true
            }
        })

        return 1;
    }

    await dataPool.attendace.create({
        data: {
            student_id: student.student_id,
            log_type: "OUT"
        },
        select: {
            attend_id: true
        }
    })

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
            log_datetime: true,
            log_type: true
        },
        orderBy: {
            log_datetime: 'desc'
        }
    })

    return logs
}

export async function GetStudent(serial: string) {
    const student = await dataPool.student.findUnique({
        where: {
            serial: serial
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
    photo_url: string;
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
            serial: student.serial,
            photo_url: student.photo_url
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

export async function GetAdminAccount(email: string) {
    return await dataPool.admin.findUnique({
        where: {
            email: email
        }
    });
}

export async function GetAllAdmin() {
    return await dataPool.admin.findMany({
        orderBy: {
            last_name: 'asc'
        }
    });
}

type AdminAccount = {
    firstName: string;
    lastName: string;
    email: string;
    admin?: boolean;
}

export async function CreateAdmin(admin: AdminAccount) {
    return await dataPool.admin.create({
        data: {
            email: admin.email,
            first_name: admin.firstName,
            last_name: admin.lastName,
            admin: admin.admin
        }
    });
}

export async function UpdateAdmin(firstName: string | undefined, lastName: string | undefined, email: string | undefined, admin: boolean | undefined) {
    return await dataPool.admin.update({
        where: {
            email: email,
        },
        data: {
            first_name: firstName,
            last_name: lastName,
            admin: admin
        }
    });
}

export async function DeleteAdmin(email: string) {
    return await dataPool.admin.delete({
        where: {
            email: email
        }
    });
}