# -*- coding: utf-8 -*-
"""
Created on Sun Apr 19 16:49:44 2020

@author: dule4
"""

import cv2, os
from pathlib import Path
from pyzbar import pyzbar
import numpy as np
import time
import mysql.connector
from datetime import datetime
from sqlalchemy import create_engine
import pandas as pd

hostname='pbvweb01v'
engine = create_engine('mysql+mysqlconnector://root:123456@pbvweb01v:3306/cutting_system', echo=False)

IRR_MAX_CODE=50

def resizeImage(self, image, scale):
    width=int(image.shape[1]*scale/100)
    height=int(image.shape[0]*scale/100)
    dim=(width, height)
    return cv2.resize(image, dim)  

def pointInRect(left, top, width, height, x, y):
    top=top-height/2
    bottom=top+height
    if y>=top and y<=bottom:
        return True
    else:
        return False
    
def processBundleList(bundle_list):
    if len(bundle_list)>1:
        if bundle_list[0]['barcode'][6:10]!=bundle_list[1]['barcode'][6:10]:
            mylist=[{'barcode':bundle_list[0]['barcode'][0:6], 'count':0}]
            # mycode=[{'code':bundle_list[0]['barcode'][6:10], 'count':0}]
            # is_special=False
            for bundle_row in bundle_list:
                for mylist_row in mylist:
                    if mylist_row['barcode']==bundle_row['barcode'][0:6]:
                        mylist_row['count']=mylist_row['count']+1
                        break
                    else:
                        mylist.append({'barcode':bundle_row['barcode'][0:6], 'count':0})
                # for mycode_row in mycode:
                #     if mycode_row['code']==bundle_row['barcode'][6:10]:
                #         mycode_row['count']=mycode_row['count']+1
                #         is_special=True
                #     else:
                #         mycode.append({'code':bundle_row['barcode'][6:10], 'count':0})
            
            if len(mylist)>1:
                barcode = max(mylist, key=lambda x:x['count'])['barcode']
                for bundle_row in bundle_list:
                    if bundle_row['barcode'][0:6]!=barcode:
                        bundle_row['barcode']=bundle_row['barcode'].replace(bundle_row['barcode'][0:6],barcode)
    return bundle_list

def check_duplicate_irr(irr_list, irr_x, irr_y):
    result=True
    for irr in irr_list:
        if irr_x<=irr['x']+100 and irr_x>=irr['x']-100 and irr_y<=irr['y']+50 and irr_y>=irr['y']-50:
            result=False
            break
    return  

