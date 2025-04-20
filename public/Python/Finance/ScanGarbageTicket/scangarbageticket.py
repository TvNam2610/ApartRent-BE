# -*- coding: utf-8 -*-
"""
Created on Mon Mar 16 22:56:36 2020

@author: dule4
"""
import sys
import cv2
from pyzbar import pyzbar
import time
import pandas as pd
import numpy as np
from pdf2image import convert_from_path
from pathlib import Path

def camera1Process(image):
    barcode_full_list=[]
    barcode_list=[]
    scale=70
    width=int(image.shape[1]*scale/100)
    height=int(image.shape[0]*scale/100)
    dim=(width, height)
    image=cv2.resize(image, dim)
    gray=cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    canny=cv2.Canny(gray, 100*3, 80*2, 3)
    blur=cv2.blur(canny, (9, 9))
    kernel = np.ones((5,5), np.uint8)
    img_dilate = cv2.dilate(blur, kernel, iterations=1)
    img_media=cv2.medianBlur(img_dilate, 3)
    _, threshold=cv2.threshold(img_media, 0, 255, cv2.THRESH_BINARY)
    _, contours, h=cv2.findContours(threshold.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:            
        (x, y, w, h)=cv2.boundingRect(cnt)
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
        scale=70
        width =int(subImg.shape[1]*scale/100)
        height=int(subImg.shape[0]*scale/100)
        dim=(width, height)
        scaled_img=cv2.resize(subImg, dim)
        barcode=0
        barcodes=pyzbar.decode(scaled_img)
        barcode_full_list.append(barcodes)
        if len(barcodes)>0:
            barcode=barcodes[0][0]
            if len(barcode)>0:
                if barcode[0] not in barcode_list:
                    barcode_list.append(str(barcode, 'utf-8'))
                    cv2.putText(image, str(barcode, 'utf-8'), (x,y), cv2.FONT_HERSHEY_SIMPLEX, 2, (255,0,0), 12)
                    cv2.rectangle(image, (x,y), (x+w,y+h), (255,0,0), 4)
    scale=70#70
    width=int(image.shape[1]*scale/100)
    height=int(image.shape[0]*scale/100)
    dim=(width, height)
    gray=cv2.resize(gray, dim)
    image=cv2.resize(image, dim)        
    barcodes=pyzbar.decode(gray)#image
    barcode_full_list.append(barcodes)
    for barcode in barcodes:
        if barcode[0] not in barcode_list:
            barcode_list.append(str(barcode[0], 'utf-8'))
            (x, y, w, h)=barcode.rect
            cv2.rectangle(image, (x,y), (x+w, y+h), (255,0,0), 4)
            cv2.putText(image, str(barcode[0], 'utf-8'), (x,y), cv2.FONT_HERSHEY_SIMPLEX, 2, (255,0,0), 4)
    barcode_array=np.unique(np.array(barcode_list))
    return image, barcode_array

pdfPath  = 'D:\\HanesApp\\public\\Python\\Finance\\ScanGarbageTicket\\pdf\\'
imagePath= 'D:\\HanesApp\\public\\Python\\Finance\\ScanGarbageTicket\\image\\'
excelPath= 'D:\\HanesApp\\public\\Python\\Finance\\ScanGarbageTicket\\excel\\'

def resizeImage(image, scale):
    width      = int(image.shape[1]*scale/100)
    height     = int(image.shape[0]*scale/100)
    dim        = (width, height)
    return       cv2.resize(image, dim)

if __name__=="__main__":
    pdfName   = sys.argv[1]
    fullLink=pdfPath+pdfName
    pages=convert_from_path(fullLink, dpi=400)
    nameFile=Path(fullLink).stem
    numofpage=0
    barcodeList= []
    for page in pages:
        image    = cv2.cvtColor(np.array(page), cv2.COLOR_RGB2BGR)    
        image    = resizeImage(image, 120)
        gray     = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        barcodes = pyzbar.decode(gray)
        numofBarcode=0
        for barcode in barcodes:
            bar  = str(barcode[0], 'utf-8')
            if bar not in barcodeList:
                barcodeList.append(bar)
                numofBarcode=numofBarcode+1
        #draw image
        for barcode in barcodes:
            (x, y, w, h)=barcode.rect
            cv2.rectangle(image, (x,y), (x+w, y+h), (0,0,255), 4)
            bar  = str(barcode[0],'utf-8')
            cv2.putText(image, bar, (x,y+h), cv2.FONT_HERSHEY_SIMPLEX, 2, (255,0,0), 10)
        cv2.putText(image, "Sum: "+str(numofBarcode), (10,100), cv2.FONT_HERSHEY_SIMPLEX, 2, (255,0,0), 10)
        output_img = resizeImage(image, 60)

        # output_img, barcodeList=camera1Process(image)

        cv2.imwrite(imagePath+nameFile+'_'+str(numofpage)+'.jpg', output_img)
        numofpage=numofpage+1
    dataset    = pd.DataFrame(
        {
            'Barcode':barcodeList,
        }        
    )
    dataset.to_excel(excelPath+nameFile+'_barcode.xlsx', index=False)
    print(nameFile+';'+str(numofpage))


