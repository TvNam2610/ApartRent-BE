# from turtle import update
# from matplotlib import units
import pyodbc
import pandas as pd
from sqlalchemy import create_engine
import mysql.connector
from mysql.connector import MySQLConnection, Error
import mysql
import datetime
import schedule 
import time
# connection = pyodbc.connect('Driver={Oracle in OraClient12home1};DBQ=prod1;Uid=bukhang;Pwd=Khang12')
engine = create_engine(
    'mysql+mysqlconnector://i_admin:Hy$2020@10.144.12.93:3306/linebalancing', echo=False)
hq_connection = pyodbc.connect(
    driver='{iSeries Access ODBC Driver}',
    system='HBIVTPRD',
    uid='bukhang',
    pwd='Hungyen2',
    dbq='QGPL PLANIDAT')


def get_date_format(date):
    year = date[0:4]
    month = date[5:7]
    day = date[8:10]
    return year+month+day


def drop_data():
    mydb = mysql.connector.connect(
        host='10.144.12.93', user='i_admin', passwd='Hy$2020', database="linebalancing")
    myCursor = mydb.cursor()
    sql = "DELETE FROM sah;"
    myCursor.execute(sql)
    mydb.commit()
    myCursor.close()
    mydb.close()


def drop_BOL():
    mydb = mysql.connector.connect(
        host='10.144.12.93', user='i_admin', passwd='Hy$2020', database="linebalancing")
    myCursor = mydb.cursor()
    sql = "DELETE FROM bol;"
    myCursor.execute(sql)
    mydb.commit()
    # myCursor.close()
    # mydb.close()


# test the connection
# cursor = connection.cursor()

# Example command to print the unique values of the field 'pacfin_group_gear_code

def update_BOL():
    SQLCommand = ('SELECT DISTINCT BOLSTY as "Mnf_Style" ,BOLOPE as "OP_Code", BOLOP1 as "OP_Name",Concat(BOLSIZ,BOLCUP) as "Size", BOLSTA as "SAH",BOLSEQ as "Sequence" ,BOLSEW as "For_Sew" FROM PLANIDAT.BOLARC b WHERE b.BOLFOR = 10')
    print(SQLCommand)
    data = pd.read_sql(SQLCommand, con=hq_connection)
    print(len(data))
    drop_BOL()
    data.to_sql('bol', engine, if_exists='append',
                index=False, index_label=None)
    engine.dispose()
    print('Successfully!')


def update_cutting_bol():
    sql_command = ('SELECT * from PLANIDAT.INCBOL i '
                   + "WHERE i.CBCUTP='95' OR i.CBCUTP='92'")
    bol_cutting = pd.read_sql(sql_command, con=hq_connection)
    print(bol_cutting)
    bol_cutting.to_csv("BOL_CUTTING", index=False)


def update_size():
    sql1 = ('select distinct es.WORK_LOT from linebalancing.employee_scanticket es where isnull(es.EARNED_HOURS) ')
    data_wl = pd.read_sql(sql1, engine)
    data_wl = pd.DataFrame(data_wl, columns=['WORK_LOT'])
    if len(data_wl) > 0:
        data_wl = data_wl.assign(SIZE=lambda x: (size(x['WORK_LOT'])))
        print(data_wl)
    mydb = mysql.connector.connect(
        host='10.144.12.93', user='i_admin', passwd='Hy$2020', database="linebalancing")
    myCursor = mydb.cursor()
    for i in range(len(data_wl)):

        worklot = data_wl.iloc[i, 0]
        size_lot = data_wl.iloc[i, 1]
        sql2 = ('Update linebalancing.employee_scanticket set SIZE = "' +
                str(size_lot)+'" where WORK_LOT = "'+str(worklot)+'"')
        myCursor.execute(sql2)
        mydb.commit()
    mydb.close()
    # update_smv()


def size(WL_total):
    SIZE = []
    for WL in WL_total:
        sql = ('SELECT  DISTINCT  i2.TSSIZE '
               + 'FROM PLANIDAT.INTCOH i '
               + 'LEFT JOIN PLANIDAT.INTCOS i2 ON i.THCTPL = i2.TSCTPL AND i.THWONO =i2.TSWONO '
               + "WHERE i.THCTPL = '"+str(WL)[:2]+"' AND (i.THWONO= '"+str(WL)[-6:]+"' OR i.THASNO ='"+str(WL)[-6:]+"')  ")
        size_no = pd.DataFrame(pd.read_sql(sql, hq_connection))
        if len(size_no) == 0:
            SIZE.append('None')
        else:
            SIZE.append(str(size_no.iloc[0, 0]))
    return SIZE