def camera1Process(image):
    # print(filePath)
    scale=100
    width_f=int(image.shape[1]*scale/100)
    height_f=int(image.shape[0]*scale/100)
    dim=(width_f, height_f)
    image=cv2.resize(image, dim)
    if width_f>height_f:
        image=cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
    image=cv2.rotate(image, cv2.ROTATE_180)
    img_copy=image.copy()
    gray=cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    canny=cv2.Canny(gray, 200, 255, 1)
    blur=cv2.blur(canny, (8, 8))
    kernel = np.ones((5, 5), np.uint8)
    img_dilate = cv2.dilate(blur, kernel, iterations=1)
    img_media=cv2.medianBlur(img_dilate, 3)
    _, threshold=cv2.threshold(img_media, 0, 255, cv2.THRESH_BINARY|cv2.THRESH_OTSU)
    blur=cv2.blur(threshold, (8, 8))
    contours, h=cv2.findContours(blur.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    bundle_list=[]
    ID_list    =[]
    NIR_list   =[]#so luong loi
    IRR_list   =[]#ma so loi
    SLL_list   =[]#so luong lop
    SLM_list   =[]#so luong mau
    QC_ID      =''
    paper_type =''
    worklot    =''
    spec_code  =''
    table      =''
    for cnt in contours:  
        (x, y, w, h)=cv2.boundingRect(cnt)
        if w+h>=100 and w+h<1000:
            rect=cv2.minAreaRect(cnt)
            angle=rect[2]
            box=cv2.boxPoints(rect)
            box=np.int0(box)
            subImg=image[y:y+h, x:x+w]
            sub_rows, sub_cols, _=subImg.shape
            if angle>-45:
                rot=cv2.getRotationMatrix2D((sub_cols/2, sub_rows/2), angle, 1)
            else:
                rot=cv2.getRotationMatrix2D((sub_cols/2, sub_rows/2), 90+angle, 1)
            subImg=cv2.warpAffine(subImg, rot, (sub_cols, sub_rows))
            scale=100
            width=int(subImg.shape[1]*scale/100)
            height=int(subImg.shape[0]*scale/100)
            dim=(width, height)
            scaled_img=cv2.resize(subImg, dim)
            barcodes=pyzbar.decode(scaled_img, symbols=[pyzbar.ZBarSymbol.CODE39])
            if len(barcodes)>0:
                barcode=barcodes[0][0]
                barcode_temp=str(barcode,'utf-8')
                if len(barcode_temp)==10:#BUNDLE BARCODE
                    bundle_list.append({"barcode":barcode_temp, "x":x+w, "y":y+int(h/2), 'w':w, 'h': h})
                    cv2.circle(image, (x+w, y+int(height/2)), 5, (255, 0, 255), 10)
                elif len(barcode_temp)==5:#ID EMPLOYEE BARCODE
                    if barcode_temp.isdigit() and h>w/4:
                        ID_list.append({"barcode":str(barcode_temp), "x":x, "y":y+int(h/2), "w":w, "h": h})
                    cv2.circle(image, (x, y+int(height/2)), 5, (0, 0, 255), 10)
                elif len(barcode_temp)==3 and barcode_temp.isdigit():#IRR BARCODE
                    if int(barcode_temp)<IRR_MAX_CODE:#IRR_MAX_CODE
                        cv2.circle(image, (x, y+int(height/2)), 5, (0, 128, 255), 10)
                        IRR_list.append({"barcode":barcode_temp, "x":x, "y":y+int(h/2)})
                        # if x<width_f/2:
                        #     if width_f*1/4<x+150 and width_f/4>x-100:#So loi
                        #         NIR_list.append({"barcode":barcode_temp, "x":x, "y":y+int(h/2)})
                        #     else:
                        #         IRR_list.append({"barcode":barcode_temp, "x":x, "y":y+int(h/2)})
                        # else:
                        #     if width_f*3/4>x :#So loi
                        #         NIR_list.append({"barcode":barcode_temp, "x":x, "y":y+int(h/2)})
                        #     else:
                        #         IRR_list.append({"barcode":barcode_temp, "x":x, "y":y+int(h/2)})
                elif len(barcode_temp)==6 and 'CUT' not in barcode_temp and barcode_temp.isdigit():#ID QC BARCODE
                    if barcode_temp=='888888' or barcode_temp=='777777':
                        spec_code=barcode_temp
                    else:
                        QC_ID=barcode_temp
                elif 'CUT' in barcode_temp:#PAPER TYPE: SEWING/NSEWING BARCODE
                    paper_type=barcode_temp
                elif barcode_temp[0:2]=='98' and barcode_temp.isdigit() and len(barcode_temp)==8:#PAPER TYPE: SEWING/NSEWING BARCODE
                    worklot=barcode_temp
                elif len(barcode_temp)==4:
                    if barcode_temp.isdigit():
                        cv2.circle(image, (x, y+int(height/2)), 5, (0, 128, 255), 10)
                        if barcode_temp[0]=='4':#so luong lop
                            SLL_list.append({"barcode": barcode_temp[1:4], "x":x, "y":y+int(h/2)})
                        if barcode_temp[0]=='2':#so luong loi
                            NIR_list.append({"barcode": barcode_temp[1:4], "x":x, "y":y+int(h/2)})
                        if barcode_temp[0]=='3':#ma loi
                            IRR_list.append({"barcode": barcode_temp[1:4], "x":x+w, "y":y+int(h/2)})
                        if barcode_temp[0]=='1':#so luong mau
                            SLM_list.append({"barcode": barcode_temp[1:4], "x":x, "y":y+int(h/2)})
                elif len(barcode_temp)==9:
                    if barcode_temp[0:3]=='W98' and barcode_temp[3:9].isdigit():
                        paper_type='WLOTQC'
                        worklot=barcode_temp[1:9]
                elif len(barcode_temp)==2:
                    if 'B' in barcode_temp:
                        table=barcode_temp
                cv2.putText(image, barcode_temp, (x,y+int(height/2)), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0,165,255), 4)
                cv2.rectangle(image, (x,y), (x+w,y+h), (255, 0, 0), 4)
    barcodes=pyzbar.decode(img_copy, symbols=[pyzbar.ZBarSymbol.CODE39])
    for barcode in barcodes:
        barcode_str=str(barcode[0], 'utf-8')
        (x,y,w,h) = barcode.rect
        if 'CUT' in barcode_str:
            if paper_type=='':
                paper_type=barcode_str
                cv2.putText(image, barcode_str, (x,y), cv2.FONT_HERSHEY_SCRIPT_SIMPLEX, 1.5, (0,128, 0), 4)
                cv2.rectangle(image, (x,y), (x+w,y+h), (255, 0, 0), 4)
        elif barcode_str[0:2]=='98' and len(barcode_str)==8:
            if worklot=='':
                worklot=barcode_str
        # elif len(barcode_str)==3 and barcode_str.isdigit():#IRR
        #     if w+h>100 and int(barcode_str)<IRR_MAX_CODE:#IRR_MAX_CODE
        #         if len(IRR_list)>=1:
        #             irr_check=check_duplicate_irr(IRR_list, x, y)
        #             if irr_check==True:
        #                 IRR_list.append({"barcode":barcode_str, "x":x, "y":y+int(h/2)})
        #                 cv2.circle(image, (x, y+int(h/2)), 5, (0, 128, 255), 10)
        #         else:
        #             IRR_list.append({"barcode":barcode_str, "x":x, "y":y+int(h/2)})
        #             cv2.circle(image, (x, y+int(h/2)), 5, (0, 128, 255), 10)
        elif len(barcode_str)==6 and 'CUT' not in barcode_str and barcode_str.isdigit():
            if barcode_str=='888888' or barcode_str=='777777':
                if spec_code=='':
                    spec_code=barcode_str
                    cv2.putText(image, barcode_str, (x,y+int(h/2)), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0,165,255), 4)
                    cv2.rectangle(image, (x,y), (x+w,y+h), (255, 0, 0), 4)
            else:
                if QC_ID=='':
                    QC_ID=barcode_str
                    cv2.putText(image, barcode_str, (x,y+int(h/2)), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0,165,255), 4)
                    cv2.rectangle(image, (x,y), (x+w,y+h), (255, 0, 0), 4)
        elif len(barcode_str)==5 and len(ID_list)<len(bundle_list) and barcode_str.isdigit():
            zbarCheck=False#outter
            for ID_element in ID_list:
                if ID_element['barcode']==barcode_str:
                    if pointInRect(ID_element['x'], ID_element['y'], ID_element['w'], ID_element['h'], x, y)==True:
                        zbarCheck=True
            if zbarCheck==False:
                ID_list.append({"barcode":barcode_str, "x":x, "y":y+int(h/2), "w":w, "h": h})
                cv2.putText(image, barcode_str, (x,y+int(h/2)), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0,165,255), 4)
                cv2.rectangle(image, (x,y), (x+w,y+h), (255, 0, 0), 4)
                cv2.circle(image, (x, y+int(h/2)), 5, (0, 128, 255), 10)
        elif len(barcode_str)==10:
            zbarCheck=False#outter
            for bundle_element in bundle_list:
                if bundle_element['barcode']==barcode_str:
                    if pointInRect(bundle_element['x'], bundle_element['y'], bundle_element['w'], bundle_element['h'], x, y)==True:
                        zbarCheck=True
            if zbarCheck==False:
                bundle_list.append({"barcode":barcode_str, "x":x+w, "y":y+int(h/2), 'w':w, 'h': h})
                cv2.putText(image, barcode_str, (x,y+int(h/2)), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0,165,255), 4)
                cv2.rectangle(image, (x,y), (x+w,y+h), (255, 0, 0), 4)
                cv2.circle(image, (x+w, y+int(h/2)), 5, (0, 128, 255), 10)
        elif len(barcode_str)==2:
            if 'B' in barcode_str:
                table=barcode_str
    ID_list=sorted(ID_list, key=lambda k:k['y'])
    QC_ID=QC_ID+spec_code
    if 'NCUT' not in paper_type:
        bundle_list=processBundleList(bundle_list)
    return image, QC_ID, paper_type, worklot[2:8], bundle_list, ID_list, IRR_list, NIR_list, SLL_list, SLM_list, table

