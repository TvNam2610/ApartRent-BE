# -*- coding: utf-8 -*-
"""
Created on Sun Apr 19 16:49:44 2020

@author: dule4
"""

import cv2
import os
from pathlib import Path
from pyzbar import pyzbar
import numpy as np
import time
import mysql.connector
from datetime import datetime
from sqlalchemy import create_engine
import pandas as pd

hostname = '10.144.12.93'
engine = create_engine(
    'mysql+mysqlconnector://i_admin:Hy$2020@10.144.12.93:3306/linebalancing', echo=False)


def resizeImage(self, image, scale):
    width = int(image.shape[1]*scale/100)
    height = int(image.shape[0]*scale/100)
    dim = (width, height)
    return cv2.resize(image, dim)


def pointInRect(left, top, width, height, x, y):
    top = top-height/2
    bottom = top+height
    if y >= top and y <= bottom:
        return True
    else:
        return False


def processBundleList(bundle_list):
    if len(bundle_list) > 1:
        if bundle_list[0]['barcode'][6:10] != bundle_list[1]['barcode'][6:10]:
            mylist = [{'barcode': bundle_list[0]['barcode'][0:6], 'count':0}]
            # mycode=[{'code':bundle_list[0]['barcode'][6:10], 'count':0}]
            # is_special=False
            for bundle_row in bundle_list:
                for mylist_row in mylist:
                    if mylist_row['barcode'] == bundle_row['barcode'][0:6]:
                        mylist_row['count'] = mylist_row['count']+1
                        break
                    else:
                        mylist.append(
                            {'barcode': bundle_row['barcode'][0:6], 'count': 0})
                # for mycode_row in mycode:
                #     if mycode_row['code']==bundle_row['barcode'][6:10]:
                #         mycode_row['count']=mycode_row['count']+1
                #         is_special=True
                #     else:
                #         mycode.append({'code':bundle_row['barcode'][6:10], 'count':0})

            if len(mylist) > 1:
                barcode = max(mylist, key=lambda x: x['count'])['barcode']
                for bundle_row in bundle_list:
                    if bundle_row['barcode'][0:6] != barcode:
                        bundle_row['barcode'] = bundle_row['barcode'].replace(
                            bundle_row['barcode'][0:6], barcode)
    return bundle_list


def check_duplicate_irr(irr_list, irr_x, irr_y):
    result = True
    for irr in irr_list:
        if irr_x <= irr['x']+200 and irr_x >= irr['x']-200 and irr_y <= irr['y']+50 and irr_y >= irr['y']-50:
            result = False
            break
    return result