def update_smv():
    sql1 = ('SELECT distinct es.STYLE , es.OPERATION_CODE,es.SIZE ,es.UNITS from linebalancing.employee_scanticket es where isnull(es.EARNED_HOURS) ')
    data = pd.DataFrame(pd.read_sql(sql1, engine))
    if len(data) == 0:
        print('finish')
    else:
        mydb = mysql.connector.connect(
            host='10.144.12.93', user='i_admin', passwd='Hy$2020', database="linebalancing")
        myCursor = mydb.cursor()
        for i in range(len(data)):
            sah = []
            op_sah = 0.0
            Style_f = str(data.iloc[i, 0])
            Style = str(data.iloc[i, 0]).lstrip("0")
            op_code = data.iloc[i, 1]
            size_f = data.iloc[i, 2]
            if str(size_f).strip() == '2XL' or str(size_f).strip() == '3XL' or str(size_f).strip() == '4XL':
                size = str(size_f)[:2]
            else:
                size = str(size_f)

            units = data.iloc[i, 3]
            print(Style, op_code, size_f, size, units)
            try:
                sql2 = ("SELECT b.SAH FROM linebalancing.bol b WHERE b.Mnf_Style = '"+str(Style) +
                        "' AND b.Size = '"+str(size)+"' AND b.OP_Code = '"+str(op_code)+"' ")
                sah = pd.DataFrame(pd.read_sql(sql2, con=engine))
                op_sah = sah.iloc[0, 0]
                sah_bun = op_sah*units*5
                print(sah_bun, type(sah_bun))
                sql3 = ('Update linebalancing.employee_scanticket set EARNED_HOURS = "' + str(sah_bun)+'" where STYLE ="'+str(Style_f) +
                        '" AND  OPERATION_CODE = "'+str(op_code)+'" AND UNITS = "'+str(units)+'" AND SIZE = "'+str(size_f)+'" ')
                myCursor.execute(sql3)
                mydb.commit()
            except:
                sql2 = ("SELECT AVG(b.SAH) FROM linebalancing.bol b WHERE b.Mnf_Style = '"+str(Style) +
                        "' AND b.OP_Code = '"+str(op_code)+"' ")
                sah = pd.DataFrame(pd.read_sql(sql2, con=engine))
                op_sah = sah.iloc[0, 0]
                if op_sah is not None:
                    sah_bun = op_sah*units*5
                else:
                    print("Not find SAH:")
                    sah_bun = 0
                # print(sah_bun, type(sah_bun))
                sql3 = ('Update linebalancing.employee_scanticket set EARNED_HOURS = "' + str(sah_bun)+'" where STYLE ="'+str(Style_f) +
                        '" AND  OPERATION_CODE = "'+str(op_code)+'" AND UNITS = "'+str(units)+'" ')
                myCursor.execute(sql3)
                mydb.commit()
        mydb.close()


def WL_HYS():
    last_two_month = (datetime.date.today() +
                      datetime.timedelta(days=-7)).strftime('%Y%m%d')
    sql = ('SELECT  DISTINCT i.THCTPL as "PLant",i.THWONO as "Work_Lot", i.THASNO as "Assorment",  i2.TSSIZE as "Size", i2.TSUNIT as "Units" '
           + 'FROM PLANIDAT.INTCOH i '
           + 'inner JOIN PLANIDAT.INTCOS i2 ON i.THCTPL = i2.TSCTPL AND i.THWONO =i2.TSWONO '
           + "WHERE i.THCTPL = '92'  or i.THCTPL = '95' and i.THSWDU > '"+str(last_two_month)+"' ")
    data = pd.read_sql(sql, hq_connection)
    data_set = data.values.tolist()

    k = len(data_set)
    a = (k) % 10000
    b = 0
    while a < k+1:
        temp = []
        for r in range(b, a):
            data_update = tuple(data_set[r])
            temp.append(data_update)
        print(temp)
        values = ', '.join(map(str, temp))
        query = (
            'REPLACE into linebalancing.work_order (PLant,Work_Lot,Assorment,`Size`,Units) VALUES {}').format(values)
        try:
            mydb = mysql.connector.connect(
                host='10.144.12.93', user='i_admin', passwd='Hy$2020', database="linebalancing")
            myCursor = mydb.cursor()
            myCursor.execute(query, values)
            mydb.commit()
            mydb.close()
        except Error as error:
            print(error)
            temp = pd.DataFrame(temp)
            temp.to_csv('temp.csv')
        b = a
        a = a+10000
    print('Successfully!')


