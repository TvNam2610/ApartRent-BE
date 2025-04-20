import os
from pathlib import Path
import numpy as np
import mysql.connector
from datetime import datetime
from sqlalchemy import create_engine
import pandas as pd
from datetime import timedelta
import xlsxwriter
from PIL import Image, ImageDraw
import win32com.client as win32
from win32com.client import Dispatch
import excel2img

import matplotlib.pyplot as plt

hostname = '10.144.12.93'
engine = create_engine(
    'mysql+mysqlconnector://i_admin:Hy$2020@10.144.12.93:3306/pr2k', echo=False)
# def get_this_week(day):
#     week_str = ''
#     week = int(day.strftime("%W"))
#     if week < 10:
#         week_str = 'W0'+str(week)
#     else:
#         week_str = 'W'+str(week)
#     return week_str

def weeknum_to_dates(year, weeknum):
    return [datetime.strptime(year+"-W" + str(weeknum) + "-"+str(x), "%Y-W%W-%w").strftime('%Y%m%d') for x in [1, 0]]
def weeknum_full_dates(year, weeknum):
    return [datetime.strptime(year+"-W" + str(weeknum) + "-"+str(x), "%Y-W%W-%w").strftime('%Y-%m-%d') for x in [1, 0]]

def get_date_format(date):
    year = date[0:4]
    month = date[5:7]
    day = date[8:10]
    return year+month+day


def get_full_day(date):
    year = date[0:4]
    month = date[5:7]
    day = date[8:10]
    return day+'-'+month+'-'+year

def export_data_to_image(file_path, sheet_names, output_prefix):
    i=0
    for sheet_name in sheet_names:
        try:
            # Đọc dữ liệu từ sheet
            df = pd.read_excel(file_path, sheet_name=sheet_name)

            # Kiểm tra xem DataFrame có dữ liệu hay không
            if df.empty:
                print(f"Sheet '{sheet_name}' không có dữ liệu, chỉ lưu tiêu đề.")
                headers = df.columns.tolist()
                # Tạo DataFrame rỗng với tiêu đề
                df = pd.DataFrame(columns=headers)
            else:
                headers = df.columns.tolist()

            # Tạo một hình ảnh từ DataFrame
            plt.figure(figsize=(10, 1 + len(df) * 0.5))  # Điều chỉnh kích thước hình ảnh
            plt.axis('tight')
            plt.axis('off')

            # Tạo bảng từ DataFrame
            # Nếu DataFrame rỗng, chỉ vẽ tiêu đề
            if df.empty:
                # Tạo bảng chỉ với tiêu đề
                table = plt.table(cellText=[headers], colLabels=None, cellLoc='left', loc='top')
            else:
                table = plt.table(cellText=df.values, colLabels=headers, cellLoc='left', loc='top')

            # Lưu hình ảnh
            output_file = f"{output_prefix}_{i}.png"
            plt.savefig(output_file, bbox_inches='tight', dpi=300)
            plt.close()  # Đóng hình để giải phóng bộ nhớ
            print(f"Đã lưu dữ liệu từ sheet '{sheet_name}' vào hình ảnh '{output_file}'.")

        except ValueError:
            print(f"Sheet '{sheet_name}' không tồn tại trong file.")
        except Exception as e:
            print(f"Có lỗi xảy ra khi xuất dữ liệu từ sheet '{sheet_name}': {e}")
        i += 1
        