def camera1Process(image):
    # print(filePath)
    scale = 100
    width = int(image.shape[1]*scale/100)
    height = int(image.shape[0]*scale/100)
    dim = (width, height)
    image = cv2.resize(image, dim)
    if width > height:
        image = cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
    image = cv2.rotate(image, cv2.ROTATE_180)
    img_copy = image.copy()
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    canny = cv2.Canny(gray, 200, 255, 1)
    blur = cv2.blur(canny, (4, 4))
    kernel = np.ones((4, 4), np.uint8)
    img_dilate = cv2.dilate(blur, kernel, iterations=1)
    img_media = cv2.medianBlur(img_dilate, 3)
    _, threshold = cv2.threshold(
        img_media, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    blur = cv2.blur(threshold, (4, 4))
    contours, h = cv2.findContours(
        blur.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    bundle_list = []
    ID_list = []
    IRR_list = []
    QC_ID = ''
    paper_type = ''
    worklot = ''
    spec_code = ''
    OT_time = ''
    OT_type = ''
    for cnt in contours:
        (x, y, w, h) = cv2.boundingRect(cnt)
        if w+h >= 300 and w+h < 1200:
            rect = cv2.minAreaRect(cnt)
            angle = rect[2]
            box = cv2.boxPoints(rect)
            box = np.int0(box)
            subImg = image[y:y+h, x:x+w]
            sub_rows, sub_cols, _ = subImg.shape
            if angle > 70:
                rot = cv2.getRotationMatrix2D(
                    (sub_cols/2, sub_rows/2), angle-90, 1)
            else:
                rot = cv2.getRotationMatrix2D(
                    (sub_cols/2, sub_rows/2), angle, 1)
            subImg = cv2.warpAffine(subImg, rot, (sub_cols, sub_rows))
            scale = 100
            width = int(subImg.shape[1]*scale/100)
            height = int(subImg.shape[0]*scale/100)
            dim = (width, height)
            scaled_img = cv2.resize(subImg, dim)
            barcodes = pyzbar.decode(scaled_img, symbols=[
                                     pyzbar.ZBarSymbol.CODE39])
            if len(barcodes) > 0:
                barcode = barcodes[0][0]
                barcode_temp = str(barcode, 'utf-8')
                # BUNDLE BARCODE
                if len(barcode_temp) == 12 and not barcode_temp.isdigit() and barcode_temp.isalnum() and (barcode_temp[6:12]).isdigit():
                    bundle_list.append(
                        {"barcode": barcode_temp, "x": x+w, "y": y+int(h/2), 'w': w, 'h': h})
                    cv2.circle(image, (x+w, y+int(height/2)),
                               5, (255, 0, 255), 10)
                elif len(barcode_temp) == 5:  # ID EMPLOYEE BARCODE
                    if barcode_temp.isdigit() and h > w/4:
                        ID_list.append(
                            {"barcode": str(barcode_temp), "x": x, "y": y+int(h/2), "w": w, "h": h})
                    cv2.circle(image, (x, y+int(height/2)), 5, (0, 0, 255), 10)
                elif len(barcode_temp) == 3 and barcode_temp.isdigit():  # IRR BARCODE
                    if len(IRR_list) >= 1:
                        irr_check = check_duplicate_irr(IRR_list, x, y)
                        if irr_check == True and barcode_temp.isdigit():
                            if int(barcode_temp) < 999:
                                IRR_list.append(
                                    {"barcode": barcode_temp, "x": x, "y": y+int(h/2)})
                                cv2.circle(image, (x, y+int(height/2)),
                                           5, (0, 128, 255), 10)
                    else:
                        if barcode_temp.isdigit():
                            if int(barcode_temp) < 999:
                                IRR_list.append(
                                    {"barcode": barcode_temp, "x": x, "y": y+int(h/2)})
                                cv2.circle(image, (x, y+int(height/2)),
                                           5, (0, 128, 255), 10)
                elif len(barcode_temp) == 6 and 'SEW' not in barcode_temp and barcode_temp.isdigit():  # ID QC BARCODE
                    if barcode_temp == '888888' or barcode_temp == '777777':
                        spec_code = barcode_temp
                    else:
                        QC_ID = barcode_temp
                elif 'SEW' in barcode_temp:  # PAPER TYPE: SEWING/NSEWING BARCODE
                    paper_type = barcode_temp
                # PAPER TYPE: SEWING/NSEWING BARCODE
                elif barcode_temp.isdigit() and len(barcode_temp) == 8:
                    worklot = barcode_temp
                else:
                    barcode_temp="NSEWING"
                    paper_type=barcode_temp
                cv2.putText(image, barcode_temp, (x, y+int(height/2)),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 165, 255), 4)
                cv2.rectangle(image, (x, y), (x+w, y+h), (255, 0, 0), 4)
    barcodes = pyzbar.decode(img_copy, symbols=[pyzbar.ZBarSymbol.CODE39])
    for barcode in barcodes:
        barcode_str = str(barcode[0], 'utf-8')
        (x, y, w, h) = barcode.rect
        if 'SEW' in barcode_str:
            if paper_type == '':
                paper_type = barcode_str
                cv2.putText(image, barcode_str, (x, y),
                            cv2.FONT_HERSHEY_SCRIPT_SIMPLEX, 1.5, (0, 128, 0), 4)
                cv2.rectangle(image, (x, y), (x+w, y+h), (255, 0, 0), 4)
        elif barcode_str.isdigit() and len(barcode_str) == 8:
            if worklot == '':
                worklot = barcode_str
        elif len(barcode_str) == 3:
            if barcode_str.isdigit():  # IRR
                if w+h > 100 and int(barcode_str) < 999:
                    if len(IRR_list) >= 1:
                        irr_check = check_duplicate_irr(IRR_list, x, y)
                        if irr_check == True:
                            IRR_list.append(
                                {"barcode": barcode_str, "x": x, "y": y+int(h/2)})
                            cv2.circle(image, (x, y+int(h/2)),
                                       5, (0, 128, 255), 10)
                    else:
                        IRR_list.append(
                            {"barcode": barcode_str, "x": x, "y": y+int(h/2)})
                        cv2.circle(image, (x, y+int(h/2)),
                                   5, (0, 128, 255), 10)
                        
        elif len(barcode_str) == 6 and 'SEW' not in barcode_str and barcode_str.isdigit():
            if barcode_str == '888888' or barcode_str == '777777':
                if spec_code == '':
                    spec_code = barcode_str
                    cv2.putText(image, barcode_str, (x, y+int(h/2)),
                                cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 165, 255), 4)
                    cv2.rectangle(image, (x, y), (x+w, y+h), (255, 0, 0), 4)
            else:
                if QC_ID == '':
                    QC_ID = barcode_str
                    cv2.putText(image, barcode_str, (x, y+int(h/2)),
                                cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 165, 255), 4)
                    cv2.rectangle(image, (x, y), (x+w, y+h), (255, 0, 0), 4)
        elif len(barcode_str) == 5 and len(ID_list) < len(bundle_list) and barcode_str.isdigit():
            zbarCheck = False  # outter
            for ID_element in ID_list:
                if ID_element['barcode'] == barcode_str:
                    if pointInRect(ID_element['x'], ID_element['y'], ID_element['w'], ID_element['h'], x, y) == True:
                        zbarCheck = True
            if zbarCheck == False:
                ID_list.append({"barcode": barcode_str, "x": x,
                               "y": y+int(h/2), "w": w, "h": h})
                cv2.putText(image, barcode_str, (x, y+int(h/2)),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 165, 255), 4)
                cv2.rectangle(image, (x, y), (x+w, y+h), (255, 0, 0), 4)
                cv2.circle(image, (x, y+int(h/2)), 5, (0, 128, 255), 10)
        elif len(barcode_str) == 12 and not barcode_str.isdigit() and barcode_str.isalnum() and (barcode_str[6:12]).isdigit():
            zbarCheck = False  # outter
            for bundle_element in bundle_list:
                if bundle_element['barcode'] == barcode_str:
                    if pointInRect(bundle_element['x'], bundle_element['y'], bundle_element['w'], bundle_element['h'], x, y) == True:
                        zbarCheck = True
            if zbarCheck == False:
                bundle_list.append(
                    {"barcode": barcode_str, "x": x+w, "y": y+int(h/2), 'w': w, 'h': h})
                cv2.putText(image, barcode_str, (x, y+int(h/2)),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 165, 255), 4)
                cv2.rectangle(image, (x, y), (x+w, y+h), (255, 0, 0), 4)
                cv2.circle(image, (x+w, y+int(h/2)), 5, (0, 128, 255), 10)

    ID_list=sorted(ID_list, key=lambda k:k['y'])
    QC_ID=QC_ID+spec_code
    if 'NSEW' not in paper_type:
        bundle_list = processBundleList(bundle_list)
    return image, QC_ID, paper_type, worklot, bundle_list, ID_list, IRR_list