def irr_upload(ticket, NIR, irr, image_name):
    #check IRR
    irr_check=pd.read_sql('select IRR from qc_endline_record where Ticket="'+ticket+'";', engine)
    engine.dispose()
    if len(irr_check)==0:#not exist in table
        mydb=mysql.connector.connect(host=hostname, user='root', passwd='123456', database="cutting_system")
        myCursor=mydb.cursor()
        thisTime=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        query=('replace into qc_endline_record (TICKET, NUM_IRR, IRR, FILE, TimeUpdate) '
                'values (%s, %s, %s, %s, %s)')
        values=(ticket, NIR, irr, image_name, thisTime)
        myCursor.execute(query, values)
        mydb.commit()
        mydb.close()
        
def irr_upload_worklot(worklot, ticket, nir, irr, image_name, QC_ID):
    #check IRR
    if worklot=='':
        irr_check=pd.read_sql('select WORK_LOT from bundleticket_active where Ticket="'+ticket+'";', engine)
        engine.dispose()
        if len(irr_check)>0:
            worklot=irr_check.iloc[0,0]
    ID=worklot+irr
    id_check=pd.read_sql('select ID from qc_worklot_irr where ID="'+ID+'";', engine)
    engine.dispose()
    if len(id_check)==0:#not exist in table
        mydb=mysql.connector.connect(host=hostname, user='root', passwd='123456', database="cutting_system")
        myCursor=mydb.cursor()
        thisTime=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        query=('replace into qc_worklot_irr (ID, NUM_IRR, QC, WORK_LOT, IRR, FILE, TimeUpdate) '
                'values (%s, %s, %s, %s, %s, %s, %s)')
        values=(ID, nir, QC_ID, worklot, irr, image_name, thisTime)
        myCursor.execute(query, values)
        mydb.commit()
        mydb.close()
        
