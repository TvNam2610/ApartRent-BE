from datetime import datetime, timedelta
hostname='pbvweb01v'
import mysql.connector
import pyodbc
import pandas as pd

connection = pyodbc.connect(
    driver='{iSeries Access ODBC Driver}',
    system='HQ400U',
    uid='DULE4',
    pwd='Phubai112', 
    dbq='QGPL PLANIDAT')

def get_date_format(date):
    year=date[0:4]
    month=date[5:7]
    day=date[8:10]
    return year+month+day

if __name__=="__main__":
    today=datetime.now().strftime('%Y-%m-%d')
    yesterday = datetime.now() - timedelta(days = 1)
    date=get_date_format(today)
    yesterdate_str=get_date_format(yesterday)
    sql=('SELECT INTQSW.TQBULT, INTQSW.TQPLAN, INTQSW.TQWORD, INTQSW.TQSKU, BULARC.BULBU1 UNTS, INTQSW.TQFGER, '
         +' INTQSW.TQOPE1, INTQSW.TQDES1, INTQSW.TQTIE1, '
         +' INTQSW.TQOPE2, INTQSW.TQDES2, INTQSW.TQTIE2, '
         +' INTQSW.TQOPE3, INTQSW.TQDES3, INTQSW.TQTIE3, '
         +' INTQSW.TQOPE4, INTQSW.TQDES4, INTQSW.TQTIE4, '
         +' INTQSW.TQOPE5, INTQSW.TQDES5, INTQSW.TQTIE5, '
         +' INTQSW.TQOPE6, INTQSW.TQDES6, INTQSW.TQTIE6, '
         +' INTQSW.TQOPE7, INTQSW.TQDES7, INTQSW.TQTIE7, '
         +' INTQSW.TQOPE8, INTQSW.TQDES8, INTQSW.TQTIE8, '
         +' INTQSW.TQOPE9, INTQSW.TQDES9, INTQSW.TQTIE9, '
         +' INTQSW.TQOP10, INTQSW.TDES10, INTQSW.TQTI10, '
         +' INTQSW.TQOP11, INTQSW.TDES11, INTQSW.TQTI11, '
         +' INTQSW.TQOP12, INTQSW.TDES12, INTQSW.TQTI12, '
         +' INTQSW.TQOP13, INTQSW.TDES13, INTQSW.TQTI13, '
         +' INTQSW.TQOP14, INTQSW.TDES14, INTQSW.TQTI14, '
         +' INTQSW.TQOP15, INTQSW.TDES15, INTQSW.TQTI15 '
         +' FROM HQ400U.PLANIDAT.INTQSW INTQSW JOIN PLANIDAT.BULARC BULARC ON INTQSW.TQBULT= BULARC.BULBUN'
         +" WHERE (INTQSW.TQFGER = '"+date+"' or INTQSW.TQFGER ='"+yesterdate_str+"') and (INTQSW.TQWORD Like '98%' or INTQSW.TQWORD Like '90%') ")
    bundle_list = pd.read_sql(sql,connection)
    len_bundle=len(bundle_list)
    mydb=mysql.connector.connect(host=hostname, user='root', passwd='123456', database="pr2k")
    myCursor=mydb.cursor()
    for row in range(0, len_bundle):
        try:
            bundle=bundle_list.iloc[row, 0]
            plant =str(bundle_list.iloc[row, 1])[2]
            worklot=str(bundle_list.iloc[row, 2])
            sku=bundle_list.iloc[row, 3]
            style=sku[0:6]
            color=sku[6:9]
            size =sku[10:12]
            unit =str(bundle_list.iloc[row, 4])
            date =str(bundle_list.iloc[row, 5])
            op_count=6
            while '    ' not in bundle_list.iloc[row, op_count] and op_count<52:
                try:
                    code=str(bundle_list.iloc[row, op_count])
                    op=bundle_list.iloc[row, op_count+1]
                    sam=str(bundle_list.iloc[row, op_count+2])
                    ticket=bundle+code
                    thisTime=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    query=('replace into bundleticket_active (TICKET, PLANT, CREATE_DATE, BUNDLE, WORK_LOT, STYLE, COLOR, SIZE, UNITS, OPERATION_CODE, OPERATION, EARNED_HOURS, TimeUpdate) '
                           + 'values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)')
                    values=(ticket, plant, date, bundle, worklot, style, color, size, unit, code, op, sam, thisTime)
                    myCursor.execute(query, values)
                    mydb.commit()
                    op_count=op_count+3
                except:
                    print('err1')
                    break
                    a=1
            print(row)
        except:
            print('err2')
            a=2
    mydb.close()
    print('done')