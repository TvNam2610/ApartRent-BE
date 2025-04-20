from sqlalchemy import create_engine
import mysql.connector
import pandas as pd
# import os
# import xlsxwriter
# import shutil
import numpy as np
from datetime import datetime, timedelta
# test
hostname = '10.144.12.93'
engine_hbi = create_engine(
    'mysql+mysqlconnector://i_admin:Hy$2020@10.144.12.93:3306', echo=False)
engine_linebalancing = create_engine(
    'mysql+mysqlconnector://root:Hy$2020@1localhost:3306/linebalancing', echo=False)
date = ''
mydb = mysql.connector.connect(
    host='10.144.12.93', user='i_admin', passwd='Hy$2020', database="linebalancing")


def weeknum_to_dates(year, weeknum):
    year = int(year)
    week = int(weeknum)
    
    # Ngày đầu tiên của tuần (Thứ Hai)
    start_date = datetime.fromisocalendar(year, week, 1)
    
    # Lấy danh sách 7 ngày trong tuần
    week_dates = [(start_date + timedelta(days=i)).strftime("%Y%m%d") for i in range(7)]
    
    return week_dates

def daily_eff(year,week,date):
    sql = ('select se.ID, se.Name, temp.*, msm.`Group` '
           + 'from (select es.EMPLOYEE, es.`DATE`, es.`STYLE`, es.OPERATION_CODE, es.OPERATION, '
           + 'round(sum(es.EARNED_HOURS) / 60, 2) as "Total_Earn" '
           + 'from pr2k.employee_scanticket es '
           + f"where es.`DATE` = '{date}' "
           + 'group by es.EMPLOYEE, es.`STYLE`, es.OPERATION_CODE) as temp '
           + 'left join pr2k.mnf_style_master msm on temp.`Style` = msm.Mnf_Style '
           + 'left join erpsystem.setup_emplist se on temp.EMPLOYEE = se.ID5 '
           + 'order by temp.EMPLOYEE')

    data = pd.read_sql(sql, engine_hbi)
    sql2 = ('select et.ID5, et.`DATE`, et.WORK_HRS from pr2k.employee_timesheet et '
            f'where date_format(et.`DATE`, "%Y%m%d") = "{date}" and et.STATUS = "Final"')
    wk_time = pd.read_sql(sql2, engine_hbi)
    
    Eff_data = []
    # year, month, day = str(date)[:4], str(date)[4:6], str(date)[6:]
    week_num = f"{year}.{('0'+str(week))[-2:]}"

    if len(data) > 0:
        i = 0
        while i < len(data):
            ID5 = data.iloc[i, 2]
            ID = data.iloc[i, 0] if data.iloc[i, 0] is not None else ID5
            Name = data.iloc[i, 1] if data.iloc[i, 0] is not None else "Inactive"

            data_i = data.query('EMPLOYEE == @ID5')
            max_earn = data_i['Total_Earn'].max() or 0
            total_sah = data_i['Total_Earn'].sum() or 0
            lenght = len(data_i)

            df = data_i.loc[data['Total_Earn'] == max_earn]
            mnf, Selling, op_code, op_name, ratio = (
                df.iloc[0, 4] if not df.empty else 0,
                df.iloc[0, 8] if not df.empty else 0,
                df.iloc[0, 5] if not df.empty else 0,
                df.iloc[0, 6] if not df.empty else 0,
                round(max_earn / total_sah * 100, 1) if total_sah else 0,
            )

            WK_time_i = wk_time.query('ID5 == @ID5').iloc[0, 2] if not wk_time.query('ID5 == @ID5').empty else 0
            Eff = round(total_sah / WK_time_i * 100, 1) if WK_time_i else 0

            Eff_data.append((
                int(ID5),int(ID) if ID is not None else None,Name,str(date),
                week_num,
                str(Selling) if pd.notna(Selling) else "",
                str(mnf) if pd.notna(mnf) else "",
                int(op_code) if isinstance(op_code, (int, np.int64)) else op_code,
                op_name,
                float(max_earn) if pd.notna(max_earn) else 0.0,
                float(total_sah) if pd.notna(total_sah) else 0.0,
                float(WK_time_i) if pd.notna(WK_time_i) else 0.0,
                float(Eff) if pd.notna(Eff) else 0.0,
                float(ratio) if pd.notna(ratio) else 0.0,
            ))
            i+= lenght
        try:
            insert_query = ('insert into linebalancing.employee_efficiency_history '
                            '(ID5, ID, `NAME`, `Date`, `Week`, Selling_WC, Manf_Style, Op_Code, Op_Name, '
                            'Op_Earn, Total_Earn, Working_Time, Efficiency, Op_Ratio) '
                            'VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)')
            
            cursor = mydb.cursor()
            cursor.executemany(insert_query, Eff_data)
            mydb.commit()
            cursor.close()
        except mysql.connector.Error as err:
            print(f"Error: {err}")
    else:
        print('No data')

if __name__=="__main__":
    date = datetime.now()
     # Lùi lại 7 ngày (1 tuần)
    previous_week_date = date - timedelta(weeks=1)
    day_ago = date - timedelta(days=60)
    # Lấy tuần và năm theo chuẩn ISO
    year, week, _ = previous_week_date.isocalendar()
    date_last_week = weeknum_to_dates(str(year), str(week))
    
    
    sql = (f'select distinct date_format(et.`DATE`,"%Y%m%d") as "Date_update" from pr2k.employee_timesheet et where et.`Date` >= "{day_ago}" and et.Status = "Final" order by "Date_update" ')
    final_list = pd.DataFrame(pd.read_sql(sql, engine_hbi))
    sql2 = (
        'select distinct eeh.`DATE` from linebalancing.employee_efficiency_history eeh ORDER BY eeh.`Date` desc limit 60 ')
    eff_list = pd.read_sql(sql2, engine_hbi)
    date_list = eff_list['DATE'].tolist()
    date_timsheet = final_list['Date_update'].tolist()
    print(date_list,date_list)
    

    print(date_last_week)
    for i in date_last_week:
        if i in date_timsheet and i not in date_list:
            print("Update ngày :",i)
            daily_eff(year, week,i)
        else:
            print("nothing")
            pass