def direct_of_image(x, y, w, h):
    if y<h/2:
        return 1#right direction
    else:
        return 0#rotated

def processWorklotQC(ID_list, IRR_list, NIR_list, SLL_list, SLM_list, image):
    data_list=[]
    if len(IRR_list)==0 and len(SLM_list)>0:
        data_list.append({'IRR': '', 'ID': '', 'NIR': '000', 'SLM': SLM_list[0]['barcode']})
    for IRR_row in IRR_list:
        IRR =IRR_row['barcode']
        x   =IRR_row['x']
        y   =IRR_row['y']
        ID=''
        for ID_row in ID_list:
            minX_ID = ID_row['x']
            minY_ID = ID_row['y']
            if y+80>minY_ID and y-80<minY_ID:
                ID      = ID_row['barcode']
                cv2.line(image, (x, y), (minX_ID, minY_ID), (255,0,0), 4)
        NIR ='001'
        for NIR_row in NIR_list:
            minX_NIR = NIR_row['x']
            minY_NIR = NIR_row['y']
            if y+80>minY_NIR and y-80<minY_NIR:
                NIR      = NIR_row['barcode']
                cv2.line(image, (x, y), (minX_NIR, minY_NIR), (255,0,0), 4)
        SLM ='001'
        if len(SLM_list)>0:
            SLM=SLM_list[0]['barcode']
        for SLM_row in SLM_list:
            minX_SLM = SLM_row['x']
            minY_SLM = SLM_row['y']
            if y+80>minY_SLM and y-80<minY_SLM:
                SLM      = SLM_row['barcode']
                cv2.line(image, (x, y), (minX_SLM, minY_SLM), (255,0,0), 4)
        data_list.append({'IRR': IRR, 'ID': ID, 'NIR': NIR, 'SLM': SLM})
    return image, data_list

def processSewing(worklot, bundle_list, ID_list, IRR_list, NIR_list, image, image_name):
    barcode_dict=[]
    ID_bundle=[]
    # IRR_bundle=[]
    preID =''
    preYID=0
    # preW  =0
    #match ID to Ticket
    for ID_row in ID_list:
        minDist=10000
        bundle=''
        ID   = ID_row['barcode']
        x    = ID_row['x']
        y    = ID_row['y']
        if (ID!=preID and preYID+50<y) or (ID==preID and preYID+70<y):
            minX = 0
            minY = 0
            for bundle_row in bundle_list:
                if bundle_row['barcode'] not in ID_bundle:
                    distance=(x-bundle_row['x'])*(x-bundle_row['x'])+(y-bundle_row['y'])*(y-bundle_row['y'])
                    if distance<minDist:
                        bundle  = bundle_row['barcode']
                        minX    = bundle_row['x']
                        minY    = bundle_row['y']
                        minDist = distance
            if bundle!='' and y+120>minY and y-120<minY:
                ID_bundle.append(bundle)
                barcode_dict.append({'ID':ID, 'bundle':bundle, 'worklot': worklot, 'x': minX, 'y': minY})
                cv2.line(image, (x, y), (minX, minY), (255,0,0), 4)
            preID =ID
            preYID=ID_row['y']
    return image, barcode_dict

def check_irr(worklot, bundle_list, IRR_list, NIR_list, image, image_name, QC_ID):
    for IRR_row in IRR_list:
        minDist=1000000000
        bundle=''
        IRR =IRR_row['barcode']
        x   =IRR_row['x']
        y   =IRR_row['y']
        minX=0
        minY=0
        for bundle_row in bundle_list:
            # if bundle_row['barcode'] not in IRR_bundle:
                distance=(x-bundle_row['x'])*(x-bundle_row['x'])+(y-bundle_row['y'])*(y-bundle_row['y'])
                if distance<minDist:
                    bundle  = bundle_row['barcode']
                    minX    = bundle_row['x']
                    minY    = bundle_row['y']
                    minDist = distance
        minDist_r=1000000000
        NIR_r='001'
        # IRR_r =IRR_row['barcode']
        x_r   =IRR_row['x']
        y_r   =IRR_row['y']
        minX_r=0
        minY_r=0
        for NIR_row in NIR_list:
            # if bundle_row['barcode'] not in IRR_bundle:
                distance=(x_r-NIR_row['x'])*(x_r-NIR_row['x'])+(y_r-NIR_row['y'])*(y_r-NIR_row['y'])
                if distance<minDist_r:
                    NIR_r     = NIR_row['barcode']
                    minX_r    = NIR_row['x']
                    minY_r    = NIR_row['y']
                    minDist_r = distance
        # print(minX_r, minY_r, dis)
        if bundle!='' and y+150>minY and y-150<minY:
            # IRR_bundle.append(bundle)
            NIR='001'
            if NIR_r!='001' and y_r+150>minY_r and y_r-150<minY_r:
                NIR=NIR_r
                print(NIR, IRR)
                cv2.line(image, (x, y), (minX_r, minY_r), (255,0,0), 4)
            irr_upload(bundle, NIR, IRR, image_name)
            cv2.line(image, (x, y), (minX, minY), (255,0,0), 4)
        else:
            NIR='001'
            if NIR_r!='001' and y_r+150>minY_r and y_r-150<minY_r:
                NIR=NIR_r
                cv2.line(image, (x, y), (minX_r, minY_r), (255,0,0), 4)
            irr_upload_worklot(worklot, bundle, NIR, IRR, image_name, QC_ID)
            
