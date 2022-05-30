import { PrismaClient } from "@prisma/client";

const dataPool = new PrismaClient();

export async function LoginStudent(serial: string): Promise<number> {
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
                login_time: {
                    gt: new Date(today.getFullYear(), today.getMonth(), today.getDate())
                }
            }
        },
        select: {
            student_id: true
        }
    })

    //save attendance
    // if (!studentLogs) {
    //     await dataPool.attendace.create({
    //         data: {
    //             student_id: student.student_id,
    //             login_time: new Date(),
    //         },
    //         select: {
    //             attend_id: true
    //         }
    //     })

    //     return 1;
    // }

    await dataPool.attendace.create({
        data: {
            student_id: student.student_id,
            login_time: new Date(),
        },
        select: {
            attend_id: true
        }
    })

    return 1;

    //return 0;
}

export async function LogoutStudent(serial: string): Promise<number> {
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
                login_time: {
                    gt: new Date(today.getFullYear(), today.getMonth(), today.getDate())
                }
            }
        },
        select: {
            student_id: true,
            attend_id: true
        }
    })

    //save attendance
    if (studentLogs) {
        await dataPool.attendace.update({
            where: {
                attend_id: studentLogs.attend_id
            },
            data: {
                logout_time: new Date()
            },
            select: {
                attend_id: true
            }
        })

        return 1;
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
                    section: true,
                    stud_number: true
                }
            },
            login_time: true,
            logout_time: true
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
    stud_number: number;
    first_name: string;
    last_name: string;
    middle_name: string;
    section: string;
    serial: string;
}

export async function CreateStudent(student: StudentRecord) {
    await dataPool.student.create({
        data: {
            first_name: student.first_name,
            middle_name: student.middle_name,
            last_name: student.last_name,
            stud_number: student.stud_number,
            section: student.section,
            serial: student.serial
        }
    })
}