if __name__=="__main__":
    today = datetime.today()
    last_monday = (today-timedelta(days=7)).isoformat()
    last_wk = datetime.strptime(last_monday[:10], "%Y-%m-%d").strftime('%W')
    year = datetime.strptime(str(last_monday)[:10], "%Y-%m-%d").strftime("%Y")
    date_from = (weeknum_to_dates(year,last_wk))[0]
    date_to = (weeknum_to_dates(year,last_wk))[1]
    date_full_from = (weeknum_full_dates(year,last_wk))[0]
    date_full_to = (weeknum_full_dates(year,last_wk))[1]
    week = ('0'+str(last_wk))[-2:]
    
    print('query bundle ticket error:')

    sql = ('SELECT LEFT(FILE,5) AS GroupLine, COUNT(FILE) as Error_File FROM bundleticket_error '
        + 'WHERE DATE between "'+date_from+'" and "'+date_to+'" AND MODIFIED is null '
        + 'GROUP BY LEFT(FILE,5);')
    bundleErrorGroup = pd.read_sql(sql, engine)
    
    print('query bundle ticket alert:')

    sql1 = ('select distinct substring(NEW_FILE,1,5) as "Line", date_format(NEW_TimeUpdate,"%d-%m-%Y") as "Date", '
        + 'count(distinct NEW_FILE,OLD_FILE) as "Trung_ID" '
        + 'from pr2k.bundleticket_alert ba where date_format(ba.NEW_TimeUpdate, "%Y%m%d") between  "'+date_from+'" and "'+date_to+'" and ba.NEW_EMPLOYEE <> ba.OLD_EMPLOYEE and `STATUS` = "N" '
        + 'group by substr(NEW_FILE,1,5),"Date" ')
    bundleMix = pd.read_sql(sql1, engine)
    print('query bundle ticket deactive:')
    sql2 = ('SELECT left(MAX(Temp4.FIle),5) as "Line", Temp4.ISSUE_FILE, LEFT(Temp4.TICKET, 6) AS "BUNDLE", max(QC) as "QC", COUNT(Temp4.TICKET) AS "ISSUE", COUNT(EMPLOYEE) AS "SCAN", COUNT(deactive.TICKET) AS "IASCAN", COUNT(Temp4.TICKET)-COUNT(EMPLOYEE)-COUNT(deactive.TICKET) AS "IS_FULL",COUNT(distinct Temp4.MODIFIED) as "MODIFIED", MAX(Temp4.FILE) as "FILE", Temp4.TimeUpdate, TimeModified FROM '
        + '(SELECT Temp3.FILE AS ISSUE_FILE, Temp3.TICKET, scan.QC, scan.EMPLOYEE,scan.MODIFIED, scan.FILE, scan.TimeUpdate, scan.TimeModified FROM pr2k.employee_scanticket scan RIGHT JOIN '
        + '(SELECT TICKET, active2.FILE FROM pr2k.bundleticket_active active2 INNER JOIN(SELECT distinct active.FILE FROM pr2k.bundleticket_active active '
        + 'INNER JOIN(SELECT TICKET FROM pr2k.employee_scanticket where `Date` between "'+date_from+'" and "'+date_to+'" ) AS Temp1 ON active.TICKET=Temp1.TICKET) AS Temp2 ON active2.`FILE`=Temp2.FILE WHERE active2.FILE != "0") AS Temp3 ON Temp3.TICKET=scan.TICKET) AS Temp4  LEFT JOIN pr2k.bundleticket_deactive deactive ON Temp4.TICKET=deactive.TICKET '
        + 'GROUP BY Temp4.ISSUE_FILE ORDER BY Line')
    imageFile = pd.read_sql(sql2, engine)
    print('query bundle ticket error detail:')
    sql3 = ('select * from pr2k.bundleticket_error be where `Date` between "'+date_from+'" and "'+date_to+'" AND MODIFIED is null')
    detail_err= pd.read_sql(sql3,engine)
    row = 0
    imageFile_len = len(imageFile)
    group_dict = []
    group_list = []
    noQC_list = []
    noID_list = []
    modified_list = []
    wip_list = []
    done_list = []
    err_list = []
    sum_list = []
    while row < imageFile_len:
        group = imageFile.iloc[row, 0]
        group_data = imageFile.query('Line=="'+group+'"')
        no_QC = 0
        no_ID = 0
        modified = 0
        wip = 0
        done = 0
        err = 0
        total = 0
        for i in range(0, len(group_data)):
            SUM_BUNDLE = group_data.iloc[i, 0]
            QC = group_data.iloc[i, 3]
            SUM_FULL = group_data.iloc[i, 7]
            MODIFIED_USER = group_data.iloc[i, 8]
            if int(SUM_FULL) > 0:
                no_ID = no_ID+1
            elif QC == '':  # 1320
                no_QC = no_QC+1
            elif MODIFIED_USER == 2:  # and MODIFIED_USER<SUM_BUNDLE:
                modified = modified+1
            done = done+1
        for i in range(0, len(bundleErrorGroup)):
            if group == bundleErrorGroup.iloc[i, 0]:
                err = bundleErrorGroup.iloc[i, 1]
                break
        total = done+err
        group_list.append(group)
        done_list.append(done-no_QC-no_ID-modified)
        noQC_list.append(no_QC)
        noID_list.append(no_ID)
        modified_list.append(modified)
        err_list.append(err)
        sum_list.append(total)
    #    group_dict.append({'group':group, 'no_QC': no_QC, 'no_ID': no_ID, 'modified': modified, 'done': done, 'wip':wip, 'err':err})
        row = row+len(group_data)
        # print(row)
    group_list.append('Tổng ảnh')
    group_list.append('Tỉ lệ (%)')
    done_sum = sum(done_list)
    noQC_sum = sum(noQC_list)
    noID_sum = sum(noID_list)
    modified_sum = sum(modified_list)
    err_sum = sum(err_list)
    total = done_sum+noQC_sum+noID_sum+modified_sum+err_sum
    if total > 0:
        done_list.append(done_sum)
        done_list.append(round(done_sum/total*100, 2))
        noQC_list.append(noQC_sum)
        noQC_list.append(round(noQC_sum/total*100, 2))
        noID_list.append(noID_sum)
        noID_list.append(round(noID_sum/total*100, 2))
        modified_list.append(modified_sum)
        modified_list.append(round(modified_sum/total*100, 2))
        err_list.append(err_sum)
        err_list.append(round(err_sum/total*100, 2))
        sum_list.append(sum(sum_list))
        sum_list.append(100)
    else:
        done_list.append(done_sum)
        done_list.append(0)
        noQC_list.append(noQC_sum)
        noQC_list.append(0)
        noID_list.append(noID_sum)
        noID_list.append(0)
        modified_list.append(modified_sum)
        modified_list.append(0)
        wip_list.append(0)
        err_list.append(err_sum)
        err_list.append(0)
        sum_list.append(sum(sum_list))
        sum_list.append(100)
    KickOutReport = pd.DataFrame(
        {
            'GROUP': group_list,
            'DA_SCAN_OK': done_list,
            'THIEU_QC': noQC_list,
            'THIEU_ID_NV': noID_list,
            'DA_CHINH_SUA': modified_list,
            'LOI_ANH': err_list,
            'TONG': sum_list
        }
    )
    link = '\\\\incentive\\Scan\\Daily_Scan_Report'
    # print(link)
    bundle_link = link+'\\'+year+'\\'+'W'+week
    
    # =====Done Paper===========================
    if not os.path.exists(bundle_link):
        os.makedirs(bundle_link)
    writer = pd.ExcelWriter(bundle_link+'\\'+'Weekly_report_W'+week+'.xlsx', engine='xlsxwriter')
    #KickOutReport.to_excel('KickOut.xlsx', index=False)
    KickOutReport.to_excel(writer, sheet_name='Sum_bundle', index=False)
    imageFile.to_excel(writer, sheet_name='Detail', index=False)
    bundleErrorGroup.to_excel(writer, sheet_name='Error Page', index=False)
    bundleMix.to_excel(writer, sheet_name='Mix_bundle', index=False)
    detail_err.to_excel(writer, sheet_name='Detail_Err', index=False)
    workbook = writer.book
    format1 = workbook.add_format({'bg_color': '#FFC7CE',
                                'font_color': '#9C0006'})
    border_fmt = workbook.add_format(
        {'bottom': 1, 'top': 1, 'left': 1, 'right': 1})

    # Chỉnh formating
    worksheet = writer.sheets['Sum_bundle']
    worksheet.conditional_format(xlsxwriter.utility.xl_range(
        0, 0, len(KickOutReport), len(KickOutReport.columns)-1), {'type': 'no_errors', 'format': border_fmt})
    worksheet.conditional_format('D1:D1000', {'type': 'cell',
                                            'criteria': '>',
                                            'value': 0,
                                            'format': format1})
    worksheet.conditional_format(xlsxwriter.utility.xl_range(
        0, 5, len(KickOutReport), 5), {'type': 'cell',
                                    'criteria': '>',
                                    'value': 0,
                                    'format': format1})
    worksheet1 = writer.sheets['Detail']
    worksheet1.conditional_format(xlsxwriter.utility.xl_range(
        0, 0, len(imageFile), len(imageFile.columns)-1), {'type': 'no_errors', 'format': border_fmt})

    worksheet2 = writer.sheets['Error Page']
    worksheet2.conditional_format(xlsxwriter.utility.xl_range(
        0, 0, len(bundleErrorGroup), len(bundleErrorGroup.columns)-1), {'type': 'no_errors', 'format': border_fmt})

    worksheet3 = writer.sheets['Mix_bundle']
    worksheet3.conditional_format(xlsxwriter.utility.xl_range(
        0, 0, len(bundleMix), len(bundleMix.columns)-1), {'type': 'no_errors', 'format': border_fmt})
    
    worksheet4 = writer.sheets['Detail_Err']
    worksheet4.conditional_format(xlsxwriter.utility.xl_range(
        0, 0, len(detail_err), len(detail_err.columns)-1), {'type': 'no_errors', 'format': border_fmt})

    # chỉnh độ rộng của cột
    writer.sheets['Sum_bundle'].set_column(xlsxwriter.utility.xl_range(
        0, 0, len(KickOutReport), len(KickOutReport.columns)-1), 15)
    writer.sheets['Detail'].set_column(xlsxwriter.utility.xl_range(
        0, 0, len(imageFile), len(imageFile.columns)-1), 15)
    writer.sheets['Error Page'].set_column(xlsxwriter.utility.xl_range(
        0, 0, len(bundleErrorGroup), len(bundleErrorGroup.columns)-1), 15)
    writer.sheets['Mix_bundle'].set_column(xlsxwriter.utility.xl_range(
        0, 0, len(bundleMix), len(bundleMix.columns)-1), 15)
    writer.sheets['Detail_Err'].set_column(xlsxwriter.utility.xl_range(
        0, 0, len(detail_err), len(detail_err.columns)-1), 15)
    writer.close()
    engine.dispose()


    FILE = bundle_link+ '\\'+'Weekly_report_W'+week+'.xlsx'
    for i in range(0, 4):
        if i == 1:
            continue  # Bỏ qua sheet 1
        else:
            # Đọc dữ liệu từ sheet
            pd_xl_file = pd.ExcelFile(FILE)
            df = pd_xl_file.parse(sheet_name=i)
            
            # Thiết lập kích thước ảnh dựa trên số dòng và số cột
            row_count, col_count = df.shape
            cell_width = 100
            cell_height = 30
            img_width = cell_width * col_count
            img_height = cell_height * (row_count + 1)  # +1 cho hàng tiêu đề

            # Tạo ảnh trống
            img = Image.new("RGB", (img_width, img_height), "white")
            draw = ImageDraw.Draw(img)

            # Vẽ tiêu đề (tên các cột)
            for j, column_name in enumerate(df.columns):
                x0 = j * cell_width
                y0 = 0
                x1 = x0 + cell_width
                y1 = cell_height
                draw.rectangle([x0, y0, x1, y1], outline="black", fill="lightgrey")
                draw.text((x0 + 5, y0 + 5), str(column_name), fill="black")

            # Vẽ dữ liệu trong bảng
            for i_row, row in df.iterrows():
                for j, cell_value in enumerate(row):
                    x0 = j * cell_width
                    y0 = (i_row + 1) * cell_height
                    x1 = x0 + cell_width
                    y1 = y0 + cell_height
                    draw.rectangle([x0, y0, x1, y1], outline="black", fill="white")
                    draw.text((x0 + 5, y0 + 5), str(cell_value), fill="black")

            # Lưu ảnh với tên file chứa ngày và số thứ tự sheet
            name = f"{week}_{i}.png"
            img.save(f"{bundle_link}\\{name}")
    print('finished!')