def update_sizes():
    mydb = mysql.connector.connect(
        host='10.144.12.93', user='i_admin', passwd='Hy$2020', database="linebalancing")
    myCursor = mydb.cursor()

    sql = ('SELECT Distinct WORK_LOT from linebalancing.employee_scanticket where `Size` is NULL and EARNED_HOURS is NULL')
    list_WL = pd.read_sql(sql, engine)
    print(list_WL)
    for i in range(len(list_WL)):
        wl = list_WL.iloc[i, 0]

        data = pd.read_sql("select wo.`Size` from linebalancing.work_order wo where concat(wo.Plant ,wo.Work_Lot) ='" +
                           str(wl)+"' or concat(wo.Plant,wo.Assorment) = '" + str(wl)+"' ", engine)
        print(wl, len(data))
        if len(data) > 0:
            Size = data.iloc[0, 0]
            print(Size)
            sql = ("update linebalancing.employee_scanticket set `SIZE` = '" +
                   str(Size)+"' where WORK_LOT = '" + str(wl)+"' ")
            myCursor.execute(sql)
            mydb.commit()
            
    mydb.close()
    update_smv()
def correct_data():
    mydb = mysql.connector.connect(
        host='10.144.12.93', user='i_admin', passwd='Hy$2020', database="linebalancing")
    myCursor = mydb.cursor()
    data_correct = pd.read_excel('correct_data.xlsx')
    print(data_correct)
    for i in range(0, len(data_correct)):
        id = data_correct.iloc[i, 0]
        op_code = ("0000"+str(data_correct.iloc[i, 6]))[-4:]
        style = data_correct.iloc[i, 9]
        sah = data_correct.iloc[i, 8]
        print(id, style, op_code, sah)
        sql = ("update linebalancing.employee_scanticket es set es.STYLE = '" + str(style) + "', es.OPERATION_CODE = '" + str(op_code)+"',es.EARNED_HOURS = '" + str(sah) + "' "
               + "where es.`No.` = '" + str(id) + "' ")
        # print(sql)
        myCursor.execute(sql)
        mydb.commit()
    mydb.close()


def update_data():
    mydb = mysql.connector.connect(
        host='10.144.12.93', user='i_admin', passwd='Hy$2020', database="linebalancing")
    myCursor = mydb.cursor()
    data_update = pd.read_excel('update_data.xlsx')
    print(data_update)
    for i in range(0, len(data_update)):
        TICKET = data_update.iloc[i, 1]
        PLANT = data_update.iloc[i, 2]
        EMPLOYEE = ("00000"+str(data_update.iloc[i, 3]))[-5:]
        DATE = data_update.iloc[i, 4]
        op_code = ("000" + str(data_update.iloc[i, 6]))[-4:]
        style = data_update.iloc[i, 9]
        sah = data_update.iloc[i, 8]
        SIZE = data_update.iloc[i, 11]
        Qty = data_update.iloc[i, 12]
        Work_Lot = data_update.iloc[i, 13]
        FILE = data_update.iloc[i, 18]
        TimeUpdate = data_update.iloc[i, 21]
        print(id, style, op_code, sah)
        sql = ('insert into linebalancing.employee_scanticket (TICKET,PLANT,EMPLOYEE,DATE,OPERATION_CODE,EARNED_HOURS,STYLE,SIZE,UNITS,WORK_LOT,FILE,TimeUpdate) '
               + "VALUES('"+str(TICKET)+"','"+str(PLANT)+"','"+str(EMPLOYEE)+"','"+str(DATE) +"','"+str(op_code)+"','" +str(sah) + "','"+str(style) + "', "
               + "'" + str(SIZE)+"','"+str(Qty)+"','"+str(Work_Lot)+"','"+str(FILE)+"','"+str(TimeUpdate)+"') ")
        # print(sql)
        myCursor.execute(sql)
        mydb.commit()
    mydb.close()
def fun():
    print('test')

# drop_data()
# update_data()
# update_BOL()
# update_cutting_bol()
# update_size()
# WL_HYS()
update_sizes()
# update_smv()
# correct_data()
# update_data()

# schedule.every(30).minutes.do(update_sizes)
# while True:
#     schedule.run_pending()
#     time.sleep(1)