def processNonSewing(worklot, bundle_list, ID_list, IRR_list, NIR_list, image, image_name):
    barcode_dict=[]
    if (len(ID_list)==1 and (ID_list[0]['y']<=400 or ID_list[0]['y']>=image.shape[0]-400)) or (len(ID_list)==2 and ID_list[0]['barcode']==ID_list[1]['barcode'] and ID_list[0]['y']+ID_list[0]['w']*0.5>ID_list[1]['y']):
        if ID_list[0]['y']<image.shape[0]/2:
            minY=1000000000
            barcode_min=''
            for bundle in bundle_list:#kiem tra tem nam o vi tri nao
                if minY>bundle['y']:
                    minY=bundle['y']
                    barcode_min=bundle['barcode']
            if ID_list[0]['y']+ID_list[0]['w']/3<minY:#employee earn all
                for bundle in bundle_list:
                    barcode_dict.append({'ID': ID_list[0]['barcode'], 'bundle': bundle['barcode'], 'worklot': worklot, 'SLL': '000', 'x': bundle['x'], 'y': bundle['y']})
                    cv2.line(image, (ID_list[0]['x'], ID_list[0]['y']), (bundle['x'], bundle['y']), (255,0,0), 4)
            else:
                barcode_dict.append({'ID': ID_list[0]['barcode'], 'bundle': barcode_min, 'worklot': worklot, 'SLL': '000', 'x': minY, 'y': minY})
                cv2.line(image, (ID_list[0]['x'], ID_list[0]['y']), (bundle['x'], minY), (255,0,0), 4)
        else:
            maxY=0
            maxX=0
            barcode_max=''
            for bundle in bundle_list:
                if maxY<bundle['y']:
                    maxY=bundle['y']
                    maxX=bundle['x']
                    barcode_max=bundle['barcode']
            if ID_list[0]['y']-ID_list[0]['w']/3>maxY:#employee earn all
                for bundle in bundle_list:
                    barcode_dict.append({'ID': ID_list[0]['barcode'], 'bundle': bundle['barcode'],'worklot': worklot, 'SLL': '000', 'x': bundle['x'], 'y': bundle['y']})
                    cv2.line(image, (ID_list[0]['x'], ID_list[0]['y']), (bundle['x'], bundle['y']), (255,0,0), 4)
            else:
                barcode_dict.append({'ID': ID_list[0]['barcode'], 'bundle': barcode_max,'worklot': worklot, 'SLL': '000', 'x': maxX, 'y': maxY})
                cv2.line(image, (ID_list[0]['x'], ID_list[0]['y']), (bundle['x'], maxY), (255,0,0), 4)
    else:
        barcode_dict=[]
        ID_bundle=[]
        preID =''
        preYID=0
        preW  =0
        for ID_row in ID_list:
            minDist=1000000000
            bundle=''
            ID   = ID_row['barcode']
            x    = ID_row['x']
            y    = ID_row['y']
            if ID!=preID or (ID==preID and preYID+preW*0.1<y):
                minX = 0
                minY = 0
                for bundle_row in bundle_list:
                    if bundle_row['barcode'] not in ID_bundle:
                        distance=(x-bundle_row['x'])*(x-bundle_row['x'])+(y-bundle_row['y'])*(y-bundle_row['y'])
                        if distance<minDist:
                            bundle  = bundle_row['barcode']
                            minX    = bundle_row['x']
                            minY    = bundle_row['y']
                            minDist = distance
                print(minDist)
                if bundle!='' and y+80>minY and y-80<minY:
                    ID_bundle.append(bundle)
                    barcode_dict.append({'ID':ID, 'bundle':bundle, 'worklot': worklot, 'SLL': '000', 'x': minX, 'y': minY})
                    cv2.line(image, (x, y), (minX, minY), (255,0,0), 4)
                preID =ID
                preW  =ID_row['w']
                preYID=ID_row['y']
    for barcode_row in barcode_dict:
        SLL='000'
        y=barcode_row['y']
        x=barcode_row['x']
        for SLL_row in SLL_list:
            SLL=SLL_row['barcode']
            SLLy=SLL_row['y']
            SLLx=SLL_row['x']
            if y+80>SLLy and y-80<SLLy:
                barcode_row['SLL']=SLL
                cv2.line(image, (x, y), (SLLx, SLLy), (255,0,0), 4)
    return image, barcode_dict

