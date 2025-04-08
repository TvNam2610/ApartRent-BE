// common/log.js
import fs from 'fs';
import { config } from '../config.js';  // Import config từ config.js
const filePath = config.logFilePath;

const logHelper = {};

logHelper.writeLog = function (funcName, ex) {
    let time = new Date().toLocaleString();
    let date = new Date().toLocaleDateString("vi-VN").replace(/\//g, "_");
    let fileName = filePath + date + ".txt";
    console.log(fileName);
    try {
        fs.appendFile(fileName, time + ": " + funcName + "\n" + ex.message + "\n" + "---------------------------------------------" + "\n", () => {});
    }
    catch (ex) {
        console.log(ex);
    }
};

logHelper.writeLogMessage = function (funcName, message) {
    let time = new Date().toLocaleString();
    let date = new Date().toLocaleDateString("vi-VN").replace(/\//g, "_");
    let fileName = filePath + date + ".txt";
    console.log(fileName);
    try {
        fs.appendFile(fileName, time + ": " + funcName + "\n" + message + "\n" + "---------------------------------------------" + "\n", () => {});
    }
    catch (ex) {
        console.log(ex);
    }
};

export default logHelper;