def irr_upload(ticket, irr, image_name):
    # check IRR
    irr_check = pd.read_sql(
        'select IRR from qc_endline_record where Ticket="'+ticket+'";', engine)
    engine.dispose()
    if len(irr_check) == 0:  # not exist in table
        mydb = mysql.connector.connect(
            host='10.144.12.93', user='i_admin', passwd='Hy$2020', database="linebalancing")
        myCursor = mydb.cursor()
        thisTime = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        query = ('replace into qc_endline_record (TICKET, IRR, FILE, TimeUpdate) '
                 'values (%s, %s, %s, %s)')
        values = (ticket, irr, image_name, thisTime)
        myCursor.execute(query, values)
        mydb.commit()
        mydb.close()


def processSewing(worklot, bundle_list, ID_list, IRR_list, image, image_name):
    barcode_dict = []
    ID_bundle = []
    IRR_bundle = []
    preID = ''
    preYID = 0
    preW = 0
    for ID_row in ID_list:
        minDist = 1000000000
        bundle = ''
        ID = ID_row['barcode']
        x = ID_row['x']
        y = ID_row['y']
        if (ID != preID and preYID+50 < y) or (ID == preID and preYID+70 < y):
            minX = 0
            minY = 0
            for bundle_row in bundle_list:
                if bundle_row['barcode'] not in ID_bundle:
                    distance = (
                        x-bundle_row['x'])*(x-bundle_row['x'])+(y-bundle_row['y'])*(y-bundle_row['y'])
                    if distance < minDist:
                        bundle = bundle_row['barcode']
                        minX = bundle_row['x']
                        minY = bundle_row['y']
                        minDist = distance
            if bundle != '' and y+120 > minY and y-120 < minY:
                ID_bundle.append(bundle)
                barcode_dict.append({'ID': ID, 'bundle': bundle, 'IRR': '000', 'IRR1': '000',
                                    'IRR2': '000', 'worklot': worklot, 'x': minX, 'y': minY})
                cv2.line(image, (x, y), (minX, minY), (255, 0, 0), 4)
            preID = ID
            preW = ID_row['w']
            preYID = ID_row['y']
    for IRR_row in IRR_list:
        minDist = 1000000000
        bundle = ''
        IRR = IRR_row['barcode']
        x = IRR_row['x']
        y = IRR_row['y']
        minX = 0
        minY = 0
        for bundle_row in bundle_list:
            # if bundle_row['barcode'] not in IRR_bundle:
            distance = (x-bundle_row['x'])*(x-bundle_row['x']) + \
                (y-bundle_row['y'])*(y-bundle_row['y'])
            if distance < minDist:
                bundle = bundle_row['barcode']
                minX = bundle_row['x']
                minY = bundle_row['y']
                minDist = distance
        if bundle != '' and y+150 > minY and y-150 < minY:
            IRR_bundle.append(bundle)
            # if bundle_ow['IRR']!='000':
            #     bundle_row['IRR']=bundle_row['IRR']+';'+IRR
            # else:
            irr_upload(bundle, IRR, image_name)
            for bundle_barcode in barcode_dict:
                if bundle_barcode['bundle'] == bundle:
                    if bundle_barcode['IRR'] == '000':
                        bundle_barcode['IRR'] = IRR
                    elif bundle_barcode['IRR1'] == '000':
                        bundle_barcode['IRR1'] = IRR
                    elif bundle_barcode['IRR2'] == '000':
                        bundle_barcode['IRR2'] = IRR
                    break
            cv2.line(image, (x, y), (minX, minY), (255, 0, 0), 4)
    return image, barcode_dict


