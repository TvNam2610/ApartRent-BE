import os
from pathlib import Path
import numpy as np
import pyodbc
from datetime import datetime,timedelta
from sqlalchemy import create_engine
import pandas as pd
import pandasql as ps
import mysql.connector
from openpyxl_image_loader import SheetImageLoader
import re
from PIL import ImageGrab
import win32com.client as win32
import xlsxwriter

hostname='10.144.12.93'
engine = create_engine('mysql+mysqlconnector://i_admin:Hy$2020@10.144.12.93:3306/pr2k', echo=False)
data=[]
try:
    mydb = mysql.connector.connect(
        host=hostname, user='i_admin', passwd='Hy$2020', database="pr2k")
    myCursor = mydb.cursor()
    print('connect to server success!')
except:
    error = 1
    print('connect to server false')

def get_this_week():
    week_str=''
    week=int(datetime.now().strftime("%W"))
    if week<10:
        week_str='W0'+str(week)
    else:
        week_str='W'+str(week)
    return week_str

def get_date_format(date):
    year=date[0:4]
    month=date[5:7]
    day=(date[8:10])
    return year+"-"+month+"-"+day

today = datetime.now().strftime('%Y-%m-%d')
date  = get_date_format(today)
link='C:\\Scan\\Daily_output\\'
thisWeek=get_this_week()
if not os.path.exists(link+thisWeek):
    os.makedirs(link+thisWeek)

# Lay WL duoc Packing
def update_size():
    global date
    sql=('select  distinct Wlot_ID,MnfStyle '
        + 'from pr2k.prodoutput '
        + 'where (substr(TS_1,1,10) = "' + date +'") and TS_1 >= "'+date+' 14:00:00 "  ')
    Wlot=pd.read_sql(sql,engine)
    engine.dispose()

    # Iput Size cua MnfStyle
    Mnf_Size=[]
    hq_connection = pyodbc.connect(
                    driver='{iSeries Access ODBC Driver}',
                    system='HBIVTPRD',
                    uid='bukhang',
                    pwd='Khang25',
                    dbq='QGPL PLANIDAT')
    for i in range(0,int(len(Wlot))):
        wl=Wlot.iloc[i,0]
        mnf=Wlot.iloc[i,1]
        wl1=str(wl)[0:8]
        sql_hq=('SELECT CONCAT (i.THCTPL,i.THWONO) AS Cut_lot,RTRIM(i2.TSSIZE) as Mnf_Size '
                + 'FROM PLANIDAT.INTCOH i ' 
                + 'LEFT JOIN PLANIDAT.INTCOS i2 ON CONCAT (i.THCTPL,i.THWONO)=CONCAT (i2.TSCTPL,i2.TSWONO) '
                + "WHERE CONCAT (i.THCTPL,i.THASNO) ='"+wl1+"' AND  RTRIM(i.THSTYL)= '" +mnf+ "'")
        Data_size = pd.read_sql(sql_hq,hq_connection)
        lot_size = Data_size.iloc[0,1]
        Mnf_Size.append(lot_size)
        sql_upsize = ('update prodoutput set Mnf_Size = "'+ lot_size +'" where WLOT_ID = "'+wl+ '";')
        myCursor.execute(sql_upsize)
        mydb.commit()


    Wlot['Mnf_Size']=Mnf_Size   
    mydb.close()
    print(Wlot)

def main():
    global date
    update_size()
    sql=('select p.LINE , substr(p.TS_1,1,10) as "Scan_Date",msm.WC as WC,TEMP.Total_DLO, p.SellingStyle,sum(p.QUANTITY)/12 as "Total_Dz" ,sum(sah.SAH*p.QUANTITY/12 +sah1.SAH*p.QUANTITY/12/sah1.Pack_Qty)as "Total_SAH" '
        + 'from pr2k.prodoutput p '
        + 'inner join pr2k.sah sah on p.MnfStyle=sah.Style_CD and p.Mnf_Size =sah.`Size` '
        + 'inner join pr2k.sah sah1 on PkgStyle=sah1.Style_CD and p.SIZE=sah1.`Size` '
        + 'inner join pr2k.mnf_style_master msm on p.PkgStyle= msm.Mnf_Style '
        + 'Left join '
        + '(Select eml.Line, count(eml.ID) as "Total_DLO" from erpsystem.setup_emplist eml where eml.ML <> "ML" group by eml.Line) as TEMP '
        + 'on p.LINE = TEMP.Line '
        + 'where substr(p.TS_1,1,10) = "'+date+'" and p.TS_1 >= "'+date+' 14:00:00" '
        + 'group by p.LINE')
    data=pd.read_sql(sql,engine)
    engine.dispose()
    data['Total_Dz']=np.round(data['Total_Dz'],decimals=1)
    data['Total_SAH']=np.round(data['Total_SAH'],decimals=1)
    data['Draft_WK']=data.Total_DLO*7.5
    data['Draft_Eff']=data.Total_SAH/data.Draft_WK
    data['Draft_Eff']=np.round(data['Draft_Eff'],decimals=3)
    # data['Draft_Eff']=pd.Series(["{0:.1f}%".format(val * 100) for val in data['Draft_Eff']], index = data.index)
    data=data.sort_values(by=['WC','LINE'])
    print(data)
    with pd.ExcelWriter(link+thisWeek+'\\'+date+"_night.xlsx",mode='w') as writer:
        data.to_excel(writer,index=False)
        workbook = writer.book
        worksheet = writer.sheets['Sheet1']
        format2 = workbook.add_format({'num_format': '0.0%'})
        worksheet.set_column('I:I', 10, format2)
        worksheet.set_column('B:B', 12)
        worksheet.set_column('E:E', 12)
        worksheet.set_column('C:C', 10)
        worksheet.set_row(0, 20)

        border_fmt = workbook.add_format({'bottom':1, 'top':1, 'left':1, 'right':1})
        worksheet.conditional_format(xlsxwriter.utility.xl_range(0, 0, len(data), len(data.columns)-1), {'type': 'no_errors', 'format': border_fmt})
        try:
            writer.save()
        except:
            pass
def loadimage():
    global data
    global thisWeek
    global date

    FILE = link+thisWeek+'\\'+date+"_night"
    excel = win32.gencache.EnsureDispatch('Excel.Application')
    workbook = excel.Workbooks.Open(FILE)

    # for i, worksheet in enumerate(workbook.Sheets):
    #     row = CELLS[i][0]
    #     print(row,CELLS[i][2])
        # while True:
        #     name = worksheet.Cells(row, CELLS[i][1]).Value
        #     if not name:
        #         break
        #     name = re.sub(r'\W+ *', ' ', name)
        #     rng = worksheet.Range('{}{}'.format(CELLS[i][2], row))
        #     rng.CopyPicture(1, 2)
        #     im = ImageGrab.grabclipboard()
        #     im.save('{}.jpg'.format(name))
        #     row += 1
    for i, ws in enumerate(workbook.Sheets):
        pd_xl_file = pd.ExcelFile(link+thisWeek+'\\'+date+"_night.xlsx")
        df = pd_xl_file.parse(sheet_name="Sheet1")
        CELLs=df.shape
        row=CELLs[0]+1
        clm=CELLs[1]
        name = link+thisWeek+'\\'+date+"_night"
        rng = ws.Range(ws.Cells(1,1),ws.Cells(row,clm)).CopyPicture(Format=2)
        # rng.CopyPicture(1,2)
        im = ImageGrab.grabclipboard()
        im.save('{}.jpg'.format(name))
main()
loadimage()
# update_size()