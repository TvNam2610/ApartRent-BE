import numpy as np
import pandas as pd
from sqlalchemy import create_engine,text
import os
from datetime import datetime
from datetime import timedelta

class updateTimesheet():
    def __init__(self):
       pass
        
    def connectToServer(self):
        try:
            engine = create_engine("mysql+mysqlconnector://i_admin:Hy$2020@10.144.12.93/pr2k")
        except :
            print(". . . can't connect to server. . .")
            return False
        return engine

    def getDataInput(self,updateFile,flags):
        listmonth = ['01. JAN','02. FEB','03. MAR',
                        '04. APR','05. MAY','06. JUN',
                        '07. JUL','08. AUG','09. SEP',
                        '10. OCT','11. NOV','12. DEC']
        fileFlags = pd.read_csv(flags)
        lastfile = str(fileFlags.iloc[len(fileFlags)-1,0])
        print(lastfile)
        date = lastfile[-2:]
        month = lastfile[4:6]
        year = lastfile[0:4]
        if int(month) == 12 and int(date) > 25:
            year = int(year) +1
            year = str(year)
        for mon in range(len(listmonth)):           
            filename = "\\\\hysfpsv\\HR\\HR (SHARED)\\4. ANNUAL LEAVE (AL)\\TRACKING TIMESHEET\\"+year+"\\"+listmonth[mon]+"\\"+updateFile+"\\TS-"+lastfile+".xlsx"
            filename1 = "\\\\hysfpsv\\HR\\HR (SHARED)\\4. ANNUAL LEAVE (AL)\\TRACKING TIMESHEET\\"+year+"\\"+listmonth[mon]+"\\"+updateFile+"\\TS-"+lastfile+".xlsb"
            if os.path.exists(filename):
                print(filename)
                timesheetInput = pd.read_excel(filename)
                timesheetInput["STATUS"]=updateFile
                timesheetInput = timesheetInput[timesheetInput.EMPLOYEETYPECODE == "DR"].reset_index()
                if len(timesheetInput) > 1:
                    return timesheetInput
                else:
                    print('File no data')
                    return True
            elif os.path.exists(filename1):
                print(filename1)
                timesheetInput = pd.read_excel(filename1,engine='pyxlsb')
                timesheetInput["STATUS"]=updateFile
                timesheetInput = timesheetInput[timesheetInput.EMPLOYEETYPECODE == "DR"].reset_index()
                if len(timesheetInput) > 1:
                    return timesheetInput
                else:
                    print('File no data')
                    return True
        else:
            print("File not exist ...")
            return False

    def ajustingData(self,timesheetInput):
        if type(timesheetInput) != bool:
            iDate = timesheetInput.TSDATE.astype(str).apply(lambda date: date[6:10]+date[3:5]+date[0:2])
            timesheetInput["ID"] = timesheetInput.EMPID.astype(str).apply(lambda id:id[1:6])+iDate
            timesheetInput["ID5"] = timesheetInput.EMPID.astype(str).apply(lambda id:id[1:6])
            timesheetInput["EMPLOYEE"] = timesheetInput.EMPID.astype(str)
            timesheetInput["DEPT"] = timesheetInput.DEPARTMENTCODE
            timesheetInput["EMP_TYPE"] = timesheetInput.EMPLOYEETYPECODE
            timesheetInput["SHIFT"] = timesheetInput.SHIFTCODE
            timesheetInput["DATE"] = iDate
            timesheetInput["TIME_IN"] = timesheetInput.TIMEIN
            timesheetInput["TIME_OUT"] = timesheetInput.TIMEOUT
            # timesheetInput["REG_HRS"] = timesheetInput.apply(lambda row: max(0,7- row["ABSENTHRS"]) - row["LATE"] - row["SOON"] 
            #                                                    if "TS" in str(row["SHIFTCODE"]) else (0 if row["OT20"] +row["OT30"] > 0
            #                                                    else 8- row["ABSENTHRS"]- row["LATE"] - row["SOON"]),axis=1)
            timesheetInput["REG_HRS"] = timesheetInput.apply(lambda row: max(0,0 if row["OT20"] +row["OT30"] +row["OT20N"] +row["OT30N"] > 0 else
                                                                            (((8-row["ABSENTHRS"]) if row["ABSENTHRS"]>0 
                                                                            else (7 if "TS" in str(row["SHIFTCODE"]) else ( 6 if "VS" in str(row["SHIFTCODE"]) else 8 )))
                                                                            -row["LATE"] - row["SOON"])),axis=1)
            timesheetInput["ABSENT"]= timesheetInput.ABSENTHRS
            timesheetInput["SOON"]= timesheetInput.SOON.apply(lambda x: x+0)
            timesheetInput["LATE"]= timesheetInput.LATE
            timesheetInput["OT15"]= timesheetInput.OT15
            timesheetInput["OT20"]= timesheetInput.OT20
            timesheetInput["OT30"]= timesheetInput.OT30 
            timesheetInput["CD03"]= timesheetInput.OT15N
            timesheetInput["CD08"]= timesheetInput.OT20N
            timesheetInput["CD09"]= timesheetInput.OT30N
            timesheetInput["OT_ACTUAL"] = (timesheetInput.OT15+timesheetInput.OT20+timesheetInput.OT30+timesheetInput.OT15N+timesheetInput.OT20N+timesheetInput.OT30N)
            timesheetInput["REG_HRS_TOTAL"] =  timesheetInput.apply(lambda row: row["REG_HRS"]+row["OT_ACTUAL"],axis=1)
            timesheetInput["WORK_HRS"] =  timesheetInput.apply(lambda row:max(0, (row["REG_HRS"]-0.5 if row["REG_HRS"] >=4 else row["REG_HRS"])
                                                                + (11 if row["OT_ACTUAL"]>=11 else(row["OT_ACTUAL"] -0.5 if row["OT_ACTUAL"]>=4 else 
                                                            (3.5 if (row["OT_ACTUAL"]>= 3.5 and row["OT_ACTUAL"]< 4) else 
                                                                row["OT_ACTUAL"])))- (3.5 if (row["TRH"]>=3.5 and row["TRH"] <=4 and row["DEDUCTOT"] == "Y" ) else (row["TRH"] if row["TRH"] >0 else 0))),axis=1)
            timesheetInput["AL_CODE"] = timesheetInput.apply(lambda row: row["SHIFTCODE"] if row["ABSENTHRS"] != 0 else "-",axis=1)
            timesheetInput["OTCN"]   = timesheetInput.apply(lambda row: "Y" if row["OT20"]+row["OT30"]>0 else ("N" if row["OT15"]>0 else "-"),axis=1)
            timesheetInput["TimeUpdate"]  = str(datetime.now().strftime("%y%m%d%H%M%S"))
            timesheetInput["STATUS"]=timesheetInput.STATUS
            timesheetInput= timesheetInput.drop(['index','TIMEIN' ,'TIMEOUT','EMPID', 'EMPNAME','TSDATE','DEPARTMENTCODE','SECTIONCODE',
                                                'GROUPCODE','SHIFTCODE','RATE','DATEIN','DATEOUT','ABSENTHRS',
                                                'OT15N','OT20N','OT30N','SPCODE','REASON','NS30','TRH','DEDUCTOT','EMPLOYEETYPECODE',
                                                'DIVISION'], axis = 1)
            return timesheetInput
        else:
            return False
        
    def insertToServer(self,timeSheetUpdate,cnx):
        if type(timeSheetUpdate) != bool:
            timeSheetUpdate.to_sql('employee_timesheet', con=cnx, if_exists='append',index=1)
            print("*** Update successfully ***")
            cnx.dispose()
        else:
            return False            
          
    def deleteTimeSheet(self,cnx,fileName):
        # print("delete old data")
        try:
            finalFlags = self.checkLastFlags(fileName)
            
            # Mở kết nối với context manager để tự động đóng kết nối sau khi xong
            with cnx.connect() as connection:
                query = text("DELETE FROM pr2k.employee_timesheet WHERE DATE = :final_date")
                connection.execute(query, {'final_date': finalFlags})
                connection.commit()  # Xác nhận thay đổi

            print(f'Deleted records for date: {finalFlags}')
        except Exception as e:
            print(f'Error deleting timesheet: {e}')
    def checkLastFlags(self,fileName):    
        fileFlags= pd.read_csv(fileName)
        lastfile = str(fileFlags.iloc[len(fileFlags)-1,0])
        # print(lastfile)
        return lastfile
    
    def updateFlags(self,fileName):
        lastfile = self.checkLastFlags(fileName)
        UpdateFlags = str((datetime(year= int(lastfile[0:4]),month= int(lastfile[4:6]),day= int(lastfile[6:8])) + timedelta(days=1)).strftime("%Y%m%d"))
        f = open(fileName, "a")
        f.write("\n"+UpdateFlags)
        f.close()
              
