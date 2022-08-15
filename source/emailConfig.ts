import nodemailer from 'nodemailer';
import hbs from 'handlebars';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const mail = nodemailer.createTransport({
    service: 'Gmail',
    secure: true,
    auth: {
      user: process.env.EMAIL_ACCOUNT,
      pass: process.env.EMAIL_PASSWORD
    }
});

const compile = async (studentName: string, datetime: string, status: string, surname: string) : Promise<string> => {
    const filePath = path.join(__dirname, 'template.hbs');

    const html = fs.readFileSync(filePath, 'utf-8');
    return hbs.compile(html)({ studentName: studentName, logtime: datetime, status: status, surname: surname });
}

async function sendEmail (receiver:string, subject:string, studentName: string, datetime: string, status: string, surname: string) : Promise<boolean> {
    const htmlContent = await compile(studentName, datetime, status, surname); // create html body

    const mailOptions = {
        from: 'Malabon Online Services',
        to: receiver,
        subject: subject,
        html: htmlContent
    };

    //send email
    await mail.sendMail(mailOptions)
    return true;
};

export default sendEmail;