def get_date_format(date):
    year=date[0:4]
    month=date[5:7]
    day=date[8:10]
    return year+month+day

# def getBundleList(bundle):
#     data=pd.read_sql('select TICKET from bundleticket_active where TICKET like "'+bundle+'" and TICKET not like')

def uploadSewingData(QC_ID, barcode_dict, image_name, check, worklot):
    mydb=mysql.connector.connect(host=hostname, user='root', passwd='123456', database="cutting_system")
    myCursor=mydb.cursor()
    today=datetime.now().strftime('%Y-%m-%d')
    for barcode in barcode_dict:
        ticket=barcode['bundle']
        bundle=ticket[0:6]
        code  =ticket[6:11]
        employee=barcode['ID']
        date=get_date_format(today)
        irr   =barcode['IRR']
        irr1  =barcode['IRR1']
        irr2  =barcode['IRR2']
        qc    =QC_ID
        thisTime=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        #check TICKET
        duplicate_check=pd.read_sql('select EMPLOYEE, WORK_LOT, IRR, FILE, TimeUpdate from employee_scanticket where TICKET="'+ticket+'";', engine)
        if len(duplicate_check)>0:
            if duplicate_check.iloc[0,0]!=employee:
                query=('replace into bundleticket_alert (TICKET, WORK_LOT, OLD_EMPLOYEE, OLD_FILE, OLD_IRR, OLD_TimeUpdate, NEW_EMPLOYEE, NEW_FILE, NEW_IRR, NEW_TimeUpdate, ERR_CODE) '
                    'values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)')
                values=(ticket, duplicate_check.iloc[0,1], duplicate_check.iloc[0,0], duplicate_check.iloc[0,3], duplicate_check.iloc[0,2], str(duplicate_check.iloc[0,4]), employee, image_name, irr, thisTime, '1')
                myCursor.execute(query, values)
                mydb.commit()
            else:
                query=('Update employee_scanticket set QC="'+qc+'", IRR="'+irr+'", IRR1="'+irr1+'", IRR2="'+irr2+'", FILE="'+image_name+'" where TICKET="'+ticket+'";')
                myCursor.execute(query)
                mydb.commit()
            if duplicate_check.iloc[0,2]!=irr:
                query=('replace into bundleticket_alert (TICKET, WORK_LOT, OLD_EMPLOYEE, OLD_FILE, OLD_IRR, OLD_TimeUpdate, NEW_EMPLOYEE, NEW_FILE, NEW_IRR, NEW_TimeUpdate, ERR_CODE) '
                    'values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)')
                values=(ticket, duplicate_check.iloc[0,1], duplicate_check.iloc[0,0], duplicate_check.iloc[0,3], duplicate_check.iloc[0,2], str(duplicate_check.iloc[0,4]), employee, image_name, irr, thisTime, '2')
                myCursor.execute(query, values)
                mydb.commit()
                query=('Update employee_scanticket set IRR="'+irr+'" where TICKET="'+ticket+'"')
                myCursor.execute(query)
                mydb.commit()
            query=("update employee_scanticket set IRR='"+irr+"', IRR1='"+irr1+"', IRR2='"+irr2+"', QC='"+qc+"', FILE='"+ image_name+"', IS_FULL='"+check+"', TimeModified='"+thisTime+"' where TICKET='"+ticket+"';")
            myCursor.execute(query)
            mydb.commit()
        else:
            query=('replace into employee_scanticket (TICKET, EMPLOYEE, DATE, BUNDLE, OPERATION_CODE, IRR, IRR1, IRR2, QC, FILE, IS_FULL, TimeUpdate, WORK_LOT) '
                'values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)')
            values=(ticket, employee, date, bundle, code, irr, irr1, irr2, qc, image_name, check, thisTime, worklot)
            myCursor.execute(query, values)
            mydb.commit()
    mydb.close()
    engine.dispose()
    return True