def processNonSewing(worklot, bundle_list, ID_list, IRR_list, image, image_name):
    barcode_dict = []
    IRR_bundle = []
    if len(ID_list) == 1:#or (len(ID_list) == 2 and ID_list[0]['barcode'] == ID_list[1]['barcode'] and ID_list[0]['y']+ID_list[0]['w']*0.5 > ID_list[1]['y']):
        if ID_list[0]['y'] < image.shape[0]/2:
            minY = 100000
            barcode_min = ''
            for bundle in bundle_list:  # kiem tra tem nam o vi tri nao
                if minY > bundle['y']:
                    minY = bundle['y']
                    barcode_min = bundle['barcode']
            if ID_list[0]['y']+ID_list[0]['w']/3 < minY:  # employee earn all
                for bundle in bundle_list:
                    barcode_dict.append({'ID': ID_list[0]['barcode'], 'bundle': bundle['barcode'],
                                        'IRR': '000', 'IRR1': '000', 'IRR2': '000', 'worklot': worklot})
                    cv2.line(image, (ID_list[0]['x'], ID_list[0]['y']),
                             (bundle['x'], bundle['y']), (255, 0, 0), 4)
            else:
                barcode_dict.append({'ID': ID_list[0]['barcode'], 'bundle': barcode_min,
                                    'IRR': '000', 'IRR1': '000', 'IRR2': '000', 'worklot': worklot})
                cv2.line(image, (ID_list[0]['x'], ID_list[0]
                         ['y']), (bundle['x'], minY), (255, 0, 0), 4)
        else:
            maxY = 0
            barcode_max = ''
            for bundle in bundle_list:
                if maxY < bundle['y']:
                    maxY = bundle['y']
                    barcode_max = bundle['barcode']
            if ID_list[0]['y']-ID_list[0]['w']/3 > maxY:  # employee earn all
                for bundle in bundle_list:
                    barcode_dict.append({'ID': ID_list[0]['barcode'], 'bundle': bundle['barcode'],
                                        'IRR': '000', 'IRR1': '000', 'IRR2': '000', 'worklot': worklot})
                    cv2.line(image, (ID_list[0]['x'], ID_list[0]['y']),
                             (bundle['x'], bundle['y']), (255, 0, 0), 4)
            else:
                barcode_dict.append({'ID': ID_list[0]['barcode'], 'bundle': barcode_max,
                                    'IRR': '000', 'IRR1': '000', 'IRR2': '000', 'worklot': worklot})
                cv2.line(image, (ID_list[0]['x'], ID_list[0]
                         ['y']), (bundle['x'], maxY), (255, 0, 0), 4)
    else:
        barcode_dict = []
        ID_bundle = []
        preID = ''
        preYID = 0
        preW = 0
        for ID_row in ID_list:
            minDist = 100000000
            bundle = ''
            ID = ID_row['barcode']
            x = ID_row['x']
            y = ID_row['y']
            if ID != preID or (ID == preID and preYID+preW*0.1 < y):
                minX = 0
                minY = 0
                for bundle_row in bundle_list:
                    if bundle_row['barcode'] not in ID_bundle:
                        distance = (
                            x-bundle_row['x'])*(x-bundle_row['x'])+(y-bundle_row['y'])*(y-bundle_row['y'])
                        if distance < minDist:
                            bundle = bundle_row['barcode']
                            minX = bundle_row['x']
                            minY = bundle_row['y']
                            minDist = distance
                if bundle != '':
                    # ID_bundle.append(bundle)
                    barcode_dict.append(
                        {'ID': ID, 'bundle': bundle, 'IRR': '000', 'worklot': worklot})
                    cv2.line(image, (x, y), (minX, minY), (255, 0, 0), 4)
                preID = ID
                preW = ID_row['w']
                preYID = ID_row['y']
    for IRR_row in IRR_list:
        minDist = 1000000000
        bundle = ''
        IRR = IRR_row['barcode']
        x = IRR_row['x']
        y = IRR_row['y']
        minX = 0
        minY = 0
        for bundle_row in bundle_list:
            # if bundle_row['barcode'] not in IRR_bundle:
            distance = (x-bundle_row['x'])*(x-bundle_row['x']) + \
                (y-bundle_row['y'])*(y-bundle_row['y'])
            if distance < minDist:
                bundle = bundle_row['barcode']
                minX = bundle_row['x']
                minY = bundle_row['y']
                minDist = distance
        if bundle != '' and y+150 > minY and y-150 < minY:
            IRR_bundle.append(bundle)
            # if bundle_ow['IRR']!='000':
            #     bundle_row['IRR']=bundle_row['IRR']+';'+IRR
            # else:
            irr_upload(bundle, IRR, image_name)
            # for bundle_barcode in barcode_dict:
            #     if bundle_barcode['bundle']==bundle:
            #         if bundle_barcode['IRR']=='000':
            #             bundle_barcode['IRR']=IRR
            #         elif bundle_barcode['IRR1']=='000':
            #             bundle_barcode['IRR1']=IRR
            #         elif bundle_barcode['IRR2']=='000':
            #             bundle_barcode['IRR2']=IRR
            #         break
            cv2.line(image, (x, y), (minX, minY), (255, 0, 0), 4)
    return image, barcode_dict