uTs = updateTimesheet()
if __name__=="__main__":
    print("*** Welcom to automatic update timesheet sofrware ***")
    lastfile = uTs.checkLastFlags("C:/Hanes1/public/Python/Employee/WorkingResult/fileFlags.txt")
    try:
        checkLastQuery = str(pd.read_sql("SELECT DATE FROM employee_timesheet ORDER BY ID DESC LIMIT 1",
            uTs.connectToServer()).DATE[0]).replace("-","")
        print(checkLastQuery)
    except:
        checkLastQuery = "None"
    while True:
        if int(checkLastQuery) >= int(lastfile):
            uTs.updateFlags("C:/Hanes1/public/Python/Employee/WorkingResult/fileFlags.txt")
            lastfile = uTs.checkLastFlags("C:/Hanes1/public/Python/Employee/WorkingResult/fileFlags.txt")
            print(lastfile)
        elif int(checkLastQuery) < int(lastfile):
            if type(uTs.getDataInput("DRAFT","C:/Hanes1/public/Python/Employee/WorkingResult/fileFlags.txt")) != bool:
                uTs.insertToServer(uTs.ajustingData(uTs.getDataInput("DRAFT","C:/Hanes1/public/Python/Employee/WorkingResult/fileFlags.txt")),uTs.connectToServer())
                uTs.updateFlags("C:/Hanes1/public/Python/Employee/WorkingResult/fileFlags.txt")
            elif uTs.getDataInput("DRAFT","C:/Hanes1/public/Python/Employee/WorkingResult/fileFlags.txt") == True:
                uTs.updateFlags("C:/Hanes1/public/Python/Employee/WorkingResult/fileFlags.txt")
            else:
                break
        else:
            break
    while True:
        if type(uTs.getDataInput("FINAL","C:/Hanes1/public/Python/Employee/WorkingResult/finalFlags.txt")) != bool:
            uTs.deleteTimeSheet(uTs.connectToServer(),"C:/Hanes1/public/Python/Employee/WorkingResult/finalFlags.txt")   
            uTs.insertToServer(uTs.ajustingData(uTs.getDataInput("FINAL","C:/Hanes1/public/Python/Employee/WorkingResult/finalFlags.txt")),uTs.connectToServer())
            uTs.updateFlags("C:/Hanes1/public/Python/Employee/WorkingResult/finalFlags.txt")
        elif uTs.getDataInput("FINAL","C:/Hanes1/public/Python/Employee/WorkingResult/finalFlags.txt") == True:
            uTs.updateFlags("C:/Hanes1/public/Python/Employee/WorkingResult/finalFlags.txt")
        else:
            break
    print("done")
        