def uploadNonSewingData(QC_ID, barcode_dict, image_name, check, worklot):
    mydb=mysql.connector.connect(host=hostname, user='root', passwd='123456', database="cutting_system")
    myCursor=mydb.cursor()
    today=datetime.now().strftime('%Y-%m-%d')
    for barcode in barcode_dict:
        ticket=barcode['bundle']
        bundle=ticket[0:6]
        code  =ticket[6:11]
        employee=barcode['ID']
        sll   =barcode['SLL']
        date  =get_date_format(today)
        irr   =''#barcode['IRR']
        qc    = QC_ID
        # if QC_ID=='':
        #     qc='000000'
        thisTime=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        duplicate_check=pd.read_sql('select EMPLOYEE, WORK_LOT, IRR, FILE, TimeUpdate from employee_scanticket where TICKET like "'+ticket+'%" and WORK_LOT="'+worklot+'";', engine)
        if len(duplicate_check)>0:
            if str(duplicate_check.iloc[0,0])!=employee:
                query=('replace into bundleticket_alert (TICKET, WORK_LOT, OLD_EMPLOYEE, OLD_FILE, OLD_IRR, OLD_TimeUpdate, NEW_EMPLOYEE, NEW_FILE, NEW_IRR, NEW_TimeUpdate, ERR_CODE) '
                       'values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)')
                values=(ticket+worklot, duplicate_check.iloc[0,1], duplicate_check.iloc[0,0], duplicate_check.iloc[0,3], duplicate_check.iloc[0,2], str(duplicate_check.iloc[0,4]), employee, image_name, irr, thisTime, '1')
                myCursor.execute(query, values)
                mydb.commit()
            query=("update employee_scanticket set PLANT='"+sll+"', IRR='"+irr+"', QC='"+qc+"', FILE='"+ image_name+"', IS_FULL='"+check+"', TimeModified='"+thisTime+"' where TICKET='"+ticket+"';")
            myCursor.execute(query)
            mydb.commit()
        else:
            query=('replace into employee_scanticket (TICKET, PLANT, EMPLOYEE, DATE, BUNDLE, OPERATION_CODE, IRR, QC, FILE, IS_FULL, TimeUpdate, WORK_LOT) '
                'values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)')
            values=(ticket+worklot, sll, employee, date, bundle, code, irr, qc, image_name, check, thisTime, worklot)
            myCursor.execute(query, values)
            mydb.commit()
    mydb.close()
    engine.dispose()
    return True

def uploadErrorData(nameFile):
    mydb=mysql.connector.connect(host=hostname, user='root', passwd='123456', database="cutting_system")
    myCursor=mydb.cursor()
    today=datetime.now().strftime('%Y-%m-%d')
    date=get_date_format(today)
    thisTime=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    query=('insert into bundleticket_error (DATE, FILE, TimeUpdate) '
        'values (%s, %s, %s)')
    values=(date, nameFile, thisTime)
    myCursor.execute(query, values)
    mydb.commit()
    mydb.close()
    return True

def checkticket(barcode_dict, worklot):
    result=True
    for barcode in barcode_dict:
        check=pd.read_sql('select TICKET from employee_scanticket where TICKET like "'+barcode['bundle']+'%" and WORK_LOT="'+worklot+'";', engine)
        engine.dispose()
        if len(check)==0:
            result=False
            break
    return result

def upload_wlotQC(barcode_dict, worklot, QC_ID, nameFile, table_code):
    mydb=mysql.connector.connect(host=hostname, user='root', passwd='123456', database="cutting_system")
    myCursor=mydb.cursor()
    for barcode_row in barcode_dict:
        SLM=barcode_row['SLM']
        NIR=barcode_row['NIR']
        IRR=barcode_row['IRR']
        EMPLOYEE =barcode_row['ID']
        ID=worklot+SLM+NIR+IRR+EMPLOYEE+table_code
        thisTime=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        query=('replace into aql_record (ID, TABLE_CODE, WORK_LOT, QC, IRR, EMPLOYEE, NO_IRR, NO_SAMPLE, FILE, TimeUpdate) '
            'values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)')
        values=(ID, table_code, worklot, QC_ID, IRR, EMPLOYEE, NIR, SLM, nameFile, thisTime)
        myCursor.execute(query, values)
        mydb.commit()
    mydb.close()

def upload_worklot_prepare(worklot, file):
    mydb=mysql.connector.connect(host=hostname, user='root', passwd='123456', database="cutting_system")
    myCursor=mydb.cursor()
    thisTime=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    query=('replace into operation_scan_prepare (WORK_LOT, FILE, TimeUpdate) values (%s, %s, %s)')
    values=(worklot, file, thisTime)
    myCursor.execute(query, values)
    mydb.commit()
    mydb.close()
    