def get_date_format(date):
    year = date[0:4]
    month = date[5:7]
    day = date[8:10]
    return year+month+day

# def getBundleList(bundle):
#     data=pd.read_sql('select TICKET from bundleticket_active where TICKET like "'+bundle+'" and TICKET not like')


def uploadSewingData(QC_ID, barcode_dict, image_name, check, worklot):
    mydb = mysql.connector.connect(
        host='10.144.12.93', user='i_admin', passwd='Hy$2020', database="linebalancing")
    myCursor = mydb.cursor()
    date = datetime.now().strftime('%Y%m%d')
    data_update =[]
    for barcode in barcode_dict:
        ticket = barcode['bundle']
        bundle = ticket[0:6]
        code = "0"+str(ticket[6:9])
        unit = ticket[9:12]
        employee = barcode['ID']
        irr = barcode['IRR']
        irr1 = barcode['IRR1']
        irr2 = barcode['IRR2']
        qc = QC_ID
        thisTime = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        data_update.append((str(ticket),str(employee),str(date),str(bundle),str(code),str(irr),str(irr1),str(irr2),str(qc),str(image_name),str(check),str(thisTime),str(worklot),str(unit)))
    
        # check TICKET
    values = ', '.join(map(str, data_update))
    query = ('replace into employee_scanticket (TICKET, EMPLOYEE, DATE, STYLE, OPERATION_CODE, IRR, IRR1, IRR2, QC, FILE, IS_FULL, TimeUpdate, WORK_LOT,UNITS) '
             ' VALUES {}').format(values)
    # values = (ticket, employee, date, bundle, code, irr, irr1,
    #             irr2, qc, image_name, check, thisTime, worklot,unit)
    myCursor.execute(query, values)
    mydb.commit()
    mydb.close()
    engine.dispose()
    return True


