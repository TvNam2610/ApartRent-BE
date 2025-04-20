import pandas as pd
from mysql.connector import MySQLConnection
from sqlalchemy import create_engine
from datetime import datetime, timedelta

engine_hbi = create_engine(
    'mysql+mysqlconnector://i_admin:Hy$2020@10.144.12.93:3306/pr2k', echo=False)
engine_balancing = create_engine(
    'mysql+mysqlconnector://i_admin:Hy$2020@10.144.12.93:3306/linebalancing', echo=False)

# def monday_of_calenderweek(year, week):
#     first = date(year, 1, 1)
#     base = 1 if first.isocalendar()[1] == 1 else 8
#     day = first + timedelta(days=base - first.isocalendar()
#                             [2] + 7 * (week - 1))
#     # day7=day+timedelta.delay()
#     print(day)
#     return first + timedelta(days=base - first.isocalendar()[2] + 7 * (week - 1))
def weeknum_to_dates(year, week):
    first_day = datetime.fromisocalendar(year, week, 1)  # Ngày đầu tuần (Thứ 2)
    last_day = first_day + timedelta(days=6)  # Ngày cuối tuần (Chủ nhật)
    return first_day.strftime("%Y%m%d"), last_day.strftime("%Y%m%d")


# def weeknum_to_dates(year,weeknum):
#     a = [datetime.datetime.strptime(
#         str(year)+"-W" + str(weeknum) + "-"+str(x), "%Y-W%W-%w").strftime('%Y%m%d') for x in [1, 0]]
#     print(a)
#     return [datetime.datetime.strptime(str(year)+"-W" + str(weeknum) + "-"+str(x), "%Y-W%W-%w").strftime('%Y%m%d') for x in [1, 0]]


def query_wk(yearweek, date_from, date_to):
    print(date_from, date_to)
    data = pd.read_sql("Select tmp.*,'" + str(yearweek) + "' as 'Week',temp1.TT_WORK_HRS as 'Total_WK_Hours', "
                       + "case "
                       + "when temp1.TT_WORK_HRS is not null then round(tmp.Total_SAH/temp1.TT_WORK_HRS*100,1) "
                       + "else '0' "
                       + "end as 'Efficiency' "
                       + "from (select temp.EMPLOYEE as 'ID5',se.ID,se.Name , se.Line,se.`Section`,temp.Total_SAH from ( "
                       + "select es.EMPLOYEE , round(sum(es.EARNED_HOURS)/60,1) as 'Total_SAH' from pr2k.employee_scanticket es "
                       + "where es.`DATE` between '"+date_from+"' and '"+date_to+"' "
                       + "group by es.EMPLOYEE) as temp "
                       + "left join erpsystem.setup_emplist se on se.ID5 = temp.EMPLOYEE) as tmp "
                       + "left join (select et.ID5,sum(et.WORK_HRS) as 'TT_WORK_HRS' from pr2k.employee_timesheet et where et.`DATE` between Date_format('"+date_from+"','%Y-%m-%d') and Date_format('"+date_to+"','%Y-%m-%d') group by et.ID5 ) as temp1 on tmp.ID5 = temp1.ID5 ", engine_hbi)
    data = pd.DataFrame(data)
    # print(data)
    return data


def filename():
    date = datetime.now()
     # Lùi lại 7 ngày (1 tuần)
    previous_week_date = date - timedelta(weeks=1)

    
    # Lấy tuần và năm theo chuẩn ISO
    year, week, _ = previous_week_date.isocalendar()
    a = weeknum_to_dates(year,week)
    datefrom = a[0]
    dateto = a[1]
    yearweek=str(year)+"."+("0"+str(week))[-2:]
    data = query_wk(yearweek, datefrom, dateto)
    print(data)
    if len(data)>0:
        # data.to_excel(
        #     writer, sheet_name=str(week), engine='xlsxwriter', index=False)
        data.to_sql('employee_weekly_efficiency', engine_balancing,
                    if_exists='append', index=False, index_label=None)
        print('Done!')


filename()