if __name__=="__main__":
#    loadLink='\\\\pbvfps1\\PBShare2\\Scan\\Pilot'
    loadLink='\\\\pbv-h0m2wv2\\BK_Bundle1\\Pilot'
    # loadLink='C:\\Users\\dule4\\Downloads\\IAScan'
    flag=True
    err=0
    while flag==True:
        try:
            entries=os.listdir(loadLink)
            for r, d, f in os.walk(loadLink):
                for entry in f:
                    if 'jpg' in entry:
                        if 'done' not in entry:
                            filePath=os.path.join(r, entry)
                            fileLink=r
                            nameFile=Path(filePath).stem
                            print(nameFile)
                            doneFile=fileLink+'\\'+nameFile+'_done.jpg'
                            image=cv2.imread(filePath)
                            output_img1, QC_ID, paper_type, worklot, bundle_list, ID_list, IRR_list, NIR_list, SLL_list, SLM_list, table_code=camera1Process(image)
                            #classified paper type:
                            # if paper_type=='CUTTIN':#sewing
                            #     check_irr(worklot, bundle_list, IRR_list, NIR_list, output_img1, nameFile, QC_ID)
                            #     output_img, barcode_dict = processSewing(worklot, bundle_list, ID_list, IRR_list, NIR_list, output_img1, nameFile)
                            #     check='0'
                            #     if len(ID_list)==len(barcode_dict) and len(bundle_list)==len(barcode_dict):
                            #         check='1'
                            #     scale=45
                            #     width=int(output_img.shape[1]*scale/100)
                            #     height=int(output_img.shape[0]*scale/100)
                            #     dim=(width, height)
                            #     output_img=cv2.resize(output_img, dim)
                            #     if os.path.isfile(doneFile):
                            #         nameFile=nameFile+'f'
                            #     if len(barcode_dict)>0:
                            #         uploadSewingData(QC_ID, barcode_dict, nameFile, check, worklot)
                            #     else:
                            #         uploadErrorData(nameFile)
                            #     try:
                            #         if checkticket(barcode_dict)==True:
                            #             print('okf1')
                            #             cv2.imwrite(fileLink+'\\'+nameFile+'_done.jpg', output_img)
                            #             os.remove(filePath)
                            #         else:
                            #             print('f1:'+filePath)
                            #     except:
                            #         print('cant delete file')
                            #         continue
                            if paper_type=='NCUTTIN':#non sewing
                                check_irr(worklot, bundle_list, IRR_list, NIR_list, output_img1, nameFile, QC_ID)
                                output_img, barcode_dict=processNonSewing(worklot, bundle_list, ID_list, IRR_list, NIR_list, output_img1, nameFile)
                                print(barcode_dict)
                                scale=45
                                width=int(output_img.shape[1]*scale/100)
                                height=int(output_img.shape[0]*scale/100)
                                dim=(width, height)
                                output_img=cv2.resize(output_img, dim)
                                if os.path.isfile(doneFile):
                                    nameFile=nameFile+'f'
                                if len(barcode_dict)>0 and worklot!='':
                                    uploadNonSewingData(QC_ID, barcode_dict, nameFile, '1', worklot)
                                else:
                                    uploadErrorData(nameFile)
                                    cv2.imwrite(fileLink+'\\'+nameFile+'_done.jpg', output_img)
                                    os.remove(filePath)
                                # try:
                                # cv2.imwrite(fileLink+'\\'+nameFile+'_done.jpg', output_img)
                                if checkticket(barcode_dict, worklot)==True and worklot!='':
                                    print('okf2')
                                    cv2.imwrite(fileLink+'\\'+nameFile+'_done.jpg', output_img)
                                    os.remove(filePath)
                                else:
                                    print('f2:'+filePath)
                                if worklot!='':
                                    upload_worklot_prepare(worklot, nameFile)
                                # except:
                                #     print('cant delete file')
                                #     continue
                            elif paper_type=='WLOTQC':#worklot qc
                                output_img, barcode_dict=processWorklotQC(ID_list, IRR_list, NIR_list, SLL_list, SLM_list, output_img1)
                                print(barcode_dict)
                                scale=45
                                width=int(output_img.shape[1]*scale/100)
                                height=int(output_img.shape[0]*scale/100)
                                dim=(width, height)
                                output_img=cv2.resize(output_img, dim)
                                if os.path.isfile(doneFile):
                                    nameFile=nameFile+'f'
                                if len(barcode_dict)>0 and worklot!='':
                                    upload_wlotQC(barcode_dict, worklot, QC_ID, nameFile, table_code)
                                else:
                                    uploadErrorData(nameFile)
                                # try:
                                # cv2.imwrite(fileLink+'\\'+nameFile+'_done.jpg', output_img)
                                # if checkticket(barcode_dict)==True:
                                #     print('okf2')
                                cv2.imwrite(fileLink+'\\'+nameFile+'_done.jpg', output_img)
                                os.remove(filePath)
                                # else:
                                #     print('f2:'+filePath)
                                # except:
                                #     print('cant delete file')
                                #     continue
                            else:
                                if os.path.isfile(doneFile):
                                    nameFile=nameFile+'f'
                                scale=40
                                width=int(image.shape[1]*scale/100)
                                height=int(image.shape[0]*scale/100)
                                dim=(width, height)
                                output_img=cv2.resize(image, dim)
                                uploadErrorData(nameFile)
                                cv2.imwrite(fileLink+'\\'+nameFile+'_done.jpg', output_img)
                                try:
                                    os.remove(filePath)
                                except:
                                    print('cant delete file')
                                    continue
        except:
            err=1
            print('something went wrong')
            continue
            time.sleep(1)
        H=datetime.now().hour
        M=datetime.now().minute
        if H==23 and M>=59:
            flag=False
            print('process stop now')