def uploadNonSewingData(QC_ID, barcode_dict, image_name, check, worklot):
    mydb = mysql.connector.connect(
        host='10.144.12.93', user='i_admin', passwd='Hy$2020', database="linebalancing")
    myCursor = mydb.cursor()
    date = datetime.now().strftime('%Y%m%d')
    for barcode in barcode_dict:
        ticket = barcode['bundle']
        bundle = ticket[0:6]
        code = "0"+ticket[6:9]
        unit = ticket[9:12]
        employee = barcode['ID']
        irr = barcode['IRR']
        qc = '000000'
        thisTime = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        query = ('replace into employee_scanticket (TICKET, EMPLOYEE, DATE, STYLE, OPERATION_CODE, IRR, QC, FILE, IS_FULL, TimeUpdate, WORK_LOT,UNITS) '
                    'values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,%s)')
        values = (ticket, employee, date, bundle, code, irr,
                    qc, image_name, check, thisTime, worklot,unit)
        myCursor.execute(query, values)
        mydb.commit()
    mydb.close()
    return True


def uploadBundleList(bundle_list, nameFile):
    mydb = mysql.connector.connect(
        host='10.144.12.93', user='i_admin', passwd='Hy$2020', database="linebalancing")
    myCursor = mydb.cursor()
    for bundle in bundle_list:
        bd = bundle['barcode']
        query = ('Update bundleticket_active set FILE="' +
                 nameFile+'" where TICKET = "'+bd+'";')
        myCursor.execute(query)
        mydb.commit()
    mydb.close()


def uploadErrorData(nameFile):
    mydb = mysql.connector.connect(
        host='10.144.12.93', user='i_admin', passwd='Hy$2020', database="linebalancing")
    myCursor = mydb.cursor()
    today = datetime.now().strftime('%Y-%m-%d')
    date = get_date_format(today)
    thisTime = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    query = ('insert into bundleticket_error (DATE, FILE, TimeUpdate) '
             'values (%s, %s, %s)')
    values = (date, nameFile, thisTime)
    myCursor.execute(query, values)
    mydb.commit()
    mydb.close()
    return True


# def checkticket(barcode_dict):
#     result = True
#     for barcode in barcode_dict:
#         check = pd.read_sql(
#             'select TICKET from employee_scanticket where TICKET="'+barcode['bundle']+'";', engine)
#         engine.dispose()
#         if len(check) == 0:
#             result = False
#             break
#     print(result)
#     return result


