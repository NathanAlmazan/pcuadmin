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
const nodemailer_1 = __importDefault(require("nodemailer"));
const handlebars_1 = __importDefault(require("handlebars"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mail = nodemailer_1.default.createTransport({
    service: 'Gmail',
    secure: true,
    auth: {
        user: process.env.EMAIL_ACCOUNT,
        pass: process.env.EMAIL_PASSWORD
    }
});
const compile = (studentName, datetime, status, surname) => __awaiter(void 0, void 0, void 0, function* () {
    const filePath = path_1.default.join(__dirname, 'template.hbs');
    const html = fs_1.default.readFileSync(filePath, 'utf-8');
    return handlebars_1.default.compile(html)({ studentName: studentName, logtime: datetime, status: status, surname: surname });
});
function sendEmail(receiver, subject, studentName, datetime, status, surname) {
    return __awaiter(this, void 0, void 0, function* () {
        const htmlContent = yield compile(studentName, datetime, status, surname); // create html body
        const mailOptions = {
            from: 'Malabon Online Services',
            to: receiver,
            subject: subject,
            html: htmlContent
        };
        //send email
        yield mail.sendMail(mailOptions);
        return true;
    });
}
;
exports.default = sendEmail;
//# sourceMappingURL=emailConfig.js.map