if __name__ == "__main__":
    loadLink = 'C:\\Realtime\\OffLine'
    print('start process')
    flag = True
    err = 0
    while flag == True:
        try:
            entries = os.listdir(loadLink)
            for r, d, f in os.walk(loadLink):
                for entry in f:
                    if 'jpg' in entry:
                        if 'done' not in entry:
                            filePath = os.path.join(r, entry)
                            print(filePath)
                            fileLink = r
                            nameFile = Path(filePath).stem
                            print(nameFile)
                            doneFile = fileLink+'\\'+nameFile+'_done.jpg'
                            image = cv2.imread(filePath)
                            output_img1, QC_ID, paper_type, worklot, bundle_list, ID_list, IRR_list = camera1Process(
                                image)
                            # classified paper type:
                            if paper_type == 'SEWING':  # sewing
                                print('Proces Sewing')
                                output_img, barcode_dict = processSewing(
                                    worklot, bundle_list, ID_list, IRR_list, output_img1, nameFile)
                                check = '0'
                                if len(ID_list) == len(barcode_dict) and len(bundle_list) == len(barcode_dict):
                                    check = '1'
                                scale = 45
                                width = int(output_img.shape[1]*scale/100)
                                height = int(output_img.shape[0]*scale/100)
                                dim = (width, height)
                                output_img = cv2.resize(output_img, dim)
                                if os.path.isfile(doneFile):
                                    nameFile = nameFile+'f'
                                if len(barcode_dict) > 0:
                                    uploadSewingData(
                                        QC_ID, barcode_dict, nameFile, check, worklot)
                                else:
                                    uploadErrorData(nameFile)
                                try:
                                    cv2.imwrite(
                                        fileLink+'\\'+nameFile+'_done.jpg', output_img)
                                    os.remove(filePath)
                                except:
                                    print('cant delete file')
                                    continue
                            elif paper_type == 'NSEWING':
                                print('Proces NonSewing')  # non sewing
                                output_img, barcode_dict = processNonSewing(
                                    worklot, bundle_list, ID_list, IRR_list, output_img1, nameFile)
                                scale = 45
                                width = int(output_img.shape[1]*scale/100)
                                height = int(output_img.shape[0]*scale/100)
                                dim = (width, height)
                                output_img = cv2.resize(output_img, dim)
                                if os.path.isfile(doneFile):
                                    nameFile = nameFile+'f'
                                if len(barcode_dict)>0:
                                    uploadNonSewingData(QC_ID, barcode_dict, nameFile, '1', worklot)
                                else:
                                    uploadErrorData(nameFile)
                                try:
                                    cv2.imwrite(
                                        fileLink+'\\'+nameFile+'_done.jpg', output_img)
                                    os.remove(filePath)
                                except:
                                    print('cant delete file')
                                    continue
                            else:
                                print('Proces None Type')  # non sewing
                                output_img, barcode_dict = processNonSewing(
                                    worklot, bundle_list, ID_list, IRR_list, output_img1, nameFile)
                                scale = 45
                                width = int(output_img.shape[1]*scale/100)
                                height = int(output_img.shape[0]*scale/100)
                                dim = (width, height)
                                output_img = cv2.resize(output_img, dim)
                                if os.path.isfile(doneFile):
                                    nameFile = nameFile+'f'
                                if len(barcode_dict)>0:
                                    uploadNonSewingData(QC_ID, barcode_dict, nameFile, '1', worklot)
                                else:
                                    uploadErrorData(nameFile)
                                try:
                                    cv2.imwrite(
                                        fileLink+'\\'+nameFile+'_done.jpg', output_img)
                                    os.remove(filePath)
                                except:
                                    print('cant delete file')
                                    continue
        except:
            err=1
            print('something went wrong')
            continue
        # time.sleep(1)
        # H=datetime.now().hour
        # M=datetime.now().minute
        # if H==23 and M>=0:
        #     flag=False
        #     print('process stop now')
